create table if not exists public.graficalc_employee_provisioning (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.graficalc_tenants(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null unique check (email = lower(trim(email))),
  nome text not null check (length(trim(nome)) between 2 and 120),
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'consumed', 'cancelled')),
  user_id uuid unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  consumed_at timestamptz,
  check ((status = 'consumed') = (user_id is not null)),
  check ((status = 'consumed') = (consumed_at is not null))
);

create table if not exists public.graficalc_employee_pins (
  tenant_id uuid not null references public.graficalc_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_salt text not null check (pin_salt ~ '^[0-9a-f]{32}$'),
  pin_hash text not null check (pin_hash ~ '^[0-9a-f]{128}$'),
  pin_version integer not null default 1 check (pin_version > 0),
  active boolean not null default true,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

alter table public.graficalc_employee_provisioning enable row level security;
alter table public.graficalc_employee_pins enable row level security;
revoke all on public.graficalc_employee_provisioning, public.graficalc_employee_pins from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.graficalc_employee_provisioning to service_role;
grant select, insert, update, delete on public.graficalc_employee_pins to service_role;
grant delete on public.graficalc_tenants to service_role;

create or replace function public.graficalc_finalize_employee_provisioning()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  provision public.graficalc_employee_provisioning%rowtype;
  disposable_tenant_id uuid;
  company_name text;
begin
  if new.email is null then return new; end if;

  select * into provision
  from public.graficalc_employee_provisioning
  where email = lower(trim(new.email))
    and status = 'pending'
    and expires_at > now()
    and token_hash = encode(extensions.digest(coalesce(new.raw_user_meta_data ->> 'graficalc_employee_token', ''), 'sha256'), 'hex')
  for update;

  if provision.id is null then return new; end if;

  select id into disposable_tenant_id from public.profiles where id = new.id;
  select name into company_name from public.graficalc_tenants where id = provision.tenant_id;
  if company_name is null then raise exception 'graficalc_employee_tenant_missing'; end if;

  update public.profiles
  set tenant_id = provision.tenant_id,
      nome = provision.nome,
      empresa = company_name,
      papel = 'funcionario',
      email_confirmado = true,
      atualizado_em = now()
  where id = new.id;
  if not found then raise exception 'graficalc_employee_profile_missing'; end if;

  update public.graficalc_employee_provisioning
  set status = 'consumed', user_id = new.id, consumed_at = now()
  where id = provision.id and status = 'pending';
  if not found then raise exception 'graficalc_employee_provisioning_consumed'; end if;

  if disposable_tenant_id is not null and disposable_tenant_id <> provision.tenant_id then
    delete from public.graficalc_tenants where id = disposable_tenant_id and owner_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.graficalc_finalize_employee_provisioning() from public, anon, authenticated, service_role;
drop trigger if exists zz_graficalc_finalize_employee_provisioning on auth.users;
create trigger zz_graficalc_finalize_employee_provisioning
after insert on auth.users
for each row execute function public.graficalc_finalize_employee_provisioning();

comment on table public.graficalc_employee_provisioning is 'One-time server-side provisioning tokens for internal, email-less team members.';
comment on table public.graficalc_employee_pins is 'Salted scrypt PIN hashes and revocation versions for employee work mode.';
