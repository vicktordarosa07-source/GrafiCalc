-- GrafiCalc billing foundation. Apply only to a dedicated test project first.
-- This repository stores dashboard-ready SQL scripts in supabase/; the Supabase
-- CLI is not installed in this workstation, so this file follows that convention.

create table if not exists public.graficalc_billing_checkouts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.graficalc_tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  external_reference uuid not null unique default gen_random_uuid(),
  plan_key text not null check (length(plan_key) between 1 and 40),
  plan_name text not null check (length(plan_name) between 1 and 80),
  billing_cycle text not null check (billing_cycle in ('monthly', 'annual')),
  amount_cents bigint not null check (amount_cents > 0),
  trial_days integer not null default 0 check (trial_days between 0 and 365),
  grace_days integer not null default 0 check (grace_days between 0 and 60),
  status text not null default 'creating' check (status in ('creating', 'pending', 'paid', 'expired', 'canceled', 'failed', 'review')),
  provider text not null default 'asaas' check (provider = 'asaas'),
  provider_checkout_id text unique,
  checkout_url text,
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists graficalc_billing_one_open_checkout_per_tenant
  on public.graficalc_billing_checkouts(tenant_id)
  where status in ('creating', 'pending');
create index if not exists graficalc_billing_checkouts_tenant_created_idx
  on public.graficalc_billing_checkouts(tenant_id, created_at desc);

create table if not exists public.graficalc_billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.graficalc_tenants(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete restrict,
  provider text not null default 'asaas' check (provider = 'asaas'),
  provider_customer_id text,
  provider_subscription_id text unique,
  provider_subscription_event_at timestamptz,
  last_payment_id text,
  last_payment_at timestamptz,
  plan_key text,
  plan_name text,
  billing_cycle text check (billing_cycle in ('monthly', 'annual')),
  amount_cents bigint check (amount_cents is null or amount_cents > 0),
  status text not null default 'legacy_access' check (status in ('legacy_access', 'pending', 'trialing', 'active', 'past_due', 'canceled', 'expired', 'refunded', 'review')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_days integer not null default 0 check (grace_days between 0 and 60),
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'trialing' or trial_ends_at is not null),
  check (status not in ('active', 'past_due') or current_period_end is not null)
);

create table if not exists public.graficalc_billing_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.graficalc_tenants(id) on delete restrict,
  checkout_id uuid references public.graficalc_billing_checkouts(id) on delete set null,
  provider_payment_id text not null unique,
  provider_subscription_id text,
  amount_cents bigint not null check (amount_cents >= 0),
  status text not null check (status in ('pending', 'confirmed', 'paid', 'overdue', 'refunded', 'review', 'canceled')),
  due_at timestamptz,
  paid_at timestamptz,
  invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.graficalc_billing_provider_subscriptions (
  provider_subscription_id text primary key check (length(provider_subscription_id) between 1 and 200),
  tenant_id uuid not null references public.graficalc_tenants(id) on delete restrict,
  checkout_id uuid references public.graficalc_billing_checkouts(id) on delete set null,
  provider_customer_id text,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists graficalc_billing_provider_subscriptions_tenant_idx
  on public.graficalc_billing_provider_subscriptions(tenant_id);
create index if not exists graficalc_billing_payments_tenant_created_idx
  on public.graficalc_billing_payments(tenant_id, created_at desc);

create table if not exists public.graficalc_billing_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event_type text not null check (length(event_type) between 1 and 100),
  resource_id text,
  payload jsonb,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  processing_started_at timestamptz,
  processed_at timestamptz,
  error_code text,
  received_at timestamptz not null default now()
);

alter table public.graficalc_billing_events add column if not exists payload jsonb;
create index if not exists graficalc_billing_events_queue_idx
  on public.graficalc_billing_events(status, received_at)
  where status in ('received', 'failed', 'processing');

alter table public.graficalc_billing_subscriptions
  add column if not exists provider_subscription_event_at timestamptz;

insert into public.graficalc_billing_provider_subscriptions (
  provider_subscription_id, tenant_id, provider_customer_id, last_event_at
)
select provider_subscription_id, tenant_id, provider_customer_id, provider_subscription_event_at
from public.graficalc_billing_subscriptions
where provider_subscription_id is not null
on conflict (provider_subscription_id) do nothing;

alter table public.graficalc_billing_checkouts enable row level security;
alter table public.graficalc_billing_subscriptions enable row level security;
alter table public.graficalc_billing_payments enable row level security;
alter table public.graficalc_billing_events enable row level security;
alter table public.graficalc_billing_provider_subscriptions enable row level security;

