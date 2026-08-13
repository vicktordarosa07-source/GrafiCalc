-- Users created in the Supabase dashboard only contain e-mail and password.
-- Keep public signup validation in the app, while allowing an administrator
-- to complete CPF/CNPJ and phone after the first authenticated access.

alter table public.profiles
  alter column cpf_cnpj drop not null,
  alter column telefone drop not null;

create or replace function public.graficalc_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
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
  insert into public.graficalc_tenants (slug, name, owner_id)
  values ('tenant-' || new.id::text, company_name, new.id)
  returning id into new_tenant_id;

  insert into public.profiles (
    id, tenant_id, nome, empresa, cpf_cnpj, telefone, email, email_confirmado, papel
  )
  values (
    new.id,
    new_tenant_id,
    profile_name,
    company_name,
    document_value,
    phone_value,
    coalesce(new.email, ''),
    new.email_confirmed_at is not null,
    'admin'
  );

  return new;
end;
$$;

revoke all on function public.graficalc_handle_new_user() from public, anon, authenticated;

