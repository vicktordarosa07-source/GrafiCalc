import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(new URL("../supabase/06_graficalc_billing.sql", import.meta.url), "utf8");
const db = new PGlite();

const query = (sql, params = []) => db.query(sql, params);
const asJson = (result) => result.rows[0]?.result;

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key);
    create table public.graficalc_tenants (
      id uuid primary key,
      owner_id uuid references auth.users(id)
    );
    insert into auth.users (id) values
      ('10000000-0000-4000-8000-000000000001'),
      ('10000000-0000-4000-8000-000000000002'),
      ('10000000-0000-4000-8000-000000000003');
    insert into public.graficalc_tenants (id, owner_id) values
      ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
      ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002'),
      ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003');
  `);

  await db.exec(migration);
  await db.exec(migration);

  const permission = await query(`
    select
      has_table_privilege('anon', 'public.graficalc_billing_payments', 'select') as anon_can_read,
      has_table_privilege('authenticated', 'public.graficalc_billing_payments', 'select') as authenticated_can_read,
      has_table_privilege('service_role', 'public.graficalc_billing_payments', 'select') as service_role_can_read,
      (select relrowsecurity from pg_class where oid = 'public.graficalc_billing_payments'::regclass) as rls_enabled,
      has_function_privilege('anon', 'public.graficalc_apply_billing_payment_event(uuid,uuid,uuid,text,text,bigint,text,text,boolean,timestamp with time zone,timestamp with time zone,text,text,text,text,integer)', 'execute') as anon_can_apply,
      has_function_privilege('service_role', 'public.graficalc_apply_billing_payment_event(uuid,uuid,uuid,text,text,bigint,text,text,boolean,timestamp with time zone,timestamp with time zone,text,text,text,text,integer)', 'execute') as service_role_can_apply,
      has_function_privilege('anon', 'public.graficalc_claim_billing_events(integer,timestamp with time zone)', 'execute') as anon_can_claim,
      has_function_privilege('service_role', 'public.graficalc_claim_billing_events(integer,timestamp with time zone)', 'execute') as service_role_can_claim
  `);
  assert.deepEqual(permission.rows[0], {
    anon_can_read: false,
    authenticated_can_read: false,
    service_role_can_read: true,
    rls_enabled: true,
    anon_can_apply: false,
    service_role_can_apply: true,
    anon_can_claim: false,
    service_role_can_claim: true,
  });

  // Supabase no longer auto-exposes newly created public tables/functions.
  // Verify the migration's explicit grants across every billing object, not
  // just the payment table and two representative RPCs above.
  const billingTables = await query(`
    select c.relname as table_name, c.relrowsecurity as rls_enabled,
      has_table_privilege('anon', c.oid, 'select') as anon_can_read,
      has_table_privilege('authenticated', c.oid, 'select') as authenticated_can_read,
      has_table_privilege('service_role', c.oid, 'select,insert,update') as service_role_has_write_access,
      has_table_privilege('service_role', c.oid, 'delete') as service_role_can_delete
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'graficalc_billing_%'
    order by c.relname
  `);
  assert.equal(billingTables.rows.length, 5, "all five billing tables should be installed");
  for (const table of billingTables.rows) {
    assert.equal(table.rls_enabled, true, `${table.table_name} must enable RLS`);
    assert.equal(table.anon_can_read, false, `${table.table_name} must not be exposed to anon`);
    assert.equal(table.authenticated_can_read, false, `${table.table_name} must not be exposed to authenticated clients`);
    assert.equal(table.service_role_has_write_access, true, `${table.table_name} must grant server reads/writes`);
    assert.equal(table.service_role_can_delete, false, `${table.table_name} must not grant unused DELETE access`);
  }

  const billingFunctions = await query(`
    select p.proname as function_name,
      has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute,
      has_function_privilege('service_role', p.oid, 'execute') as service_role_can_execute
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'graficalc_%'
    order by p.proname
  `);
  assert.equal(billingFunctions.rows.length, 5, "all five billing RPCs should be installed");
  for (const fn of billingFunctions.rows) {
    assert.equal(fn.anon_can_execute, false, `${fn.function_name} must not be callable by anon`);
    assert.equal(fn.authenticated_can_execute, false, `${fn.function_name} must not be callable by authenticated clients`);
    assert.equal(fn.service_role_can_execute, true, `${fn.function_name} must explicitly grant backend execution`);
  }
  assert.doesNotMatch(migration, /security\s+definer/i, "billing RPCs must not bypass RLS as SECURITY DEFINER");

  await query(`insert into public.graficalc_billing_events (
    provider_event_id, event_type, resource_id, payload, status
  ) values ('event-queue-1', 'PAYMENT_RECEIVED', 'payment-queue-1', '{"payment":{"id":"payment-queue-1"}}'::jsonb, 'received')`);
  const claimEvent = async () => query(`select * from public.graficalc_claim_billing_events(1, now() - interval '2 minutes')`);
  const firstClaim = await claimEvent();
  assert.equal(firstClaim.rows.length, 1);
  assert.equal(firstClaim.rows[0].provider_event_id, "event-queue-1");
  assert.equal(firstClaim.rows[0].attempt_count, 1);
  assert.equal((await claimEvent()).rows.length, 0, "a live claim cannot be claimed twice");

  await query(`update public.graficalc_billing_events set status = 'failed', processing_started_at = null where provider_event_id = 'event-queue-1'`);
  const retryClaim = await claimEvent();
  assert.equal(retryClaim.rows[0].attempt_count, 2, "failed event can be retried");
  await query(`update public.graficalc_billing_events set status = 'processing', processing_started_at = now() - interval '3 minutes' where provider_event_id = 'event-queue-1'`);
  const staleClaim = await claimEvent();
  assert.equal(staleClaim.rows[0].attempt_count, 3, "stale processing claim can be recovered");
  await query(`update public.graficalc_billing_events set status = 'processed', payload = null, processing_started_at = null where provider_event_id = 'event-queue-1'`);
  assert.equal((await claimEvent()).rows.length, 0, "processed event payload is removed from the durable queue");

  // New accounts created after migration 06 are not part of its one-time
  // legacy-access snapshot. They must still be able to claim a checkout and
  // acquire their first subscription from the verified provider event.
  await db.exec(`
    insert into auth.users (id) values ('10000000-0000-4000-8000-000000000004');
    insert into public.graficalc_tenants (id, owner_id)
    values ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004');
  `);
  const newTenantBeforeCheckout = await query(`select count(*)::int as count
    from public.graficalc_billing_subscriptions where tenant_id = '20000000-0000-4000-8000-000000000004'`);
  assert.equal(newTenantBeforeCheckout.rows[0].count, 0, "post-migration signup does not get grandfathered billing access");
  const newTenantClaim = asJson(await query(`select public.graficalc_claim_billing_checkout(
    '20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004',
    'new-tenant-monthly', 'Mensal', 'monthly', 9900, 15, 5, now() + interval '1 hour'
  ) as result`));
  assert.equal(newTenantClaim.action, "create", "new tenant can reserve its first trial checkout");
  await query(`update public.graficalc_billing_checkouts set
    status = 'pending', provider_checkout_id = 'asaas-checkout-new-tenant'
    where id = $1`, [newTenantClaim.checkoutId]);
  const newTenantTrial = asJson(await query(`select public.graficalc_apply_billing_checkout_event(
    'asaas-checkout-new-tenant', 'CHECKOUT_PAID', now(), true, 9900, 'customer-new-tenant', null
  ) as result`));
  assert.equal(newTenantTrial.status, "trialing", "verified first checkout provisions a new tenant's trial subscription");
  const newTenantSubscription = await query(`select trial_started_at, trial_ends_at from public.graficalc_billing_subscriptions
    where tenant_id = '20000000-0000-4000-8000-000000000004'`);
  assert.ok(newTenantSubscription.rows[0].trial_started_at, "first verified checkout records trial use");
  assert.ok(newTenantSubscription.rows[0].trial_ends_at, "first verified checkout sets trial expiry");

  const trialClaim = asJson(await query(`select public.graficalc_claim_billing_checkout(
    '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003',
    'trial-monthly', 'Mensal', 'monthly', 9900, 15, 5, now() + interval '1 hour'
  ) as result`));
  assert.equal(trialClaim.action, "create", "first eligible checkout can reserve a trial");
  await query(`update public.graficalc_billing_checkouts set
    status = 'pending', provider_checkout_id = 'asaas-checkout-trial-1'
    where id = $1`, [trialClaim.checkoutId]);
  const trialResult = asJson(await query(`select public.graficalc_apply_billing_checkout_event(
    'asaas-checkout-trial-1', 'CHECKOUT_PAID', now(), true, 9900, 'customer-3', null
  ) as result`));
  assert.equal(trialResult.status, "trialing");
  await query(`update public.graficalc_billing_subscriptions set
    trial_ends_at = now() - interval '1 second'
    where tenant_id = '20000000-0000-4000-8000-000000000003'`);
  const repeatedTrial = asJson(await query(`select public.graficalc_claim_billing_checkout(
    '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003',
    'trial-monthly', 'Mensal', 'monthly', 9900, 15, 5, now() + interval '1 hour'
  ) as result`));
  assert.equal(repeatedTrial.action, "trial-used", "expired trial cannot be granted again");
  const noTrialCheckout = asJson(await query(`select public.graficalc_claim_billing_checkout(
    '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003',
    'annual-no-trial', 'Anual', 'annual', 9900, 0, 5, now() + interval '1 hour'
  ) as result`));
  assert.equal(noTrialCheckout.action, "create", "used trial tenant can still contract without another trial");
  await query(`update public.graficalc_billing_checkouts set
    status = 'pending', provider_checkout_id = 'asaas-checkout-after-trial'
    where id = $1`, [noTrialCheckout.checkoutId]);
  await query(`update public.graficalc_billing_subscriptions set
    cancel_at_period_end = true, canceled_at = now() - interval '1 day'
    where tenant_id = '20000000-0000-4000-8000-000000000003'`);
  const paidNoTrial = asJson(await query(`select public.graficalc_apply_billing_checkout_event(
    'asaas-checkout-after-trial', 'CHECKOUT_PAID', now(), true, 9900, 'customer-3', null
  ) as result`));
  assert.equal(paidNoTrial.status, "active", "paid plan without a trial activates normally");
  const resetCancellation = await query(`select cancel_at_period_end, canceled_at from public.graficalc_billing_subscriptions
    where tenant_id = '20000000-0000-4000-8000-000000000003'`);
  assert.equal(resetCancellation.rows[0].cancel_at_period_end, false, "a new successful checkout resets the previous cancellation marker");
  assert.equal(resetCancellation.rows[0].canceled_at, null, "a new checkout clears the previous cancellation timestamp");
  await query(`update public.graficalc_billing_subscriptions set
    status = 'canceled', billing_cycle = 'monthly', provider_subscription_id = 'subscription-cancel-resume',
    provider_subscription_event_at = '2026-11-05T00:00:00Z', current_period_end = '2026-12-01T00:00:00Z',
    cancel_at_period_end = true, canceled_at = '2026-11-05T00:00:00Z'
    where tenant_id = '20000000-0000-4000-8000-000000000003'`);
  await query(`insert into public.graficalc_billing_provider_subscriptions (
    provider_subscription_id, tenant_id, last_event_at
  ) values ('subscription-cancel-resume', '20000000-0000-4000-8000-000000000003', '2026-11-05T00:00:00Z')`);
  const resumedSubscription = asJson(await query(`select public.graficalc_apply_billing_subscription_event(
    '20000000-0000-4000-8000-000000000003', 'subscription-cancel-resume', null,
    'SUBSCRIPTION_UPDATED', '2026-11-06T00:00:00Z', 'customer-3', 'ACTIVE'
  ) as result`));
  assert.equal(resumedSubscription.status, "active");
  const resumedState = await query(`select cancel_at_period_end, canceled_at from public.graficalc_billing_subscriptions
    where tenant_id = '20000000-0000-4000-8000-000000000003'`);
  assert.equal(resumedState.rows[0].cancel_at_period_end, false, "provider-confirmed reactivation clears the cancellation marker");
  assert.equal(resumedState.rows[0].canceled_at, null, "provider-confirmed reactivation clears the cancellation time");
  const effectiveCheckout = await query(`select trial_days, trial_started_at from public.graficalc_billing_checkouts
    join public.graficalc_billing_subscriptions using (tenant_id) where graficalc_billing_checkouts.id = $1`, [noTrialCheckout.checkoutId]);
  assert.equal(effectiveCheckout.rows[0].trial_days, 0);
  assert.ok(effectiveCheckout.rows[0].trial_started_at, "paid checkout preserves the prior trial-use marker");
  const stillUsed = asJson(await query(`select public.graficalc_claim_billing_checkout(
    '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003',
    'trial-monthly', 'Mensal', 'monthly', 9900, 15, 5, now() + interval '1 hour'
  ) as result`));
  assert.equal(stillUsed.action, "trial-used", "paid subscription does not reset lifetime trial eligibility");

  const annualCheckoutId = "30000000-0000-4000-8000-000000000001";
  await query(`
    insert into public.graficalc_billing_checkouts (
      id, tenant_id, user_id, plan_key, plan_name, billing_cycle, amount_cents,
      status, expires_at, paid_at
    ) values (
      $1, '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
      'annual', 'Anual', 'annual', 120000, 'paid', '2027-01-01T00:00:00Z', '2026-11-01T00:00:00Z'
    )
  `, [annualCheckoutId]);
  await query(`
    update public.graficalc_billing_subscriptions set
      status = 'active', plan_key = 'annual', plan_name = 'Anual', billing_cycle = 'annual',
      amount_cents = 120000, current_period_start = '2026-11-01T00:00:00Z',
      current_period_end = '2027-11-01T00:00:00Z'
    where tenant_id = '20000000-0000-4000-8000-000000000001'
  `);

  const annualPaymentArgs = [
    "20000000-0000-4000-8000-000000000001",
    "10000000-0000-4000-8000-000000000001",
    annualCheckoutId,
    "annual-payment-1",
    null,
    120000,
    "PAYMENT_CONFIRMED",
    "paid",
    false,
    null,
    "2026-11-02T00:00:00Z",
    null,
    "annual",
    "Anual",
    "annual",
    0,
  ];
  const paymentCall = `select public.graficalc_apply_billing_payment_event(
    $1::uuid, $2::uuid, $3::uuid, $4::text, $5::text, $6::bigint, $7::text, $8::text,
    $9::boolean, $10::timestamptz, $11::timestamptz, $12::text, $13::text, $14::text,
    $15::text, $16::integer
  ) as result`;
  const annualFirst = asJson(await query(paymentCall, annualPaymentArgs));
  const annualSecond = asJson(await query(paymentCall, annualPaymentArgs));
  assert.equal(annualFirst.status, "paid");
  assert.equal(annualSecond.status, "paid");
  const annualState = await query(`
    select status, last_payment_id, current_period_end::text as current_period_end,
      (select count(*)::int from public.graficalc_billing_payments where provider_payment_id = 'annual-payment-1') as payment_rows
    from public.graficalc_billing_subscriptions
    where tenant_id = '20000000-0000-4000-8000-000000000001'
  `);
  assert.equal(annualState.rows[0].status, "active");
  assert.equal(annualState.rows[0].last_payment_id, "annual-payment-1");
  assert.equal(annualState.rows[0].current_period_end, "2027-11-01 00:00:00+00");
  assert.equal(annualState.rows[0].payment_rows, 1);

  const tenant2 = "20000000-0000-4000-8000-000000000002";
  const checkout2 = "30000000-0000-4000-8000-000000000002";
  await query(`
    insert into public.graficalc_billing_checkouts (
      id, tenant_id, user_id, plan_key, plan_name, billing_cycle, amount_cents, status, expires_at
    ) values (
      $1, $2, '10000000-0000-4000-8000-000000000002', 'monthly', 'Mensal', 'monthly', 10000, 'pending', '2027-01-01T00:00:00Z'
    )
  `, [checkout2, tenant2]);
  await query(`
    update public.graficalc_billing_subscriptions set
      status = 'expired', plan_key = 'monthly', plan_name = 'Mensal', billing_cycle = 'monthly',
      amount_cents = 10000, provider_subscription_id = 'subscription-old',
      current_period_end = '2026-10-01T00:00:00Z', last_payment_id = 'payment-current',
      last_payment_at = '2026-11-03T00:00:00Z'
    where tenant_id = $1
  `, [tenant2]);
  await query(`
    insert into public.graficalc_billing_provider_subscriptions (
      provider_subscription_id, tenant_id, last_event_at
    ) values ('subscription-old', $1, '2026-10-01T00:00:00Z')
  `, [tenant2]);

  const newSubscription = asJson(await query(`
    select public.graficalc_apply_billing_subscription_event(
      $1::uuid, 'subscription-new', $2::uuid, 'SUBSCRIPTION_CREATED',
      '2026-11-04T00:00:00Z', 'customer-2', 'ACTIVE'
    ) as result
  `, [tenant2, checkout2]));
  assert.equal(newSubscription.ignored, false);
  assert.equal(newSubscription.status, "expired");

  const staleSubscription = asJson(await query(`
    select public.graficalc_apply_billing_subscription_event(
      $1::uuid, 'subscription-old', null, 'SUBSCRIPTION_INACTIVATED',
      '2026-11-05T00:00:00Z', 'customer-2', 'INACTIVE'
    ) as result
  `, [tenant2]));
  assert.equal(staleSubscription.ignored, true);
  assert.equal(staleSubscription.reason, "superseded_provider_subscription");

  const unseenOldRefund = asJson(await query(paymentCall, [
    tenant2,
    "10000000-0000-4000-8000-000000000002",
    null,
    "payment-old-unseen-refund",
    "subscription-old",
    10000,
    "PAYMENT_REFUNDED",
    "refunded",
    false,
    null,
    "2026-10-02T00:00:00Z",
    null,
    "monthly",
    "Mensal",
    "monthly",
    0,
  ]));
  assert.equal(unseenOldRefund.historicalPayment, true);
  const unseenOldPaid = asJson(await query(paymentCall, [
    tenant2,
    "10000000-0000-4000-8000-000000000002",
    null,
    "payment-old-unseen-paid",
    "subscription-old",
    10000,
    "PAYMENT_CONFIRMED",
    "paid",
    false,
    null,
    "2026-10-03T00:00:00Z",
    null,
    "monthly",
    "Mensal",
    "monthly",
    0,
  ]));
  assert.equal(unseenOldPaid.historicalPayment, true);

  const tenant2State = await query(`
    select status, provider_subscription_id, last_payment_id, last_payment_at::text as last_payment_at,
      current_period_end::text as current_period_end
    from public.graficalc_billing_subscriptions where tenant_id = $1
  `, [tenant2]);
  assert.deepEqual(tenant2State.rows[0], {
    status: "expired",
    provider_subscription_id: "subscription-new",
    last_payment_id: "payment-current",
    last_payment_at: "2026-11-03 00:00:00+00",
    current_period_end: "2026-10-01 00:00:00+00",
  });
  const oldPaymentRows = await query(`
    select provider_payment_id, status from public.graficalc_billing_payments
    where provider_payment_id in ('payment-old-unseen-refund', 'payment-old-unseen-paid')
    order by provider_payment_id
  `);
  assert.deepEqual(oldPaymentRows.rows, [
    { provider_payment_id: "payment-old-unseen-paid", status: "paid" },
    { provider_payment_id: "payment-old-unseen-refund", status: "refunded" },
  ]);

  await assert.rejects(() => query(`
    select public.graficalc_apply_billing_subscription_event(
      '20000000-0000-4000-8000-000000000001', 'subscription-new', null,
      'SUBSCRIPTION_UPDATED', '2026-11-06T00:00:00Z', 'customer-1', 'ACTIVE'
    )
  `), /billing_provider_subscription_mismatch/);

console.log("billing-postgres: migration rerun, explicit Supabase Data API grants, RLS and RPC exposure, durable webhook claim/retry/recovery, new-tenant checkout provisioning, single-use trial, annual idempotency, subscription replacement, late events, historic payments, and cross-tenant isolation passed");
} finally {
  await db.close();
}
