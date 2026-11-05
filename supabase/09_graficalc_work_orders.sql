-- Authoritative quote decisions, annual work-order numbering and append-only audit.
create table if not exists public.graficalc_quote_decisions (
  tenant_id uuid not null references public.graficalc_tenants(id) on delete cascade,
  quote_id text not null,
  decision text not null check (decision in ('approved', 'rejected')),
  quote_snapshot jsonb not null,
  decided_by uuid not null references auth.users(id),
  decided_at timestamptz not null default now(),
  primary key (tenant_id, quote_id)
);

create table if not exists public.graficalc_work_order_counters (
  tenant_id uuid not null references public.graficalc_tenants(id) on delete cascade,
  order_year integer not null,
  last_number integer not null default 0 check (last_number >= 0),
  primary key (tenant_id, order_year)
);

create table if not exists public.graficalc_work_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.graficalc_tenants(id) on delete cascade,
  quote_id text not null,
  order_year integer not null,
  sequence_number integer not null check (sequence_number > 0),
  os_number text not null,
  quote_snapshot jsonb not null,
  created_by uuid not null references auth.users(id),
  created_by_name text not null,
  responsible_user_id uuid not null references auth.users(id),
  responsible_name text not null,
  status text not null default 'production' check (status in ('production', 'ready', 'delivered')),
  promised_date date,
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, quote_id),
  unique (tenant_id, order_year, sequence_number),
  unique (tenant_id, os_number),
  check (paid_amount <= coalesce(nullif(quote_snapshot->>'total', '')::numeric, 0))
);

