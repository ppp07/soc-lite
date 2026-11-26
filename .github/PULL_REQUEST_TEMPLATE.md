## Summary

<!-- What does this PR do and why? Link the roadmap milestone (docs/roadmap.md). -->

Milestone: Day __ · Branch: `type/short-description`

## Changes

-

## Architectural decisions

<!-- Any significant decision? Link or add an ADR in docs/adr/. Write "None" if not applicable. -->

## How to test

```bash
# commands a reviewer can run
```

## Test evidence

<!-- Paste test output / coverage summary / screenshots (for UI changes). -->

## Security checklist

- [ ] No secrets, credentials, tokens or `.env` files committed
- [ ] Inputs validated (Pydantic / Zod); no raw user input in DB queries
- [ ] New endpoints have authentication + correct role checks
- [ ] Security-relevant actions emit audit log entries
- [ ] Response actions remain **simulated only** (no commands, no real IPs/accounts touched)
- [ ] Simulated data uses documentation IP ranges and fictitious identities
- [ ] Errors do not leak stack traces or sensitive data

## Quality checklist

- [ ] Tests added/updated and passing locally
- [ ] Lint, format and type checks pass
- [ ] Docs updated (README / docs/ / API docs)
- [ ] MITRE ATT&CK mapping added/updated (detection changes only)
- [ ] Commits follow Conventional Commits
