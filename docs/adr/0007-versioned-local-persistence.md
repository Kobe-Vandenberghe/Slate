# 0007. localStorage with a versioned schema + migrations

- Status: Accepted
- Date: 2026-09-30

## Context
Boards are saved in the browser. The shape format already changed once: `rotation` was added, and old
saves lacked it. Without versioning, every format change risks breaking existing boards.

## Decision
- Store `{ version: SCHEMA_VERSION, shapes }` under `miroclone:board`. The title is stored under `miroclone:title`.
- `parseStoredShapes` upgrades step by step through `MIGRATIONS[n]` (n → n+1). Version 0 = the legacy bare array.
- Unreadable data loads as an empty board rather than crashing. Writes are best-effort.
- We do not use Zustand's `persist` middleware: its envelope and hydration differ from our legacy data, and
  explicit migrations are easier to test.

## Consequences
- Any change to `Shape` needs a version bump, a migration and a test (skill `change-persisted-schema`).
- Keys must stay stable. Renaming a key is itself a migration.
- A backend or sync layer later would reuse the same versioned envelope.