create table if not exists public.graficalc_work_order_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.graficalc_tenants(id) on delete cascade,
  work_order_id uuid not null references public.graficalc_work_orders(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  actor_name text not null,
  event_type text not null,
  description text not null,
  before_values jsonb not null default '{}'::jsonb,
  after_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists graficalc_work_orders_tenant_created_idx
  on public.graficalc_work_orders (tenant_id, created_at desc);
create index if not exists graficalc_work_order_events_order_idx
  on public.graficalc_work_order_events (tenant_id, work_order_id, created_at desc);

create or replace function public.graficalc_reject_work_order_event_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'work-order-events-are-append-only' using errcode = '42501';
end $$;
drop trigger if exists graficalc_work_order_events_append_only on public.graficalc_work_order_events;
create trigger graficalc_work_order_events_append_only
  before update or delete on public.graficalc_work_order_events
  for each row execute function public.graficalc_reject_work_order_event_mutation();

alter table public.graficalc_quote_decisions enable row level security;
alter table public.graficalc_work_order_counters enable row level security;
alter table public.graficalc_work_orders enable row level security;
alter table public.graficalc_work_order_events enable row level security;
revoke all on public.graficalc_quote_decisions, public.graficalc_work_order_counters,
  public.graficalc_work_orders, public.graficalc_work_order_events from public, anon, authenticated;
grant select, insert, update, delete on public.graficalc_quote_decisions,
  public.graficalc_work_order_counters, public.graficalc_work_orders,
  public.graficalc_work_order_events to service_role;
grant usage, select on sequence public.graficalc_work_order_events_id_seq to service_role;
revoke update, delete, truncate on public.graficalc_work_order_events from service_role;

create or replace function public.graficalc_decide_quote(
  p_tenant_id uuid, p_quote_id text, p_decision text, p_actor_user_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  quote_value jsonb;
  actor_name_value text;
begin
  if p_decision not in ('approved', 'rejected') or length(p_quote_id) > 120 then
    raise exception 'invalid-decision' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_actor_user_id and tenant_id = p_tenant_id) then
    raise exception 'actor-forbidden' using errcode = '42501';
  end if;
  if exists (select 1 from public.graficalc_work_orders where tenant_id = p_tenant_id and quote_id = p_quote_id) then
    raise exception 'quote-already-converted' using errcode = '23505';
  end if;
  select q.value into quote_value
  from public.graficalc_runtime_state r
  cross join lateral jsonb_array_elements(coalesce(r.payload->'sharedState'->'quoteHistory', '[]'::jsonb)) q(value)
  where r.tenant_id = p_tenant_id and q.value->>'id' = p_quote_id
  limit 1;
  if quote_value is null then raise exception 'quote-not-found' using errcode = 'P0002'; end if;
  select nome into actor_name_value from public.profiles where id = p_actor_user_id;
  insert into public.graficalc_quote_decisions (tenant_id, quote_id, decision, quote_snapshot, decided_by, decided_at)
  values (p_tenant_id, p_quote_id, p_decision, quote_value, p_actor_user_id, now())
  on conflict (tenant_id, quote_id) do update set
    decision = excluded.decision, quote_snapshot = excluded.quote_snapshot,
    decided_by = excluded.decided_by, decided_at = excluded.decided_at;
  return jsonb_build_object('decision', p_decision, 'decidedAt', now(), 'decidedBy', actor_name_value);
end $$;

create or replace function public.graficalc_create_work_order(
  p_tenant_id uuid, p_quote_id text, p_responsible_user_id uuid,
  p_promised_date date, p_paid_amount numeric, p_actor_user_id uuid
) returns public.graficalc_work_orders
language plpgsql security definer set search_path = '' as $$
declare
  existing public.graficalc_work_orders;
  quote_decision public.graficalc_quote_decisions;
  current_quote jsonb;
  actor_name_value text;
  responsible_name_value text;
  year_value integer := extract(year from (now() at time zone 'America/Sao_Paulo'))::integer;
  sequence_value integer;
  total_value numeric;
  inserted public.graficalc_work_orders;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_quote_id, 0));
  select * into existing from public.graficalc_work_orders where tenant_id = p_tenant_id and quote_id = p_quote_id;
  if found then return existing; end if;
  if not exists (select 1 from public.profiles where id = p_actor_user_id and tenant_id = p_tenant_id) then
    raise exception 'actor-forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_responsible_user_id and p.tenant_id = p_tenant_id
      and p.email_confirmado = true and (p.papel = 'funcionario' or exists (
        select 1 from public.graficalc_tenants t where t.id = p_tenant_id and t.owner_id = p.id
      ))) then
    raise exception 'responsible-not-in-team' using errcode = '22023';
  end if;
  select * into quote_decision from public.graficalc_quote_decisions
  where tenant_id = p_tenant_id and quote_id = p_quote_id and decision = 'approved';
  if not found then raise exception 'quote-not-approved' using errcode = '42501'; end if;
  select q.value into current_quote
  from public.graficalc_runtime_state r
  cross join lateral jsonb_array_elements(coalesce(r.payload->'sharedState'->'quoteHistory', '[]'::jsonb)) q(value)
  where r.tenant_id = p_tenant_id and q.value->>'id' = p_quote_id limit 1;
  if current_quote is null or current_quote is distinct from quote_decision.quote_snapshot then
    raise exception 'quote-changed-requires-approval' using errcode = '40001';
  end if;
  total_value := coalesce(nullif(quote_decision.quote_snapshot->>'total', '')::numeric, 0);
  if p_paid_amount < 0 or p_paid_amount > total_value then raise exception 'invalid-paid-amount' using errcode = '22023'; end if;
  select nome into actor_name_value from public.profiles where id = p_actor_user_id;
  select nome into responsible_name_value from public.profiles where id = p_responsible_user_id;
  insert into public.graficalc_work_order_counters (tenant_id, order_year, last_number)
  values (p_tenant_id, year_value, 1)
  on conflict (tenant_id, order_year) do update set last_number = public.graficalc_work_order_counters.last_number + 1
  returning last_number into sequence_value;
  insert into public.graficalc_work_orders (
    tenant_id, quote_id, order_year, sequence_number, os_number, quote_snapshot,
    created_by, created_by_name, responsible_user_id, responsible_name,
    promised_date, paid_amount
  ) values (
    p_tenant_id, p_quote_id, year_value, sequence_value,
    lpad(sequence_value::text, 5, '0') || '-' || year_value::text,
    quote_decision.quote_snapshot, p_actor_user_id, coalesce(actor_name_value, 'Usuário'),
    p_responsible_user_id, coalesce(responsible_name_value, 'Colaborador'),
    p_promised_date, p_paid_amount
  ) returning * into inserted;
  insert into public.graficalc_work_order_events (
    tenant_id, work_order_id, actor_user_id, actor_name, event_type, description, after_values
  ) values (
    p_tenant_id, inserted.id, p_actor_user_id, coalesce(actor_name_value, 'Usuário'), 'created',
    'Ordem de serviço criada a partir de orçamento aprovado.',
    jsonb_build_object('osNumber', inserted.os_number, 'responsible', inserted.responsible_name,
      'promisedDate', inserted.promised_date, 'paidAmount', inserted.paid_amount, 'status', inserted.status)
  );
  return inserted;
end $$;

create or replace function public.graficalc_update_work_order(
  p_tenant_id uuid, p_work_order_id uuid, p_actor_user_id uuid, p_patch jsonb
) returns public.graficalc_work_orders
language plpgsql security definer set search_path = '' as $$
declare
  before_row public.graficalc_work_orders;
  after_row public.graficalc_work_orders;
  actor_name_value text;
  responsible_name_value text;
  paid_value numeric;
  promised_value date;
  notes_value text;
  responsible_value uuid;
  changed jsonb := '{}'::jsonb;
