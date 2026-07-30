create extension if not exists pgcrypto;

create table if not exists public.graficalc_tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.graficalc_runtime_state (
  tenant_id uuid primary key references public.graficalc_tenants(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.graficalc_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists graficalc_tenants_set_updated_at on public.graficalc_tenants;
create trigger graficalc_tenants_set_updated_at
before update on public.graficalc_tenants
for each row
execute function public.graficalc_set_updated_at();

drop trigger if exists graficalc_runtime_state_set_updated_at on public.graficalc_runtime_state;
create trigger graficalc_runtime_state_set_updated_at
before update on public.graficalc_runtime_state
for each row
execute function public.graficalc_set_updated_at();

alter table public.graficalc_tenants enable row level security;
alter table public.graficalc_runtime_state enable row level security;

revoke all on public.graficalc_tenants from anon, authenticated;
revoke all on public.graficalc_runtime_state from anon, authenticated;

comment on table public.graficalc_tenants is 'Tenants do GrafiCalc. Cada gráfica pode ter seu próprio workspace.';
comment on table public.graficalc_runtime_state is 'Snapshot central do estado compartilhado do GrafiCalc por tenant.';
