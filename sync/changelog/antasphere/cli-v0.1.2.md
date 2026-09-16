---
version: "cli-v0.1.2"
date: "2026-07-13"
channel: cli
---

The `antasphere` CLI can now show your organizations and choose the one other Antasphere tool CLIs work in.

### Added

- `antasphere org list` prints the organizations you belong to and marks the active one.
- `antasphere org use <id>` sets the organization federated tool CLIs read as their context, and `--unset` clears it.
