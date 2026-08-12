create or replace function public.graficalc_is_valid_cpf(value text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  total integer := 0;
  digit integer;
  index integer;
begin
  if value !~ '^[0-9]{11}$' or value ~ '^([0-9])\1{10}$' then
    return false;
  end if;

  for index in 1..9 loop
    total := total + substr(value, index, 1)::integer * (11 - index);
  end loop;
  digit := 11 - (total % 11);
  if digit >= 10 then digit := 0; end if;
  if digit <> substr(value, 10, 1)::integer then return false; end if;

  total := 0;
  for index in 1..10 loop
    total := total + substr(value, index, 1)::integer * (12 - index);
  end loop;
  digit := 11 - (total % 11);
  if digit >= 10 then digit := 0; end if;
  return digit = substr(value, 11, 1)::integer;
end;
$$;

create or replace function public.graficalc_is_valid_cnpj(value text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  weights_first integer[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  weights_second integer[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  total integer := 0;
  remainder integer;
  digit integer;
  index integer;
begin
  if value !~ '^[0-9]{14}$' or value ~ '^([0-9])\1{13}$' then
    return false;
  end if;

  for index in 1..12 loop
    total := total + substr(value, index, 1)::integer * weights_first[index];
  end loop;
  remainder := total % 11;
  digit := case when remainder < 2 then 0 else 11 - remainder end;
  if digit <> substr(value, 13, 1)::integer then return false; end if;

  total := 0;
  for index in 1..13 loop
    total := total + substr(value, index, 1)::integer * weights_second[index];
  end loop;
  remainder := total % 11;
  digit := case when remainder < 2 then 0 else 11 - remainder end;
  return digit = substr(value, 14, 1)::integer;
end;
$$;

revoke all on function public.graficalc_is_valid_cpf(text) from public, anon;
revoke all on function public.graficalc_is_valid_cnpj(text) from public, anon;
grant execute on function public.graficalc_is_valid_cpf(text) to authenticated;
grant execute on function public.graficalc_is_valid_cnpj(text) to authenticated;

alter table public.profiles
  drop constraint if exists profiles_cpf_cnpj_valid_check;
alter table public.profiles
  add constraint profiles_cpf_cnpj_valid_check check (
    public.graficalc_is_valid_cpf(cpf_cnpj)
    or public.graficalc_is_valid_cnpj(cpf_cnpj)
  );
