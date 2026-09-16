---
version: "cli-v0.2.2"
date: "2026-07-13"
channel: cli
---

The CLI stops asking for a Slideless-specific login against a cloud instance: it uses the Antasphere sign-in you already have.

### Added

- Against a cloud instance, the CLI exchanges your `antasphere login` credential for an instance key on first use and caches it. Later commands are served from the cache, with no further round trip.
- Someone invited to a single deck from outside your organization signs in with Antasphere to claim it, and never sets a Slideless password.

### Changed

- On a cloud instance there is no local password to set or reset; the dashboard hides membership management and points at Antasphere, where those changes are made.

### Fixed

- `slideless logout` revokes the key on the instance that issued it, and says plainly when an older instance refuses to revoke it rather than reporting a success that did not happen.
- Claiming a deck invitation no longer reactivates access that was previously cut.
