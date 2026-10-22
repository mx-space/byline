<!-- Concise summary of the change. -->

## Summary

-
-

## Test plan

- [ ]
- [ ]

## Database migrations checklist (delete if no schema change)

- [ ] Migration is backwards-compatible with the previous release's code
      (rolling deploy: new and old pods coexist during cutover).
- [ ] Drop / rename / type-change is staged across multiple releases
      (expand now, contract in a follow-up release).
- [ ] Indexes on large tables use `CREATE INDEX CONCURRENTLY` (and break
      out of drizzle's default transaction).
- [ ] `pnpm -C apps/server run lint:migrations` passes.
- [ ] If `migration-lint:allow=` is used, `reason=` explains why and a
      reviewer has agreed.
- [ ] Follow-up contract migration tracked in an issue (if applicable).

See the "Database Migrations" section of `AGENTS.md` for the expand-contract rules.
