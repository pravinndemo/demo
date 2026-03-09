# Cross-Repo Behavior Testing (Plugin + PCF)

Date: 2026-03-06

## Goal
Keep plugin and PCF repositories separate, while still enforcing one shared behavior contract for user-context and access-control flows.

## Ready Templates
Generic GitHub Actions templates are available in:
- `docs/ci-templates/plugin-ci.yml`
- `docs/ci-templates/pcf-ci.yml`
- `docs/ci-templates/cross-repo-smoke.yml`
- `docs/ci-templates/static-analysis.yml`
- `docs/ci-templates/README.md`

## Model
Use three layers:
1. Provider tests in the plugin repo.
2. Consumer tests in the PCF repo.
3. A shared contract package/repo consumed by both.

This avoids tight coupling and still detects breaking changes early.

## Recommended Repositories
1. `svt-plugins` (Dataverse plugin project)
2. `svt-pcf` (PCF control project)
3. `svt-contracts` (shared schemas + fixtures + versioning)

If you do not want a third repo, keep `contracts/` in plugin repo and publish as a package consumed by PCF.

## Shared Contract Structure (`svt-contracts`)

```text
svt-contracts/
  user-context/
    v1/
      schema/
        user-context-response.schema.json
      fixtures/
        manager-team.json
        qa-team.json
        user-team.json
        manager-plus-user-team.json
        none.json
        invalid-missing-fields.json
      docs/
        changelog.md
  package.json
  README.md
```

Contract rules:
1. Breaking response changes require major version bump.
2. Additive optional fields require minor version bump.
3. Fixture files are immutable per version.

## Plugin Repo Layout (`svt-plugins`)

```text
svt-plugins/
  src/
    VOA.SVT.Plugins/
      Helpers/
      Plugins/
  tests/
    unit/
      UserContextResolverTests.cs
      HasCaseworkerAccessTests.cs
    provider-contract/
      UserContextProviderContractTests.cs
      FixtureValidationTests.cs
    integration/
      SvtGetUserContextApiTests.cs
  Directory.Packages.props
  README.md
```

Plugin behavior tests should verify:
1. Team and role precedence.
2. Access decisions for mixed memberships.
3. Output fields and formats for `SvtGetUserContext`.
4. Deny paths and safe failure behavior.

Provider-contract tests should verify:
1. Plugin output can be mapped to every `svt-contracts/user-context/v1/fixtures/*.json` contract case.
2. No required field is removed or renamed.

## PCF Repo Layout (`svt-pcf`)

```text
svt-pcf/
  DetailsListVOA/
    tests/
      unit/
      consumer-contract/
        user-context.consumer.test.ts
      security/
        security-review-gate.test.ts
  docs/
    security-review-readme.md
    cross-repo-behavior-testing.md
  package.json
```

PCF behavior tests should verify:
1. UI state per persona (`Manager`, `QA`, `User`, `None`).
2. Denied access behavior for `None`.
3. Safe handling of malformed contract responses.
4. Backward compatibility for same major contract version.

Consumer-contract tests should use fixtures from `svt-contracts` directly, not copied snapshots.

## CI Layout

## Plugin CI (`svt-plugins`)
Required jobs:
1. `build`
2. `unit-tests`
3. `provider-contract-tests`
4. `static-analysis`
5. `publish-test-evidence`

Gate rule:
1. PR cannot merge unless all jobs pass.

## PCF CI (`svt-pcf`)
Required jobs:
1. `build`
2. `unit-tests`
3. `consumer-contract-tests`
4. `security-gate-tests`
5. `static-analysis`
6. `publish-test-evidence`

Gate rule:
1. PR cannot merge unless all jobs pass.

## Cross-Repo Integration CI (separate pipeline)
Trigger:
1. Plugin main branch updates.
2. PCF main branch updates.
3. Contract version release/tag.

Jobs:
1. Deploy plugin build to test Dataverse environment.
2. Deploy PCF build to same environment.
3. Run smoke tests:
   1. `SvtGetUserContext` persona resolution.
   2. Access denied path.
   3. One critical end-to-end screen flow per persona.

## Example Commands

Plugin repo:

```bash
dotnet restore
dotnet build --configuration Release
dotnet test tests/unit --configuration Release
dotnet test tests/provider-contract --configuration Release
dotnet test tests/integration --configuration Release
```

PCF repo:

```bash
npm ci
npm run build
npx jest DetailsListVOA/tests/consumer-contract --no-coverage
npx jest DetailsListVOA/tests/security-review-gate.test.ts --no-coverage
```

## Contract Dependency Pinning
In both repos, pin exact contract version:
1. Plugin: `svt-contracts-user-context = 1.2.0`
2. PCF: `@svt/contracts-user-context = 1.2.0`

Do not use floating versions for contract packages.

## Change Workflow
When plugin behavior changes:
1. Update contract schema and fixtures in `svt-contracts` if needed.
2. Release new contract version.
3. Update plugin tests to new contract version.
4. Update PCF consumer tests to same version.
5. Merge only when both repos pass.

When PCF behavior changes only:
1. Keep contract version unchanged.
2. Update consumer tests and UI tests.
3. Merge once PCF CI passes.

## Minimum First Step
If you want to phase this in:
1. Create `svt-contracts` with only `user-context/v1`.
2. Add one provider-contract test in plugin repo.
3. Add one consumer-contract test in PCF repo.
4. Add cross-repo integration smoke test for `SvtGetUserContext`.
