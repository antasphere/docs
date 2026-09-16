---
version: "cli-v0.2.4"
date: "2026-07-15"
channel: cli
---

The CLI release that ships alongside Slideless 0.3.0, tidying up how it holds on to a cloud connection.

### Fixed

- The connection key is cached per Antasphere account, so working with more than one account no longer replays the wrong key against an instance.

### Changed

- Against a cloud instance, `slideless auth login-request` and `login-complete` point you at `antasphere login` rather than attempting a sign-in the instance will refuse.
