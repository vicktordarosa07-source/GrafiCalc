import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const migrationNames = [
  "01_graficalc_base.sql",
  "02_professional_auth.sql",
  "03_remove_legacy_credentials.sql",
  "04_validate_brazilian_documents.sql",
  "05_allow_dashboard_auth_users.sql",
  "06_graficalc_billing.sql",
  "07_graficalc_team_invitations.sql",
  "08_atomic_auth_rate_limits.sql",
];
const db = new PGlite({ extensions: { pgcrypto } });
const applyMigration = async (name) => db.exec(await readFile(new URL(`../supabase/${name}`, import.meta.url), "utf8"));

try {
  // Supabase project defaults represented for this local-only SQL compatibility check.
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create schema extensions;
    create extension pgcrypto with schema extensions;
    create table auth.users (
      id uuid primary key,
      raw_user_meta_data jsonb not null default '{}'::jsonb,
      email text,
      email_confirmed_at timestamptz
    );
    create function auth.uid()
      returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    -- Model older Supabase projects whose default grants exposed new public
    -- tables to API roles before the October 2026 platform change.
    alter default privileges for role postgres in schema public
      grant select, insert, update, delete, truncate, references, trigger
      on tables to anon, authenticated, service_role;
  `);

  await applyMigration(migrationNames[0]);
  await db.exec(`
    insert into public.graficalc_tenants (id, slug, name)
    values ('20000000-0000-4000-8000-000000000001', 'legacy-test', 'Legacy test');
    insert into public.graficalc_runtime_state (tenant_id, payload) values (
      '20000000-0000-4000-8000-000000000001',
      '{"preserve":"ok","password":"fake-secret","nested":{"passwordMode":"legacy","mustChangePassword":true,"preserveNumber":7},"rows":[{"temporaryPasswordIssuedAt":"test","label":"keep"}]}'::jsonb
    );
  `);
  await applyMigration(migrationNames[1]);
  await applyMigration(migrationNames[2]);

  const scrubbed = (await db.query(`
    select payload from public.graficalc_runtime_state
    where tenant_id = '20000000-0000-4000-8000-000000000001'
  `)).rows[0].payload;
  assert.deepEqual(scrubbed, {
    preserve: "ok",
    nested: { preserveNumber: 7 },
    rows: [{ label: "keep" }],
  }, "legacy credential fields must be removed recursively while business data remains");

  await applyMigration(migrationNames[3]);
  await applyMigration(migrationNames[4]);
  await db.exec(`
    insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
      ('10000000-0000-4000-8000-000000000001', 'one@example.invalid', now(),
        '{"nome":"Conta formatada","empresa":"Grafica Teste","cpf_cnpj":"111.444.777-35","telefone":"(48) 99659-4085"}'::jsonb),
      ('10000000-0000-4000-8000-000000000002', 'two@example.invalid', now(), '{}'::jsonb);
  `);
  await applyMigration(migrationNames[5]);
  await applyMigration(migrationNames[6]);
  await applyMigration(migrationNames[7]);
  await applyMigration(migrationNames[7]);

  assert.equal((await db.query(
    "select public.graficalc_begin_auth_attempt($1) as allowed",
    ["x".repeat(513)],
  )).rows[0].allowed, false, "oversized rate-limit identifiers must fail closed");

  const attemptResults = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    attemptResults.push((await db.query(
      "select public.graficalc_begin_auth_attempt($1) as allowed",
      ["atomic-rate-limit-test"],
    )).rows[0].allowed);
  }
  assert.deepEqual(attemptResults, [true, true, true, true, true, false],
    "the atomic limiter must reserve the first five attempts and reject the sixth");

  const limiterPrivileges = (await db.query(`
    select has_function_privilege('anon', 'public.graficalc_begin_auth_attempt(text)', 'execute') as anon_can_execute,
      has_function_privilege('authenticated', 'public.graficalc_begin_auth_attempt(text)', 'execute') as user_can_execute,
      has_function_privilege('service_role', 'public.graficalc_begin_auth_attempt(text)', 'execute') as service_can_execute,
      (select prosecdef from pg_proc where oid = 'public.graficalc_begin_auth_attempt(text)'::regprocedure) as is_security_definer
  `)).rows[0];
  assert.deepEqual(limiterPrivileges, {
    anon_can_execute: false, user_can_execute: false,
    service_can_execute: true, is_security_definer: true,
  }, "atomic auth limiter must be callable only by the privileged server role");

  const dashboardProfiles = await db.query(`
    select count(*)::int as profiles,
      bool_and(
        (id = '10000000-0000-4000-8000-000000000001'
          and nome = 'Conta formatada' and empresa = 'Grafica Teste'
          and cpf_cnpj = '11144477735' and telefone = '48996594085')
        or (id = '10000000-0000-4000-8000-000000000002'
          and cpf_cnpj is null and telefone is null)
      ) as dashboard_profile_values_match
    from public.profiles
  `);
  assert.deepEqual(dashboardProfiles.rows[0], { profiles: 2, dashboard_profile_values_match: true },
    "dashboard-created users must receive profiles, normalize formatted CPF/phone, and allow missing documents");

  const owner = (await db.query(`
    select p.id, p.tenant_id from public.profiles p
    where p.id = '10000000-0000-4000-8000-000000000001'
  `)).rows[0];
  const inviteToken = "one-time-secret-from-admin";
  const inviteHash = createHash("sha256").update(inviteToken).digest("hex");
  await db.query(`
    insert into public.graficalc_team_invitations (tenant_id, invited_by, email, nome, token_hash)
    values ($1, $2, 'employee@example.invalid', 'Funcionária Teste', $3)
  `, [owner.tenant_id, owner.id, inviteHash]);
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at) values (
      '10000000-0000-4000-8000-000000000003', 'employee@example.invalid',
      '{"nome":"Nome adulterado","papel":"admin","graficalc_invitation_token":"one-time-secret-from-admin"}'::jsonb, null
    );
  `);
  const invitedProfile = (await db.query(`
    select tenant_id,papel,nome,empresa,cpf_cnpj,telefone,email_confirmado
    from public.profiles where id = '10000000-0000-4000-8000-000000000003'
  `)).rows[0];
  assert.deepEqual(invitedProfile, {
    tenant_id: owner.tenant_id, papel: "funcionario", nome: "Funcionária Teste",
    empresa: "Grafica Teste", cpf_cnpj: null, telefone: null, email_confirmado: false,
  }, "a valid invite must create a pending employee bound to the invited tenant, ignoring mutable role/name metadata");
  assert.equal((await db.query(`select status,user_id from public.graficalc_team_invitations where email='employee@example.invalid'`)).rows[0].status, "provisioned",
    "creating the Auth account must not mark the invitation accepted before the user confirms their email");
  await db.exec(`update auth.users set email_confirmed_at = now() where id='10000000-0000-4000-8000-000000000003'`);
  assert.equal((await db.query(`select status from public.graficalc_team_invitations where email='employee@example.invalid'`)).rows[0].status, "accepted",
    "email confirmation must transition the provisioned invitation to accepted");
  assert.equal((await db.query(`select email_confirmado from public.profiles where id='10000000-0000-4000-8000-000000000003'`)).rows[0].email_confirmado, true,
    "email confirmation must activate the employee profile state");

  const badInviteHash = createHash("sha256").update("expected-token").digest("hex");
  await db.query(`
    insert into public.graficalc_team_invitations (tenant_id, invited_by, email, nome, token_hash)
    values ($1, $2, 'wrong-token@example.invalid', 'Funcionário Teste', $3)
  `, [owner.tenant_id, owner.id, badInviteHash]);
  await assert.rejects(db.exec(`
    insert into auth.users (id,email,raw_user_meta_data) values (
      '10000000-0000-4000-8000-000000000004','wrong-token@example.invalid',
      '{"graficalc_invitation_token":"wrong-token"}'::jsonb
    );
  `), /graficalc_invitation_token_invalid/);
  assert.equal((await db.query(`select count(*)::int as n from public.profiles where email='wrong-token@example.invalid'`)).rows[0].n, 0,
    "an invalid token must not create a user profile or attach an account to the team");

  const coreTablePrivileges = await db.query(`
    select
      has_table_privilege('anon', 'public.graficalc_tenants', 'select') as anon_tenant_read,
      has_table_privilege('authenticated', 'public.graficalc_tenants', 'select') as user_tenant_read,
      has_table_privilege('service_role', 'public.graficalc_tenants', 'select,update') as server_tenant_lock_access,
      has_table_privilege('service_role', 'public.graficalc_tenants', 'insert') as server_tenant_insert,
      has_table_privilege('service_role', 'public.graficalc_tenants', 'delete') as server_tenant_delete,
      has_table_privilege('anon', 'public.graficalc_runtime_state', 'select') as anon_runtime_read,
      has_table_privilege('authenticated', 'public.graficalc_runtime_state', 'select') as user_runtime_read,
      has_table_privilege('service_role', 'public.graficalc_runtime_state', 'select,insert,update') as server_runtime_access,
      has_table_privilege('service_role', 'public.graficalc_runtime_state', 'delete') as server_runtime_delete,
      has_table_privilege('anon', 'public.profiles', 'select') as anon_profile_read,
      has_table_privilege('authenticated', 'public.profiles', 'select') as user_profile_read,
      has_table_privilege('service_role', 'public.profiles', 'select') as server_profile_read,
      has_table_privilege('service_role', 'public.profiles', 'insert,delete') as server_profile_table_write,
      has_column_privilege('service_role', 'public.profiles', 'tenant_id', 'update') as server_profile_tenant_update,
      has_column_privilege('service_role', 'public.profiles', 'papel', 'update') as server_profile_role_update,
      has_column_privilege('service_role', 'public.profiles', 'cpf_cnpj', 'update') as server_profile_document_update,
      has_table_privilege('service_role', 'public.auth_rate_limits', 'select,insert,update,delete') as server_rate_limit_table_access,
      has_table_privilege('service_role', 'public.graficalc_tenants', 'truncate,references,trigger') as server_tenant_extra,
      has_table_privilege('service_role', 'public.graficalc_runtime_state', 'truncate,references,trigger') as server_runtime_extra,
      has_table_privilege('service_role', 'public.profiles', 'truncate,references,trigger') as server_profile_extra,
      has_table_privilege('service_role', 'public.auth_rate_limits', 'truncate,references,trigger') as server_rate_limit_extra
  `);
  assert.deepEqual(coreTablePrivileges.rows[0], {
    anon_tenant_read: false,
    user_tenant_read: false,
    server_tenant_lock_access: true,
    server_tenant_insert: true,
    server_tenant_delete: false,
    anon_runtime_read: false,
    user_runtime_read: false,
    server_runtime_access: true,
    server_runtime_delete: false,
    anon_profile_read: false,
    user_profile_read: true,
    server_profile_read: true,
    server_profile_table_write: false,
    server_profile_tenant_update: true,
    server_profile_role_update: true,
    server_profile_document_update: false,
    server_rate_limit_table_access: false,
    server_tenant_extra: false,
    server_runtime_extra: false,
    server_profile_extra: false,
    server_rate_limit_extra: false,
  }, "explicit grants must let server routes use core tables while blocking direct tenant/runtime access");

  const invitationGrants = (await db.query(`
    select c.relrowsecurity as rls_enabled,
      has_table_privilege('anon', c.oid, 'select,insert,update,delete') as anon_access,
      has_table_privilege('authenticated', c.oid, 'select,insert,update,delete') as authenticated_access,
      has_table_privilege('service_role', c.oid, 'select,insert,update') as server_access,
      has_table_privilege('service_role', c.oid, 'delete,truncate,references,trigger') as server_extra_access
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'graficalc_team_invitations'
  `)).rows[0];
  assert.deepEqual(invitationGrants, {
    rls_enabled: true, anon_access: false, authenticated_access: false,
    server_access: true, server_extra_access: false,
  }, "team invitations must remain private to server routes with only required privileges");

  const billingTables = await db.query(`
    select c.relname as table_name, c.relrowsecurity as rls_enabled,
      has_table_privilege('anon', c.oid, 'select') as anon_can_read,
      has_table_privilege('authenticated', c.oid, 'select') as authenticated_can_read,
      has_table_privilege('service_role', c.oid, 'select,insert,update') as service_role_has_write_access,
      has_table_privilege('service_role', c.oid, 'delete') as service_role_can_delete,
      has_table_privilege('service_role', c.oid, 'truncate,references,trigger') as service_role_has_extra
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'graficalc_billing_%'
    order by c.relname
  `);
  assert.equal(billingTables.rows.length, 5, "all five billing tables must be installed");
  for (const table of billingTables.rows) {
    assert.equal(table.rls_enabled, true, `${table.table_name} must enable RLS`);
    assert.equal(table.anon_can_read, false, `${table.table_name} must not be readable by anon`);
    assert.equal(table.authenticated_can_read, false, `${table.table_name} must not be readable by authenticated clients`);
    assert.equal(table.service_role_has_write_access, true, `${table.table_name} must grant the server read/write operations it uses`);
    assert.equal(table.service_role_can_delete, false, `${table.table_name} must not grant unused DELETE access`);
    assert.equal(table.service_role_has_extra, false, `${table.table_name} must not retain extra historical grants`);
  }

  const billingFunctions = await db.query(`
    select p.proname as function_name,
      has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute,
      has_function_privilege('service_role', p.oid, 'execute') as service_role_can_execute
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'graficalc_%billing%'
    order by p.proname
  `);
  assert.equal(billingFunctions.rows.length, 5, "all five billing RPCs must be installed");
  for (const fn of billingFunctions.rows) {
    assert.equal(fn.anon_can_execute, false, `${fn.function_name} must not be callable by anon`);
    assert.equal(fn.authenticated_can_execute, false, `${fn.function_name} must not be callable by authenticated clients`);
    assert.equal(fn.service_role_can_execute, true, `${fn.function_name} must be callable by service_role`);
  }
  assert.equal((await db.query(`
    select count(*)::int as n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'graficalc_%billing%' and p.prosecdef
  `)).rows[0].n, 0, "billing RPCs must not use SECURITY DEFINER");

  await db.exec(`
    set role authenticated;
    select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', false);
  `);
  const ownProfile = await db.query(`select count(*)::int as n from public.profiles`);
  const otherProfile = await db.query(`
    select count(*)::int as n from public.profiles
    where id = '10000000-0000-4000-8000-000000000002'
  `);
  assert.equal(ownProfile.rows[0].n, 1, "RLS must expose the authenticated user's own profile");
  assert.equal(otherProfile.rows[0].n, 0, "RLS must hide another user's profile");
  const privateTables = await db.query(`
    select has_table_privilege('authenticated', 'public.graficalc_tenants', 'select') as tenant_read,
      has_table_privilege('authenticated', 'public.graficalc_runtime_state', 'select') as runtime_read
  `);
  assert.deepEqual(privateTables.rows[0], { tenant_read: false, runtime_read: false },
    "tenant and runtime data must not be directly readable by authenticated clients");

  console.log("supabase-migrations: 01-08 applied in PGlite; atomic auth rate limit, legacy credential scrub, dashboard signup, one-use team invite binding, explicit grants, RLS, and profile isolation passed");
} finally {
  await db.close();
}
