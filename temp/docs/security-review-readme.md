# Security Review README

Date: 2026-03-06

## Purpose
This document defines the current automated security review gate for the SVT repo, with specific detail for PCF.

It is intended to answer:
- What security checks run automatically
- Which files are covered
- What is currently passing
- What the current repository status is

Related architecture guide:
- `docs/cross-repo-behavior-testing.md` (how to run behavior tests when plugin and PCF are in separate repos)
- `docs/ci-templates/static-analysis.yml` (generic static analysis workflow template)

## Scope
Current automated checks in scope:
- `VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetUserContext.cs`
- `VOA.SVT.Plugins/Helpers/UserContextResolver.cs`
- `DetailsListVOA/Grid.tsx`
- `DetailsListVOA/tests/security-review-gate.test.ts` (test gate file)

Out of scope for this specific test:
- Full runtime penetration testing
- Dataverse environment configuration hardening
- Network layer / APIM policy validation

## Security Test Gate
Primary gate test file:
- `DetailsListVOA/tests/security-review-gate.test.ts`

Run command:

```bash
npx jest DetailsListVOA/tests/security-review-gate.test.ts --no-coverage
```

Latest local run status (2026-03-06):
- Test suites: 1 passed
- Tests: 13 passed
- Result: PASS

## What The Security Test Checks

### 1) SvtGetUserContext identity safety checks
File under test:
- `VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetUserContext.cs`

Assertions:
- User identity must come from `context.InitiatingUserId`.
- No identity source is accepted from `InputParameters`.
- `UserContextResolver.Resolve(...)` must be called with the initiating user id.
- `hasSvtAccess` output must be derived from resolved persona (`persona != UserPersona.None`).

Security goal:
- Prevent caller-controlled identity spoofing.

### 2) UserContextResolver authorization rules checks
File under test:
- `VOA.SVT.Plugins/Helpers/UserContextResolver.cs`

Assertions:
- Team query must enforce `teamtype == TeamTypeSecurityGroup`.
- Team matching must be allowlisted to:
  - `SVT Manager Team`
  - `SVT QA Team`
  - `SVT User Team`
- Team membership join must enforce `systemuserid == userId`.
- Role matching must be allowlisted to:
  - `VOA - SVT Manager`
  - `VOA - SVT QA`
  - `VOA - SVT User`
- Role join must enforce `systemuserid == userId`.
- Persona precedence must remain `Manager`, then `QA`, then `User`.
- Caseworker access must require explicit SVT User evidence (persona/team/roles checks in resolver logic).

Security goal:
- Ensure authorization logic remains allowlist-based and user-bound.

### 3) PCF frontend injection and sanitization checks
File under test:
- `DetailsListVOA/Grid.tsx`

Assertions:
- Must not contain known dangerous HTML/script patterns:
  - `dangerouslySetInnerHTML`
  - `.innerHTML =`
  - `eval(`
  - `new Function(`
- Must keep key input sanitizers in the code path:
  - `sanitizeAlphaNumHyphen(...ID_FIELD_MAX_LENGTH)`
  - `sanitizeTaskIdInput(...ID_FIELD_MAX_LENGTH)`
  - `sanitizeDigits(...UPRN_MAX_LENGTH)`

Security goal:
- Reduce XSS/script injection risk and maintain input hygiene for core search fields.

## Current Repository Status Snapshot
Snapshot date: 2026-03-06
Command used:

```bash
git status --short
```

Observed output at snapshot time:

```text
 M DetailsListVOA/Component.types.ts
 M DetailsListVOA/ControlManifest.Input.xml
 M DetailsListVOA/Grid.tsx
 M DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx
 M DetailsListVOA/config/ColumnProfiles.ts
 M DetailsListVOA/config/ControlConfig.ts
 M DetailsListVOA/config/ManifestConstants.ts
 M DetailsListVOA/constants/ScreenText.ts
 M DetailsListVOA/grid/Grid.tsx
 M DetailsListVOA/grid/GridCell.tsx
 M DetailsListVOA/index.ts
 M README.md
 M VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetUserContext.cs
 M docs/svtGetUserContext.md
?? DetailsListVOA/tests/column-alignment.test.ts
?? DetailsListVOA/tests/security-review-gate.test.ts
?? docs/column-alignment-rules.md
?? docs/cross-repo-behavior-testing.md
?? docs/plugin-calling-guide.md
?? docs/security-review-readme.md
```

## Known Limitations
- This gate is a static contract test. It verifies required code patterns but does not execute a full security attack simulation.
- Passing this test does not replace:
  - SAST/DAST tooling
  - Dataverse permission model validation
  - External penetration testing

## Recommended CI Usage
- Add the command to PR validation so merge is blocked if the gate fails.
- Add static analysis as a separate required check (CodeQL, dependency scan, secret scan, optional Semgrep).
- Keep this document updated when:
  - Security rules change
  - New high-risk files are added
  - Access-control logic changes
