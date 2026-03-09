# CI YAML Templates (Generic)

Date: 2026-03-06

These templates are generic GitHub Actions workflows for the split-repo model:
- plugin repo CI
- PCF repo CI
- cross-repo smoke pipeline

## Files
- `docs/ci-templates/plugin-ci.yml`
- `docs/ci-templates/pcf-ci.yml`
- `docs/ci-templates/cross-repo-smoke.yml`
- `docs/ci-templates/static-analysis.yml`

## How to Use
1. Copy each template into the target repo's `.github/workflows/` folder.
2. Rename files to match your repo conventions.
3. Update placeholder paths/commands in each `env` block.
4. Add required secrets in the target repository.

## Required Secrets (cross-repo smoke template)
- `TEST_ENV_URL`
- `PAC_APP_ID`
- `PAC_CLIENT_SECRET`
- `PAC_TENANT_ID`

## Optional Secrets (static analysis template)
- `SEMGREP_APP_TOKEN` (needed only if you want Semgrep Cloud/App integration)

## Expected Helper Scripts (cross-repo smoke template)
The smoke template calls these scripts so deployment logic stays repo-specific:
- `scripts/ci/deploy-plugin.sh <plugin-package.zip>`
- `scripts/ci/deploy-pcf.sh <pcf-package.zip>`
- `scripts/ci/run-smoke-tests.sh`

## Notes
- Templates default to branch `main`. Change if your default branch differs.
- Templates are strict by default (failing when expected test projects/files are missing).
- `cross-repo-smoke.yml` is intended for an orchestration repo or shared DevOps repo.
- In `static-analysis.yml`, each scanner can be toggled via `RUN_*` environment flags.
