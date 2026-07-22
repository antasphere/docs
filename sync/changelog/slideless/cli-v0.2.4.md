---
version: "cli-v0.2.4"
date: "2026-07-15"
channel: cli
---

slideless 0.3.0 — seamless first-party experience (silent SSO connect, single logout, onboarding, 30d anchored sessions, CLI connect-on-demand via cli-core 0.4.0)

### Breaking

- ADR 019 capstone + supersede banners; the scripted drill; TEMPLATE-FEEDBACK 22 (Phase 6)
- user-scoped CLI keys + the H3 grant channel — acquireFromConnect replaces the Stage E interim (Phase 4)
- orphan purge — the LIVE SESSION is the collect/protect discriminator, never the hub link (Phase 4)
- setup mints the operator USER only — no workspace; /me gains the zero-membership session state (Phase 4)
- live user-scoped federation — fail-closed login reconcile + live gate; the master-key apparatus deletes (Phase 3)

### Features

- consume cli-core 0.3.0 connect-on-demand — context.ts collapses to the seam call
- SL-6 dashboard seam — dismissible WelcomeBanner off /me.firstRunPending
- SL-3/SL-4 dashboard — silent auto-connect lattice, branded connecting state, single-logout client, hint-watch
- ssoLogout + dismissOnboarding methods (contract route-coverage guard)
- SL-6 tool-local first-run seam — user_onboarding table, /me extras, dismiss route
- SL-5 cloud sessions are 30d FIXED (non-sliding); oss keeps 365d sliding
- SL-2 single-logout server leg — hub end-session URL + POST /sso/logout
- SL-1 server seams — hint-cookie config, strict prompt=none whitelist, cloud /login error landing, discovery auth.sso
- user-scoped federation UI — hub/suspended/default badges, hub_grant_expired steering, /suspended = hub_unavailable only (Phase 5)
- the per-user hub grant — rotation-safe refresh, encrypted at rest (Phase 2)
- optional workspace argument on every tool; whoami teaches org-as-parameter
- user-scoped credentials — the org is a per-request parameter
- user-scoped credential schema — api_keys pin, is_default, hub_status, grant wipe
- gate the Google social provider off on cloud (hub-only session entrances)
- steer `slideless auth login-*` to `antasphere login` on cloud instances
- hub-only credential minting — close the OTP entrances, open the CLI self-revoke

### Fixes

- serve the hub-connect cache (user-scoped key per hub profile) + align the FakeHub to the real contract
- gate D bounds the silent-connect loop even when sessionStorage throws
