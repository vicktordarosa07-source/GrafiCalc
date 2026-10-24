# Release checklist — GrafiCalc stabilization (2026-10-24)

## Baseline
- Production branch: `main` at `86f0c9cad19a56d3ec666ba303f1042962849ad7` before this PR.
- Scope: collection permissions, conflict recovery, PIN, developer rate-limiting, healthcheck, quote totals, regression tests and CI.
- No migrations or production database writes are part of this PR.

## Implemented
- Server-side authorization for client lists, own quotes and work orders; restricted PUT cannot erase hidden collections.
- Durable, per-account backup of unsynchronized client, quote and OS changes, with download and opt-in 3-way reconciliation. Conflicts are not auto-overwritten.
- Fifth PIN attempt can be used; sixth sequential attempt is blocked. Database-atomic simultaneous PIN limiting remains future work.
- Developer login attempt counts moved from an in-memory Map to Supabase RPC.
- Supabase Auth health endpoint checked; unavailable dependency returns HTTP 503.
- Shared text quote totals now use `createQuoteEntries`, matching the HTML quote instead of missing category totals.
- Added CI for static/typing, access policy, sync, pricing, operational regressions, legacy security, production build and unauthenticated smoke.

## Gates before merging main
1. [ ] Latest PR head commit and GitHub Actions quality workflow GREEN.
2. [ ] Vercel Preview READY for that same SHA.
3. [ ] Confirm recoverable Supabase backup or verified export **without exposing private records or secrets**.
4. [ ] Preview smoke with disposable authenticated owner and employee accounts: log in/out, isolated tenant separation, blocked client/OS writes, own quote creation, PIN, save/reload.
5. [ ] Browser quote checks: new quote, HTML/PDF print, WhatsApp text, conversion into OS, status synchronization. Use fake clients only.
6. [ ] Preview two-session sync test with disjoint and conflicting edits; export the local recovery backup and confirm no overwrite.
7. [ ] Rollback path tested/identified: revert this PR on main and redeploy previous Vercel SHA. Do not delete or migrate live data.

## Automated checks
```bash
npm ci
npm run check
npm run test:workspace-policy
npm run test:collection-policy
npm run test:sync-recovery
npm run test:pricing-regression
npm run test:operational-regression
npm run test:security:stage3
npm run test:security:stage4
npm run test:security:stage5
npm run test:security:stage-final
npm run build
npm run test:next-smoke
```

## Important limits
- Build READY and unauthenticated smoke do not prove user workflows work.
- The integration script `test:workspace-api` needs an isolated Supabase test project, not customer production data.
- Real PDF rendering, WhatsApp opening and OS lifecycle in a browser need authenticated end-to-end validation.
- Do not promote, merge or publish while any release gate remains unchecked.
