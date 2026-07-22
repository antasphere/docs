---
version: "cli-v0.2.2"
date: "2026-07-13"
channel: cli
---

release @antasphere/slideless 0.2.2 — connect-on-demand + org commands

### Features

- connect-on-demand — a hub login serves cloud instances
- P8 — close the local password-reset surface on cloud (the P3 residual)
- P7 — hide local membership management on hub-origin workspaces; guests lose the guest-forbidden affordances
- P7 — hub-origin workspaces refuse local membership mutation; /me carries the adaptation signals
- P6 SSO-first collaborator claim on cloud — guests get hub identities, never local passwords
- P6 guest capability limits — origin='guest' is a capability boundary (D2, both editions)

### Fixes

- per-org logout — revoke on the minting instance, report a refused self-revoke honestly
- P7 review — the hub-managed gate mounts ONCE per subtree, making fail-closed true by construction
- the G1 fallback mints missing memberships, never reactivates cut ones — and pin the OAuth-bearer guest leg
- G1 cross-request — a grant swept active in an EARLIER request claims as success (claim path only)
