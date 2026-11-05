-- Reserve each authentication/PIN attempt in a single row-locking statement.
-- This prevents concurrent requests from all passing a read-only pre-check.
create or replace function public.graficalc_begin_auth_attempt(p_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  key_value text;
  attempt_count integer;
  blocked_until_value timestamptz;
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 512 then
    return false;
  end if;

  key_value := encode(extensions.digest(p_key, 'sha256'), 'hex');

  insert into public.auth_rate_limits (key_hash, attempts, window_started_at, blocked_until)
  values (key_value, 1, now(), null)
  on conflict (key_hash) do update set
    attempts = case
      when public.auth_rate_limits.blocked_until > now() then public.auth_rate_limits.attempts
      when public.auth_rate_limits.window_started_at < now() - interval '15 minutes' then 1
      else public.auth_rate_limits.attempts + 1
    end,
    window_started_at = case
      when public.auth_rate_limits.blocked_until > now() then public.auth_rate_limits.window_started_at
      when public.auth_rate_limits.window_started_at < now() - interval '15 minutes' then now()
      else public.auth_rate_limits.window_started_at
    end,
    blocked_until = case
      when public.auth_rate_limits.blocked_until > now() then public.auth_rate_limits.blocked_until
      when public.auth_rate_limits.window_started_at < now() - interval '15 minutes' then null
      when public.auth_rate_limits.attempts >= 5 then now() + interval '15 minutes'
      else null
    end
  returning attempts, public.auth_rate_limits.blocked_until
  into attempt_count, blocked_until_value;

  return attempt_count <= 5 and (blocked_until_value is null or blocked_until_value <= now());
end;
$$;

revoke all on function public.graficalc_begin_auth_attempt(text) from public, anon, authenticated;
grant execute on function public.graficalc_begin_auth_attempt(text) to service_role;