revoke all on public.graficalc_billing_checkouts from public, anon, authenticated, service_role;
revoke all on public.graficalc_billing_subscriptions from public, anon, authenticated, service_role;
revoke all on public.graficalc_billing_payments from public, anon, authenticated, service_role;
revoke all on public.graficalc_billing_events from public, anon, authenticated, service_role;
revoke all on public.graficalc_billing_provider_subscriptions from public, anon, authenticated, service_role;
grant select, insert, update on public.graficalc_billing_checkouts to service_role;
grant select, insert, update on public.graficalc_billing_subscriptions to service_role;
grant select, insert, update on public.graficalc_billing_payments to service_role;
grant select, insert, update on public.graficalc_billing_events to service_role;
grant select, insert, update on public.graficalc_billing_provider_subscriptions to service_role;

-- Existing tenants retain the access they already had at the moment billing is
-- introduced. This is a one-time grandfathering snapshot, not a plan price.
insert into public.graficalc_billing_subscriptions (tenant_id, owner_id, status)
select tenant.id, tenant.owner_id, 'legacy_access'
from public.graficalc_tenants as tenant
where tenant.owner_id is not null
on conflict (tenant_id) do nothing;

create or replace function public.graficalc_claim_billing_checkout(
  p_tenant_id uuid,
  p_user_id uuid,
  p_plan_key text,
  p_plan_name text,
  p_billing_cycle text,
  p_amount_cents bigint,
  p_trial_days integer,
  p_grace_days integer,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_row public.graficalc_billing_checkouts%rowtype;
  inserted_row public.graficalc_billing_checkouts%rowtype;
  v_trial_started_at timestamptz;
begin
  if p_amount_cents <= 0 or p_plan_key is null or length(p_plan_key) > 40
    or p_billing_cycle not in ('monthly', 'annual')
    or p_trial_days not between 0 and 365 or p_grace_days not between 0 and 60
    or p_expires_at <= now() then
    raise exception using errcode = '22023', message = 'invalid_billing_checkout';
  end if;

  perform 1 from public.graficalc_tenants
  where id = p_tenant_id and owner_id = p_user_id
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'billing_owner_required';
  end if;

  select trial_started_at into v_trial_started_at
  from public.graficalc_billing_subscriptions
  where tenant_id = p_tenant_id
  for update;
  if p_trial_days > 0 and v_trial_started_at is not null then
    return jsonb_build_object('action', 'trial-used');
  end if;

  select * into existing_row from public.graficalc_billing_checkouts
  where tenant_id = p_tenant_id and status in ('creating', 'pending')
    and expires_at > now()
  order by created_at desc limit 1 for update;
  if found then
    if existing_row.plan_key = p_plan_key and existing_row.checkout_url is not null then
      return jsonb_build_object('action', 'reuse', 'checkoutId', existing_row.id,
        'providerCheckoutId', existing_row.provider_checkout_id,
        'checkoutUrl', existing_row.checkout_url, 'expiresAt', existing_row.expires_at);
    end if;
    return jsonb_build_object('action', 'busy');
  end if;

  update public.graficalc_billing_checkouts
  set status = 'expired', updated_at = now()
  where tenant_id = p_tenant_id and status in ('creating', 'pending') and expires_at <= now();

  insert into public.graficalc_billing_checkouts (
    tenant_id, user_id, plan_key, plan_name, billing_cycle, amount_cents,
    trial_days, grace_days, expires_at
  ) values (
    p_tenant_id, p_user_id, p_plan_key, p_plan_name, p_billing_cycle, p_amount_cents,
    p_trial_days, p_grace_days, p_expires_at
  ) returning * into inserted_row;

  return jsonb_build_object('action', 'create', 'checkoutId', inserted_row.id,
    'externalReference', inserted_row.external_reference, 'expiresAt', inserted_row.expires_at);
end;
$$;

revoke all on function public.graficalc_claim_billing_checkout(uuid, uuid, text, text, text, bigint, integer, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.graficalc_claim_billing_checkout(uuid, uuid, text, text, text, bigint, integer, integer, timestamptz) to service_role;

create or replace function public.graficalc_claim_billing_events(
  p_limit integer,
  p_stale_before timestamptz
)
returns table (
  provider_event_id text,
  event_type text,
  payload jsonb,
  attempt_count integer
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_limit is null or p_limit not between 1 and 50
    or p_stale_before is null or not isfinite(p_stale_before) then
    raise exception using errcode = '22023', message = 'invalid_billing_event_claim';
  end if;

  return query
  with candidates as (
    select event.id
    from public.graficalc_billing_events as event
    where event.payload is not null
      and (event.status in ('received', 'failed')
        or (event.status = 'processing' and event.processing_started_at < p_stale_before))
    order by event.received_at asc, event.id asc
    for update skip locked
    limit p_limit
  )
  update public.graficalc_billing_events as event
  set status = 'processing',
      processing_started_at = now(),
      attempt_count = event.attempt_count + 1,
      error_code = null
  from candidates
  where event.id = candidates.id
  returning event.provider_event_id, event.event_type, event.payload, event.attempt_count;
end;
$$;

revoke all on function public.graficalc_claim_billing_events(integer, timestamptz) from public, anon, authenticated;
grant execute on function public.graficalc_claim_billing_events(integer, timestamptz) to service_role;

create or replace function public.graficalc_apply_billing_payment_event(
  p_tenant_id uuid,
  p_owner_id uuid,
  p_checkout_id uuid,
  p_provider_payment_id text,
  p_provider_subscription_id text,
  p_amount_cents bigint,
  p_event_type text,
  p_event_state text,
  p_amount_mismatch boolean,
  p_due_at timestamptz,
  p_payment_at timestamptz,
  p_invoice_url text,
  p_plan_key text,
  p_plan_name text,
  p_billing_cycle text,
  p_grace_days integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_subscription public.graficalc_billing_subscriptions%rowtype;
  v_checkout public.graficalc_billing_checkouts%rowtype;
  v_provider_subscription public.graficalc_billing_provider_subscriptions%rowtype;
  v_prior_tenant_id uuid;
  v_prior_status text;
  v_prior_paid_at timestamptz;
  v_next_state text;
  v_payment_at timestamptz := coalesce(p_payment_at, now());
  v_base_period timestamptz;
  v_candidate_end timestamptz;
  v_current_end timestamptz;
  v_historical_payment boolean := false;
  v_checkout_granted_annual_period boolean := false;
begin
  if p_tenant_id is null or p_provider_payment_id is null or length(p_provider_payment_id) not between 1 and 200
    or p_provider_subscription_id is not null and length(p_provider_subscription_id) > 200
    or p_event_type is null or length(p_event_type) not between 1 and 100
    or p_amount_cents is null or p_amount_cents < 0
    or p_event_state is null or p_event_state not in ('pending', 'paid', 'overdue', 'refunded', 'review', 'canceled')
    or p_amount_mismatch is null
    or (p_due_at is not null and not isfinite(p_due_at))
    or (p_payment_at is not null and not isfinite(p_payment_at)) then
    raise exception using errcode = '22023', message = 'invalid_billing_payment_event';
  end if;

  if p_owner_id is not null then
    if not exists (
      select 1 from public.graficalc_tenants
      where id = p_tenant_id and owner_id = p_owner_id
    ) then
      raise exception using errcode = '42501', message = 'billing_owner_required';
    end if;
    if p_billing_cycle not in ('monthly', 'annual') or p_plan_key is null or p_plan_name is null
      or p_grace_days is null or p_grace_days not between 0 and 60 then
      raise exception using errcode = '22023', message = 'invalid_billing_subscription_snapshot';
    end if;
    insert into public.graficalc_billing_subscriptions (
      tenant_id, owner_id, provider, plan_key, plan_name, billing_cycle, amount_cents, status, grace_days
    ) values (
      p_tenant_id, p_owner_id, 'asaas', p_plan_key, p_plan_name, p_billing_cycle, p_amount_cents, 'pending', p_grace_days
    ) on conflict (tenant_id) do nothing;
  end if;

  select * into v_subscription
  from public.graficalc_billing_subscriptions
  where tenant_id = p_tenant_id
  for update;
  if not found then
    raise exception using errcode = '23503', message = 'billing_subscription_not_found';
  end if;

  if p_checkout_id is not null then
    select * into v_checkout
    from public.graficalc_billing_checkouts
    where id = p_checkout_id and tenant_id = p_tenant_id
    for update;
    if not found then
      raise exception using errcode = '23503', message = 'billing_checkout_not_found';
    end if;
    if p_owner_id is not null and v_checkout.user_id <> p_owner_id then
      raise exception using errcode = '42501', message = 'billing_checkout_owner_mismatch';
    end if;
  end if;

  if p_provider_subscription_id is not null and p_provider_subscription_id <> '' then
    select * into v_provider_subscription
    from public.graficalc_billing_provider_subscriptions
    where provider_subscription_id = p_provider_subscription_id
    for update;
    if found then
      if v_provider_subscription.tenant_id <> p_tenant_id then
        raise exception using errcode = '23505', message = 'billing_provider_subscription_mismatch';
      end if;
      if p_checkout_id is not null and v_provider_subscription.checkout_id is not null
        and v_provider_subscription.checkout_id <> p_checkout_id then
        raise exception using errcode = '23505', message = 'billing_provider_subscription_checkout_mismatch';
      end if;
    elsif p_checkout_id is not null then
      insert into public.graficalc_billing_provider_subscriptions (
        provider_subscription_id, tenant_id, checkout_id, provider_customer_id
      ) values (
        p_provider_subscription_id, p_tenant_id, p_checkout_id, v_subscription.provider_customer_id
      );
    else
      raise exception using errcode = '23503', message = 'billing_provider_subscription_not_registered';
    end if;
  end if;

  select tenant_id, status, paid_at into v_prior_tenant_id, v_prior_status, v_prior_paid_at
  from public.graficalc_billing_payments
  where provider_payment_id = p_provider_payment_id
  for update;
  if not found then
    v_prior_tenant_id := null;
    v_prior_status := null;
    v_prior_paid_at := null;
  elsif v_prior_tenant_id <> p_tenant_id then
    raise exception using errcode = '23505', message = 'billing_payment_tenant_mismatch';
  end if;

  v_next_state := p_event_state;
  if p_amount_mismatch then
    v_next_state := 'review';
  elsif p_event_type = 'PAYMENT_REFUND_DENIED' then
    v_next_state := 'paid';
  elsif v_prior_status = 'refunded' then
    v_next_state := 'refunded';
  elsif v_prior_status = 'review' and p_event_type not in ('PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED') then
    v_next_state := 'review';
  elsif v_prior_status in ('paid', 'confirmed') and p_event_state in ('pending', 'overdue', 'canceled') then
    v_next_state := 'paid';
  elsif v_prior_status = 'overdue' and p_event_state = 'pending' then
    v_next_state := 'overdue';
  end if;

  insert into public.graficalc_billing_payments as saved_payment (
    tenant_id, checkout_id, provider_payment_id, provider_subscription_id,
    amount_cents, status, due_at, paid_at, invoice_url
  ) values (
    p_tenant_id, p_checkout_id, p_provider_payment_id, nullif(p_provider_subscription_id, ''),
    p_amount_cents, v_next_state, p_due_at,
    case when v_next_state = 'paid' then v_payment_at else null end,
    p_invoice_url
  ) on conflict (provider_payment_id) do update set
    checkout_id = coalesce(excluded.checkout_id, saved_payment.checkout_id),
    provider_subscription_id = coalesce(excluded.provider_subscription_id, saved_payment.provider_subscription_id),
    amount_cents = excluded.amount_cents,
    status = excluded.status,
    due_at = coalesce(excluded.due_at, saved_payment.due_at),
    paid_at = case when excluded.status = 'paid'
      then coalesce(saved_payment.paid_at, excluded.paid_at)
      else saved_payment.paid_at end,
    invoice_url = coalesce(excluded.invoice_url, saved_payment.invoice_url),
    updated_at = now();

  if p_provider_subscription_id is not null and p_provider_subscription_id <> ''
    and (v_subscription.provider_subscription_id is null
      or v_subscription.provider_subscription_id = p_provider_subscription_id
      or (p_checkout_id is not null and v_checkout.id is not null
        and v_checkout.user_id = p_owner_id
        and v_checkout.created_at <= v_payment_at
        and (v_checkout.status in ('creating', 'pending', 'paid'))
        and (v_subscription.status = 'legacy_access'
          or (v_subscription.status = 'trialing' and v_subscription.trial_ends_at <= v_payment_at)
          or (v_subscription.status in ('active', 'canceled')
            and (v_subscription.current_period_end is null or v_subscription.current_period_end <= v_payment_at))
          or (v_subscription.status = 'past_due'
            and (v_subscription.current_period_end is null
              or v_subscription.current_period_end + make_interval(days => v_subscription.grace_days) <= v_payment_at))
          or v_subscription.status in ('pending', 'expired', 'refunded')))) then
    update public.graficalc_billing_subscriptions
    set provider_subscription_id = p_provider_subscription_id,
        provider_subscription_event_at = null,
        provider_customer_id = coalesce(nullif(v_provider_subscription.provider_customer_id, ''), provider_customer_id),
        updated_at = now()
    where tenant_id = p_tenant_id;
    v_subscription.provider_subscription_id := p_provider_subscription_id;
    v_subscription.provider_subscription_event_at := null;
  end if;

  v_historical_payment := (v_prior_paid_at is not null
    and v_subscription.last_payment_id is distinct from p_provider_payment_id)
    or (v_subscription.last_payment_at is not null
      and v_subscription.last_payment_id is distinct from p_provider_payment_id
      and v_payment_at < v_subscription.last_payment_at)
    or (p_provider_subscription_id is not null and p_provider_subscription_id <> ''
      and v_subscription.provider_subscription_id is not null
      and v_subscription.provider_subscription_id <> p_provider_subscription_id);

  if v_next_state = 'paid' then
    if not v_historical_payment then
      if v_subscription.last_payment_id is distinct from p_provider_payment_id then
        v_checkout_granted_annual_period := false;
        if p_checkout_id is not null and v_checkout.status = 'paid' and v_checkout.billing_cycle = 'annual'
          and v_subscription.current_period_end > v_payment_at then
          v_checkout_granted_annual_period := true;
        end if;

        v_current_end := v_subscription.current_period_end;
        if not v_checkout_granted_annual_period then
          v_base_period := case when v_current_end is not null and v_current_end > v_payment_at
            then v_current_end else v_payment_at end;
          v_candidate_end := v_base_period + make_interval(months => case when v_subscription.billing_cycle = 'annual' then 12 else 1 end);
          if v_current_end is not null and v_current_end > v_candidate_end then
            v_candidate_end := v_current_end;
          end if;
          update public.graficalc_billing_subscriptions set
            status = 'active', trial_ends_at = null, last_payment_id = p_provider_payment_id,
            last_payment_at = v_payment_at,
            current_period_start = case when v_current_end is not null and v_current_end > v_payment_at then v_current_end else v_payment_at end,
            current_period_end = v_candidate_end, updated_at = now()
          where tenant_id = p_tenant_id;
        else
          update public.graficalc_billing_subscriptions set
            status = 'active', trial_ends_at = null, last_payment_id = p_provider_payment_id,
            last_payment_at = v_payment_at, updated_at = now()
          where tenant_id = p_tenant_id;
        end if;
      elsif v_subscription.status in ('review', 'refunded') then
        update public.graficalc_billing_subscriptions
        set status = 'active', trial_ends_at = null, last_payment_at = coalesce(last_payment_at, v_payment_at), updated_at = now()
        where tenant_id = p_tenant_id;
      end if;
    end if;

    if p_checkout_id is not null then
      update public.graficalc_billing_checkouts
      set status = 'paid', paid_at = coalesce(paid_at, v_payment_at), updated_at = now()
      where id = p_checkout_id and tenant_id = p_tenant_id;
    end if;
  elsif v_next_state = 'overdue' then
    if not v_historical_payment then
      update public.graficalc_billing_subscriptions set status = 'past_due', updated_at = now()
      where tenant_id = p_tenant_id;
    end if;
  elsif v_next_state = 'refunded' then
    if not v_historical_payment then
      update public.graficalc_billing_subscriptions set status = 'refunded', updated_at = now()
      where tenant_id = p_tenant_id;
    end if;
  elsif v_next_state = 'review' then
    if not v_historical_payment then
      update public.graficalc_billing_subscriptions set status = 'review', updated_at = now()
      where tenant_id = p_tenant_id;
    end if;
  elsif v_next_state = 'canceled' then
    if not v_historical_payment then
      update public.graficalc_billing_subscriptions set status = 'canceled', updated_at = now()
      where tenant_id = p_tenant_id;
    end if;
  end if;

  return jsonb_build_object('status', v_next_state, 'historicalPayment', v_historical_payment);
end;
$$;

revoke all on function public.graficalc_apply_billing_payment_event(uuid, uuid, uuid, text, text, bigint, text, text, boolean, timestamptz, timestamptz, text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.graficalc_apply_billing_payment_event(uuid, uuid, uuid, text, text, bigint, text, text, boolean, timestamptz, timestamptz, text, text, text, text, integer) to service_role;

create or replace function public.graficalc_apply_billing_subscription_event(
  p_tenant_id uuid,
  p_provider_subscription_id text,
  p_checkout_id uuid,
  p_event_type text,
  p_event_at timestamptz,
  p_provider_customer_id text,
  p_provider_status text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_subscription public.graficalc_billing_subscriptions%rowtype;
  v_checkout public.graficalc_billing_checkouts%rowtype;
  v_provider_subscription public.graficalc_billing_provider_subscriptions%rowtype;
  v_next_status text;
  v_rows integer;
begin
  if p_tenant_id is null
    or p_provider_subscription_id is null or length(p_provider_subscription_id) not between 1 and 200
    or p_event_type is null or p_event_type not in ('SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_INACTIVATED', 'SUBSCRIPTION_DELETED')
    or p_event_at is null or not isfinite(p_event_at)
    or p_provider_customer_id is not null and length(p_provider_customer_id) > 200
    or p_provider_status is not null and length(p_provider_status) > 40 then
    raise exception using errcode = '22023', message = 'invalid_billing_subscription_event';
  end if;

  select * into v_subscription
  from public.graficalc_billing_subscriptions
  where tenant_id = p_tenant_id
  for update;
  if not found then
    raise exception using errcode = '23503', message = 'billing_subscription_not_found';
  end if;

  if p_checkout_id is not null then
    select * into v_checkout
    from public.graficalc_billing_checkouts
    where id = p_checkout_id and tenant_id = p_tenant_id
    for update;
    if not found then
      raise exception using errcode = '23503', message = 'billing_checkout_not_found';
    end if;
    if v_checkout.status not in ('creating', 'pending', 'paid')
      or (v_checkout.status <> 'paid' and v_checkout.expires_at <= p_event_at) then
      raise exception using errcode = '23503', message = 'billing_checkout_not_eligible';
    end if;
  end if;

  select * into v_provider_subscription
  from public.graficalc_billing_provider_subscriptions
  where provider_subscription_id = p_provider_subscription_id
  for update;

  if found then
    if v_provider_subscription.tenant_id <> p_tenant_id then
      raise exception using errcode = '23505', message = 'billing_provider_subscription_mismatch';
    end if;
    if p_checkout_id is not null and v_provider_subscription.checkout_id is not null
      and v_provider_subscription.checkout_id <> p_checkout_id then
      raise exception using errcode = '23505', message = 'billing_provider_subscription_checkout_mismatch';
    end if;
    if v_provider_subscription.last_event_at is not null and p_event_at <= v_provider_subscription.last_event_at then
      return jsonb_build_object('ignored', true, 'reason', 'stale_subscription_event');
    end if;
    if v_subscription.provider_subscription_id is not null
      and v_subscription.provider_subscription_id <> p_provider_subscription_id then
      update public.graficalc_billing_provider_subscriptions set
        last_event_at = p_event_at,
        provider_customer_id = coalesce(nullif(p_provider_customer_id, ''), provider_customer_id),
        updated_at = now()
      where provider_subscription_id = p_provider_subscription_id;
      return jsonb_build_object('ignored', true, 'reason', 'superseded_provider_subscription');
    end if;
  elsif v_subscription.provider_subscription_id is not null
    and v_subscription.provider_subscription_id <> p_provider_subscription_id then
    if p_checkout_id is null then
      raise exception using errcode = '23505', message = 'billing_provider_subscription_mismatch';
    end if;
    if (v_subscription.status = 'trialing' and v_subscription.trial_ends_at > p_event_at)
      or (v_subscription.status in ('active', 'canceled') and v_subscription.current_period_end > p_event_at)
      or (v_subscription.status = 'past_due'
        and v_subscription.current_period_end + make_interval(days => v_subscription.grace_days) > p_event_at) then
      raise exception using errcode = '23505', message = 'billing_provider_subscription_mismatch';
    end if;
  end if;

  if v_subscription.provider_subscription_id is not null
    and v_subscription.provider_subscription_id = p_provider_subscription_id
    and v_subscription.provider_subscription_event_at is not null
    and p_event_at <= v_subscription.provider_subscription_event_at then
    return jsonb_build_object('ignored', true, 'reason', 'stale_subscription_event');
  end if;

  insert into public.graficalc_billing_provider_subscriptions (
    provider_subscription_id, tenant_id, checkout_id, provider_customer_id, last_event_at
  ) values (
    p_provider_subscription_id, p_tenant_id, p_checkout_id, nullif(p_provider_customer_id, ''), p_event_at
  ) on conflict (provider_subscription_id) do update set
    checkout_id = coalesce(excluded.checkout_id, public.graficalc_billing_provider_subscriptions.checkout_id),
    provider_customer_id = coalesce(excluded.provider_customer_id, public.graficalc_billing_provider_subscriptions.provider_customer_id),
    last_event_at = greatest(public.graficalc_billing_provider_subscriptions.last_event_at, excluded.last_event_at),
    updated_at = now()
  where public.graficalc_billing_provider_subscriptions.tenant_id = excluded.tenant_id
    and (public.graficalc_billing_provider_subscriptions.checkout_id is null
      or excluded.checkout_id is null
      or public.graficalc_billing_provider_subscriptions.checkout_id = excluded.checkout_id);
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception using errcode = '23505', message = 'billing_provider_subscription_mismatch';
  end if;

  v_next_status := v_subscription.status;
  if p_event_type in ('SUBSCRIPTION_INACTIVATED', 'SUBSCRIPTION_DELETED') then
    v_next_status := 'canceled';
  elsif p_provider_status = 'ACTIVE' and v_subscription.status = 'canceled'
    and v_subscription.current_period_end is not null and v_subscription.current_period_end > p_event_at then
    v_next_status := 'active';
  end if;

  update public.graficalc_billing_subscriptions set
    provider_subscription_id = p_provider_subscription_id,
    provider_customer_id = coalesce(nullif(p_provider_customer_id, ''), provider_customer_id),
    provider_subscription_event_at = p_event_at,
    status = v_next_status,
    cancel_at_period_end = case
      when p_event_type = 'SUBSCRIPTION_UPDATED' and p_provider_status = 'ACTIVE' and v_next_status = 'active' then false
      else cancel_at_period_end
    end,
    canceled_at = case when v_next_status = 'canceled' then coalesce(canceled_at, p_event_at) else null end,
    updated_at = now()
  where tenant_id = p_tenant_id;

  return jsonb_build_object('status', v_next_status, 'ignored', false);
end;
$$;

revoke all on function public.graficalc_apply_billing_subscription_event(uuid, text, uuid, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.graficalc_apply_billing_subscription_event(uuid, text, uuid, text, timestamptz, text, text) to service_role;

create or replace function public.graficalc_apply_billing_checkout_event(
  p_provider_checkout_id text,
  p_event_type text,
  p_event_at timestamptz,
  p_items_valid boolean,
  p_total_amount_cents bigint,
  p_provider_customer_id text,
  p_provider_subscription_id text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_checkout public.graficalc_billing_checkouts%rowtype;
  v_subscription public.graficalc_billing_subscriptions%rowtype;
  v_provider_subscription public.graficalc_billing_provider_subscriptions%rowtype;
  v_trial_end timestamptz;
  v_period_end timestamptz;
  v_status text;
  v_rows integer;
begin
  if p_provider_checkout_id is null or length(p_provider_checkout_id) not between 1 and 200
    or p_event_type is null or p_event_type not in ('CHECKOUT_PAID', 'CHECKOUT_CANCELED', 'CHECKOUT_EXPIRED')
    or p_event_at is null or not isfinite(p_event_at)
    or p_items_valid is null or p_total_amount_cents is null or p_total_amount_cents < 0
    or p_provider_customer_id is not null and length(p_provider_customer_id) > 200
    or p_provider_subscription_id is not null and length(p_provider_subscription_id) > 200 then
    raise exception using errcode = '22023', message = 'invalid_billing_checkout_event';
  end if;

  select * into v_checkout
  from public.graficalc_billing_checkouts
  where provider_checkout_id = p_provider_checkout_id;
  if not found then
    return jsonb_build_object('ignored', true);
  end if;

  if p_event_type in ('CHECKOUT_CANCELED', 'CHECKOUT_EXPIRED') then
    update public.graficalc_billing_checkouts
    set status = case when p_event_type = 'CHECKOUT_CANCELED' then 'canceled' else 'expired' end,
        updated_at = now()
    where id = v_checkout.id and status in ('creating', 'pending');
    return jsonb_build_object('status', case when p_event_type = 'CHECKOUT_CANCELED' then 'canceled' else 'expired' end);
  end if;

  if not exists (
    select 1 from public.graficalc_tenants
    where id = v_checkout.tenant_id and owner_id = v_checkout.user_id
  ) then
    raise exception using errcode = '42501', message = 'billing_owner_required';
  end if;

  insert into public.graficalc_billing_subscriptions (
    tenant_id, owner_id, provider, plan_key, plan_name, billing_cycle, amount_cents, status, grace_days
  ) values (
    v_checkout.tenant_id, v_checkout.user_id, 'asaas', v_checkout.plan_key, v_checkout.plan_name,
    v_checkout.billing_cycle, v_checkout.amount_cents, 'pending', v_checkout.grace_days
  ) on conflict (tenant_id) do nothing;

  select * into v_subscription
  from public.graficalc_billing_subscriptions
  where tenant_id = v_checkout.tenant_id
  for update;
  if not found then
    raise exception using errcode = '23503', message = 'billing_subscription_not_found';
  end if;

  select * into v_checkout
  from public.graficalc_billing_checkouts
  where id = v_checkout.id and provider_checkout_id = p_provider_checkout_id
  for update;
  if not found then
    raise exception using errcode = '23503', message = 'billing_checkout_not_found';
  end if;

  if not p_items_valid or p_total_amount_cents <> v_checkout.amount_cents then
    update public.graficalc_billing_checkouts set status = 'review', updated_at = now()
    where id = v_checkout.id;
    update public.graficalc_billing_subscriptions set status = 'review', updated_at = now()
    where tenant_id = v_checkout.tenant_id;
    return jsonb_build_object('status', 'review', 'amountMismatch', true);
  end if;

  if p_provider_subscription_id is not null and p_provider_subscription_id <> '' then
    select * into v_provider_subscription
    from public.graficalc_billing_provider_subscriptions
    where provider_subscription_id = p_provider_subscription_id
    for update;
    if found then
      if v_provider_subscription.tenant_id <> v_checkout.tenant_id then
        raise exception using errcode = '23505', message = 'billing_provider_subscription_mismatch';
      end if;
      if v_provider_subscription.checkout_id is not null and v_provider_subscription.checkout_id <> v_checkout.id then
        update public.graficalc_billing_checkouts
        set status = 'paid', paid_at = coalesce(paid_at, p_event_at), updated_at = now()
        where id = v_checkout.id;
        return jsonb_build_object('status', v_subscription.status, 'entitlementPreserved', true, 'ignored', true);
      end if;
      if v_provider_subscription.last_event_at is not null and v_provider_subscription.last_event_at > p_event_at then
        update public.graficalc_billing_checkouts
        set status = 'paid', paid_at = coalesce(paid_at, p_event_at), updated_at = now()
        where id = v_checkout.id;
        return jsonb_build_object('status', v_subscription.status, 'entitlementPreserved', true, 'ignored', true);
      end if;
    elsif v_subscription.provider_subscription_id is not null
      and v_subscription.provider_subscription_id <> p_provider_subscription_id
      and ((v_subscription.status = 'trialing' and v_subscription.trial_ends_at > p_event_at)
        or (v_subscription.status in ('active', 'canceled') and v_subscription.current_period_end > p_event_at)
        or (v_subscription.status = 'past_due'
          and v_subscription.current_period_end + make_interval(days => v_subscription.grace_days) > p_event_at)) then
      raise exception using errcode = '23505', message = 'billing_provider_subscription_mismatch';
    end if;

    insert into public.graficalc_billing_provider_subscriptions (
      provider_subscription_id, tenant_id, checkout_id, provider_customer_id, last_event_at
    ) values (
      p_provider_subscription_id, v_checkout.tenant_id, v_checkout.id, nullif(p_provider_customer_id, ''), p_event_at
    ) on conflict (provider_subscription_id) do update set
      checkout_id = coalesce(excluded.checkout_id, public.graficalc_billing_provider_subscriptions.checkout_id),
      provider_customer_id = coalesce(excluded.provider_customer_id, public.graficalc_billing_provider_subscriptions.provider_customer_id),
      last_event_at = greatest(public.graficalc_billing_provider_subscriptions.last_event_at, excluded.last_event_at),
      updated_at = now()
    where public.graficalc_billing_provider_subscriptions.tenant_id = excluded.tenant_id
      and (public.graficalc_billing_provider_subscriptions.checkout_id is null
        or excluded.checkout_id is null
        or public.graficalc_billing_provider_subscriptions.checkout_id = excluded.checkout_id);
    get diagnostics v_rows = row_count;
    if v_rows <> 1 then
      raise exception using errcode = '23505', message = 'billing_provider_subscription_mismatch';
    end if;
  end if;

  update public.graficalc_billing_checkouts
  set status = 'paid', paid_at = coalesce(paid_at, p_event_at), updated_at = now()
  where id = v_checkout.id;

  if (v_subscription.status in ('active', 'past_due', 'canceled')
      and v_subscription.current_period_end is not null and v_subscription.current_period_end > p_event_at)
    or (v_subscription.status = 'trialing' and v_subscription.trial_ends_at is not null and v_subscription.trial_ends_at > p_event_at) then
    return jsonb_build_object('status', v_subscription.status, 'entitlementPreserved', true);
  end if;

  v_trial_end := case when v_checkout.trial_days > 0
    then p_event_at + make_interval(days => v_checkout.trial_days) else null end;
  v_period_end := case when v_trial_end is not null then v_trial_end
    when v_checkout.billing_cycle = 'annual' then p_event_at + make_interval(months => 12)
    else null end;
  v_status := case when v_trial_end is not null then 'trialing'
    when v_checkout.billing_cycle = 'annual' then 'active' else 'pending' end;

  update public.graficalc_billing_subscriptions set
    provider = 'asaas',
    provider_customer_id = coalesce(nullif(p_provider_customer_id, ''), provider_customer_id),
    provider_subscription_id = coalesce(nullif(p_provider_subscription_id, ''), provider_subscription_id),
    provider_subscription_event_at = case when nullif(p_provider_subscription_id, '') is not null then p_event_at else provider_subscription_event_at end,
    plan_key = v_checkout.plan_key,
    plan_name = v_checkout.plan_name,
    billing_cycle = v_checkout.billing_cycle,
    amount_cents = v_checkout.amount_cents,
    status = v_status,
    cancel_at_period_end = false,
    canceled_at = null,
    trial_started_at = case
      when v_trial_end is not null then coalesce(trial_started_at, p_event_at)
      else trial_started_at
    end,
    trial_ends_at = v_trial_end,
    current_period_start = case when v_trial_end is not null then null else p_event_at end,
    current_period_end = v_period_end,
    grace_days = v_checkout.grace_days,
    updated_at = now()
  where tenant_id = v_checkout.tenant_id;

  return jsonb_build_object('status', v_status, 'entitlementPreserved', false);
end;
$$;

revoke all on function public.graficalc_apply_billing_checkout_event(text, text, timestamptz, boolean, bigint, text, text) from public, anon, authenticated;
grant execute on function public.graficalc_apply_billing_checkout_event(text, text, timestamptz, boolean, bigint, text, text) to service_role;

comment on table public.graficalc_billing_checkouts is 'Checkouts Asaas com snapshot de preço e regras por tenant; acesso exclusivo ao servidor.';
comment on table public.graficalc_billing_subscriptions is 'Estado de assinatura e entitlement por tenant; acesso exclusivo ao servidor.';
comment on table public.graficalc_billing_payments is 'Histórico financeiro Asaas sem dados de cartão; acesso exclusivo ao servidor.';
comment on table public.graficalc_billing_events is 'Inbox idempotente de webhooks Asaas; guarda metadados e não payloads com PII.';
comment on table public.graficalc_billing_provider_subscriptions is 'Histórico de IDs de recorrência do Asaas por tenant para reconhecer assinaturas substituídas e eventos atrasados.';
