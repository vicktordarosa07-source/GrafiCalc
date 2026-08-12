create extension if not exists pgcrypto;

alter table public.graficalc_tenants add column if not exists owner_id uuid references auth.users(id) on delete set null;
create unique index if not exists graficalc_tenants_owner_id_key on public.graficalc_tenants(owner_id) where owner_id is not null;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.graficalc_tenants(id) on delete restrict,
  nome text not null,
  empresa text not null,
  cpf_cnpj text not null unique check (cpf_cnpj ~ '^[0-9]{11}$|^[0-9]{14}$'),
  telefone text not null check (telefone ~ '^[0-9]{10,11}$'),
  email text not null,
  email_confirmado boolean not null default false,
  papel text not null default 'admin' check (papel in ('admin', 'usuario', 'funcionario')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists profiles_tenant_id_idx on public.profiles(tenant_id);

create table if not exists public.auth_rate_limits (
  key_hash text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz
);

alter table public.profiles enable row level security;
alter table public.auth_rate_limits enable row level security;
alter function public.graficalc_set_updated_at() set search_path = '';

drop policy if exists "tenants_deny_direct_access" on public.graficalc_tenants;
create policy "tenants_deny_direct_access" on public.graficalc_tenants for all to anon, authenticated using (false) with check (false);
drop policy if exists "runtime_state_deny_direct_access" on public.graficalc_runtime_state;
create policy "runtime_state_deny_direct_access" on public.graficalc_runtime_state for all to anon, authenticated using (false) with check (false);
drop policy if exists "rate_limits_deny_direct_access" on public.auth_rate_limits;
create policy "rate_limits_deny_direct_access" on public.auth_rate_limits for all to anon, authenticated using (false) with check (false);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nome, empresa, cpf_cnpj, telefone, atualizado_em) on public.profiles to authenticated;
revoke all on public.auth_rate_limits from anon, authenticated;

create or replace function public.graficalc_handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare new_tenant_id uuid;
begin
  insert into public.graficalc_tenants (slug, name, owner_id)
  values ('tenant-' || new.id::text, coalesce(new.raw_user_meta_data ->> 'empresa', 'Minha gráfica'), new.id)
  returning id into new_tenant_id;
  insert into public.profiles (id, tenant_id, nome, empresa, cpf_cnpj, telefone, email, email_confirmado, papel)
  values (new.id, new_tenant_id, coalesce(new.raw_user_meta_data ->> 'nome', ''), coalesce(new.raw_user_meta_data ->> 'empresa', ''), coalesce(new.raw_user_meta_data ->> 'cpf_cnpj', ''), coalesce(new.raw_user_meta_data ->> 'telefone', ''), coalesce(new.email, ''), new.email_confirmed_at is not null, 'admin');
  return new;
end;
$$;
revoke all on function public.graficalc_handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_graficalc on auth.users;
create trigger on_auth_user_created_graficalc after insert on auth.users for each row execute function public.graficalc_handle_new_user();

create or replace function public.graficalc_sync_email_confirmation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = coalesce(new.email, email), email_confirmado = new.email_confirmed_at is not null, atualizado_em = now() where id = new.id;
  return new;
end;
$$;
revoke all on function public.graficalc_sync_email_confirmation() from public, anon, authenticated;

drop trigger if exists on_auth_user_confirmed_graficalc on auth.users;
create trigger on_auth_user_confirmed_graficalc after update of email, email_confirmed_at on auth.users for each row execute function public.graficalc_sync_email_confirmation();

create or replace function public.graficalc_auth_attempt_allowed(p_key text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare item public.auth_rate_limits%rowtype; key_value text := encode(extensions.digest(p_key, 'sha256'), 'hex');
begin
  select * into item from public.auth_rate_limits where key_hash = key_value;
  if not found then return true; end if;
  if item.blocked_until is not null and item.blocked_until > now() then return false; end if;
  if item.window_started_at < now() - interval '15 minutes' then return true; end if;
  return item.attempts < 5;
end;
$$;
revoke all on function public.graficalc_auth_attempt_allowed(text) from public, anon, authenticated;
grant execute on function public.graficalc_auth_attempt_allowed(text) to service_role;

create or replace function public.graficalc_record_auth_failure(p_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare key_value text := encode(extensions.digest(p_key, 'sha256'), 'hex');
begin
  insert into public.auth_rate_limits (key_hash, attempts, window_started_at, blocked_until)
  values (key_value, 1, now(), null)
  on conflict (key_hash) do update set
    attempts = case
      when public.auth_rate_limits.window_started_at < now() - interval '15 minutes' then 1
      else public.auth_rate_limits.attempts + 1
    end,
    window_started_at = case
      when public.auth_rate_limits.window_started_at < now() - interval '15 minutes' then now()
      else public.auth_rate_limits.window_started_at
    end,
    blocked_until = case
      when public.auth_rate_limits.window_started_at >= now() - interval '15 minutes'
        and public.auth_rate_limits.attempts + 1 >= 5 then now() + interval '15 minutes'
      else null
    end;
end;
$$;
revoke all on function public.graficalc_record_auth_failure(text) from public, anon, authenticated;
grant execute on function public.graficalc_record_auth_failure(text) to service_role;

create or replace function public.graficalc_clear_auth_failures(p_key text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.auth_rate_limits
  where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
end;
$$;
revoke all on function public.graficalc_clear_auth_failures(text) from public, anon, authenticated;
grant execute on function public.graficalc_clear_auth_failures(text) to service_role;
