create table if not exists public.graficalc_team_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.graficalc_tenants(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  nome text not null check (length(trim(nome)) between 2 and 120),
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'provisioned', 'accepted', 'cancelled', 'expired')),
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  provisioned_at timestamptz,
  accepted_at timestamptz,
  check ((status in ('provisioned', 'accepted')) = (user_id is not null)),
  check ((status in ('provisioned', 'accepted')) = (provisioned_at is not null)),
  check ((status = 'accepted') = (accepted_at is not null))
);

create unique index if not exists graficalc_team_invitations_pending_email_key
  on public.graficalc_team_invitations (lower(email)) where status = 'pending';
create index if not exists graficalc_team_invitations_tenant_created_idx
  on public.graficalc_team_invitations (tenant_id, created_at desc);

alter table public.graficalc_team_invitations enable row level security;
revoke all on public.graficalc_team_invitations from public, anon, authenticated, service_role;
grant select, insert, update on public.graficalc_team_invitations to service_role;

create or replace function public.graficalc_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.graficalc_team_invitations%rowtype;
  new_tenant_id uuid;
  profile_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Administrador'
  );
  company_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'empresa'), ''),
    'Minha grafica'
  );
  document_value text := nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'cpf_cnpj', ''), '\D', '', 'g'), '');
  phone_value text := nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'telefone', ''), '\D', '', 'g'), '');
begin
  if new.email is not null then
    select * into invitation
    from public.graficalc_team_invitations
    where lower(email) = lower(trim(new.email))
      and status = 'pending'
      and expires_at > now()
    order by created_at desc
    limit 1
    for update;
  end if;

  if invitation.id is not null then
    if encode(extensions.digest(coalesce(new.raw_user_meta_data ->> 'graficalc_invitation_token', ''), 'sha256'), 'hex') <> invitation.token_hash then
      raise exception 'graficalc_invitation_token_invalid';
    end if;

    select name into company_name
    from public.graficalc_tenants
    where id = invitation.tenant_id;
    if company_name is null then
      raise exception 'graficalc_invitation_tenant_missing';
    end if;

    update public.graficalc_team_invitations
    set status = 'provisioned', user_id = new.id, provisioned_at = now()
    where id = invitation.id and status = 'pending';
    if not found then
      raise exception 'graficalc_invitation_already_consumed';
    end if;

    insert into public.profiles (
      id, tenant_id, nome, empresa, cpf_cnpj, telefone, email, email_confirmado, papel
    ) values (
      new.id, invitation.tenant_id, invitation.nome, company_name, null, null,
      lower(new.email), new.email_confirmed_at is not null, 'funcionario'
    );
    return new;
  end if;

  if new.email is not null and exists (
    select 1 from public.graficalc_team_invitations
    where lower(email) = lower(trim(new.email)) and status = 'pending' and expires_at > now()
  ) then
    raise exception 'graficalc_invitation_required';
  end if;

  insert into public.graficalc_tenants (slug, name, owner_id)
  values ('tenant-' || new.id::text, company_name, new.id)
  returning id into new_tenant_id;

  insert into public.profiles (
    id, tenant_id, nome, empresa, cpf_cnpj, telefone, email, email_confirmado, papel
  ) values (
    new.id, new_tenant_id, profile_name, company_name, document_value, phone_value,
    coalesce(new.email, ''), new.email_confirmed_at is not null, 'admin'
  );

  return new;
end;
$$;

revoke all on function public.graficalc_handle_new_user() from public, anon, authenticated;

create or replace function public.graficalc_sync_email_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = coalesce(new.email, email),
      email_confirmado = new.email_confirmed_at is not null,
      atualizado_em = now()
  where id = new.id;

  if new.email_confirmed_at is not null then
    update public.graficalc_team_invitations
    set status = 'accepted', accepted_at = coalesce(accepted_at, now())
    where user_id = new.id and status = 'provisioned';
  end if;
  return new;
end;
$$;
revoke all on function public.graficalc_sync_email_confirmation() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_graficalc on auth.users;
create trigger on_auth_user_created_graficalc
after insert on auth.users
for each row execute function public.graficalc_handle_new_user();
