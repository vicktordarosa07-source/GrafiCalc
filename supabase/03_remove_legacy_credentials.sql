create or replace function public.graficalc_strip_legacy_credentials(candidate jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(candidate) = 'object' then
    return coalesce((
      select jsonb_object_agg(entry.key, public.graficalc_strip_legacy_credentials(entry.value))
      from jsonb_each(candidate) as entry
      where entry.key not in ('password', 'passwordMode', 'mustChangePassword', 'temporaryPasswordIssuedAt')
    ), '{}'::jsonb);
  end if;
  if jsonb_typeof(candidate) = 'array' then
    return coalesce((
      select jsonb_agg(public.graficalc_strip_legacy_credentials(entry.value))
      from jsonb_array_elements(candidate) as entry
    ), '[]'::jsonb);
  end if;
  return candidate;
end;
$$;

update public.graficalc_runtime_state
set payload = public.graficalc_strip_legacy_credentials(payload)
where payload::text ~* '"(password|passwordMode|mustChangePassword|temporaryPasswordIssuedAt)"\s*:';

drop function public.graficalc_strip_legacy_credentials(jsonb);
