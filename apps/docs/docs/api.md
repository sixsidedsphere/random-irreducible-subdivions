# API

Public API is exported from `packages/core/src/public`.

## Push failure semantics

`GeneratorImpl.step()` can encounter an `applyPush(...)` failure after candidate selection.

- **`strict: true` (default):**
  - The generator throws `PushApplyError`.
  - Error message includes `edgeId`, `endpoint`, and attempted `newVal`.
  - Original error is attached as the cause.
- **`strict: false`:**
  - The generator does **not** throw for `applyPush` failure.
  - Failure is recorded in diagnostics and generation continues.

Diagnostics are available on:

- `GenerationSnapshot.diagnostics` (cumulative count/events)
- `StepDelta.diagnostics` (failures seen during that step call before a successful push)