begin
  select * into before_row from public.graficalc_work_orders
  where id = p_work_order_id and tenant_id = p_tenant_id for update;
  if not found then raise exception 'work-order-not-found' using errcode = 'P0002'; end if;
  if before_row.responsible_user_id <> p_actor_user_id then raise exception 'responsible-required' using errcode = '42501'; end if;
  select nome into actor_name_value from public.profiles where id = p_actor_user_id and tenant_id = p_tenant_id;
  if actor_name_value is null then raise exception 'actor-forbidden' using errcode = '42501'; end if;
  paid_value := case when p_patch ? 'paidAmount' then (p_patch->>'paidAmount')::numeric else before_row.paid_amount end;
  promised_value := case when p_patch ? 'promisedDate' and nullif(p_patch->>'promisedDate','') is not null then (p_patch->>'promisedDate')::date
    when p_patch ? 'promisedDate' then null else before_row.promised_date end;
  notes_value := case when p_patch ? 'notes' then left(coalesce(p_patch->>'notes',''), 2000) else before_row.notes end;
  responsible_value := case when p_patch ? 'responsibleUserId' then (p_patch->>'responsibleUserId')::uuid else before_row.responsible_user_id end;
  if not exists (select 1 from public.profiles p where p.id = responsible_value and p.tenant_id = p_tenant_id
      and p.email_confirmado = true and (p.papel = 'funcionario' or exists (
        select 1 from public.graficalc_tenants t where t.id = p_tenant_id and t.owner_id = p.id
      ))) then
    raise exception 'responsible-not-in-team' using errcode = '22023';
  end if;
  if paid_value < 0 or paid_value > coalesce(nullif(before_row.quote_snapshot->>'total','')::numeric,0) then
    raise exception 'invalid-paid-amount' using errcode = '22023';
  end if;
  select nome into responsible_name_value from public.profiles where id = responsible_value;
  if paid_value is distinct from before_row.paid_amount then changed := changed || jsonb_build_object('paidAmount', paid_value); end if;
  if promised_value is distinct from before_row.promised_date then changed := changed || jsonb_build_object('promisedDate', promised_value); end if;
  if notes_value is distinct from before_row.notes then changed := changed || jsonb_build_object('notes', notes_value); end if;
  if responsible_value is distinct from before_row.responsible_user_id then
    changed := changed || jsonb_build_object('responsibleUserId', responsible_value, 'responsibleName', responsible_name_value);
  end if;
  update public.graficalc_work_orders set
    paid_amount = paid_value, promised_date = promised_value, notes = notes_value,
    responsible_user_id = responsible_value, responsible_name = coalesce(responsible_name_value, 'Colaborador'), updated_at = now()
  where id = p_work_order_id returning * into after_row;
  if changed <> '{}'::jsonb then
    insert into public.graficalc_work_order_events (
      tenant_id, work_order_id, actor_user_id, actor_name, event_type, description, before_values, after_values
    ) values (p_tenant_id, after_row.id, p_actor_user_id, actor_name_value, 'updated',
      'Dados da ordem de serviço atualizados.',
      jsonb_build_object('paidAmount', before_row.paid_amount, 'promisedDate', before_row.promised_date,
        'notes', before_row.notes, 'responsibleUserId', before_row.responsible_user_id, 'responsibleName', before_row.responsible_name),
      changed);
  end if;
  return after_row;
end $$;

create or replace function public.graficalc_change_work_order_status(
  p_tenant_id uuid, p_work_order_id uuid, p_actor_user_id uuid, p_status text
) returns public.graficalc_work_orders
language plpgsql security definer set search_path = '' as $$
declare
  before_row public.graficalc_work_orders;
  after_row public.graficalc_work_orders;
  actor_name_value text;
begin
  if p_status not in ('production', 'ready', 'delivered') then raise exception 'invalid-status' using errcode = '22023'; end if;
  select * into before_row from public.graficalc_work_orders
  where id = p_work_order_id and tenant_id = p_tenant_id for update;
  if not found then raise exception 'work-order-not-found' using errcode = 'P0002'; end if;
  if before_row.responsible_user_id <> p_actor_user_id then raise exception 'responsible-required' using errcode = '42501'; end if;
  if before_row.status = p_status then return before_row; end if;
  select nome into actor_name_value from public.profiles where id = p_actor_user_id and tenant_id = p_tenant_id;
  if actor_name_value is null then raise exception 'actor-forbidden' using errcode = '42501'; end if;
  update public.graficalc_work_orders set status = p_status, updated_at = now()
  where id = p_work_order_id returning * into after_row;
  insert into public.graficalc_work_order_events (
    tenant_id, work_order_id, actor_user_id, actor_name, event_type, description, before_values, after_values
  ) values (p_tenant_id, after_row.id, p_actor_user_id, actor_name_value, 'status_changed',
    'Status da ordem de serviço alterado.', jsonb_build_object('status', before_row.status),
    jsonb_build_object('status', after_row.status));
  return after_row;
end $$;

revoke execute on function public.graficalc_decide_quote(uuid, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.graficalc_create_work_order(uuid, text, uuid, date, numeric, uuid) from public, anon, authenticated;
revoke execute on function public.graficalc_update_work_order(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.graficalc_change_work_order_status(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.graficalc_decide_quote(uuid, text, text, uuid) to service_role;
grant execute on function public.graficalc_create_work_order(uuid, text, uuid, date, numeric, uuid) to service_role;
grant execute on function public.graficalc_update_work_order(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.graficalc_change_work_order_status(uuid, uuid, uuid, text) to service_role;
