Yes. The best way is to split it into 3 outputs:

- `Tests` tab: shows every test case name, pass/fail, duration, and failure stack trace.
- `Code Coverage` tab: shows coverage summary and coverage artifact.
- Optional HTML artifact: a nicer report you can download/share with stakeholders.

For your PCF/Jest pipeline, I’d do this:

1. Keep `jest-junit` for Azure DevOps native test reporting.
2. Use `PublishTestResults@2` so Azure DevOps shows each test in the `Tests` tab.
3. Use `PublishCodeCoverageResults@2` for coverage.
4. Add a short Markdown summary to the pipeline `Extensions` tab.
5. If you want a presentable HTML report, add `jest-stare` and publish its folder as an artifact.

Example `test:ci`:

```json
"test:ci": "jest --ci --coverage --coverageReporters=cobertura --coverageReporters=lcov --reporters=default --reporters=jest-junit --reporters=jest-stare"
```

Install once:

```powershell
npm install -D jest-junit jest-stare
```

YAML:

```yaml
- task: Npm@1
  displayName: 'Run PCF unit tests'
  inputs:
    command: 'custom'
    workingDir: 'D365/VOA/VOA.SVT.PCF/VOA.SVT.DetailsList/'
    customCommand: 'run test:ci'
  env:
    JEST_JUNIT_OUTPUT_DIR: '$(Common.TestResultsDirectory)'
    JEST_JUNIT_OUTPUT_NAME: 'pcf-junit.xml'
    JEST_JUNIT_CLASSNAME: '{classname}'
    JEST_JUNIT_TITLE: '{title}'
    JEST_JUNIT_ANCESTOR_SEPARATOR: ' › '

- task: PublishTestResults@2
  displayName: 'Publish PCF test results'
  condition: succeededOrFailed()
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: '$(Common.TestResultsDirectory)/pcf-junit.xml'
    testRunTitle: 'PCF Jest Tests'
    publishRunAttachments: true
    failTaskOnFailedTests: true

- task: PublishCodeCoverageResults@2
  displayName: 'Publish PCF code coverage'
  condition: succeededOrFailed()
  inputs:
    summaryFileLocation: '$(Build.SourcesDirectory)/D365/VOA/VOA.SVT.PCF/VOA.SVT.DetailsList/coverage/cobertura-coverage.xml'
    failIfCoverageEmpty: true

- powershell: |
    $path = "$(Build.ArtifactStagingDirectory)\test-summary.md"
    @"
    # PCF Test Summary
    - Open the **Tests** tab for test-by-test results
    - Open the **Code Coverage** tab for coverage
    - Download the **pcf-test-html** artifact for the HTML report
    "@ | Set-Content -Path $path -Encoding utf8
    Write-Host "##vso[task.uploadsummary]$path"
  displayName: 'Upload test summary'
  condition: succeededOrFailed()

- task: CopyFiles@2
  displayName: 'Stage HTML test report'
  condition: succeededOrFailed()
  inputs:
    SourceFolder: 'D365/VOA/VOA.SVT.PCF/VOA.SVT.DetailsList/jest-stare'
    Contents: '**'
    TargetFolder: '$(Build.ArtifactStagingDirectory)/pcf-test-html/'

- task: PublishBuildArtifacts@1
  displayName: 'Publish HTML test report'
  condition: succeededOrFailed()
  inputs:
    PathtoPublish: '$(Build.ArtifactStagingDirectory)/pcf-test-html/'
    ArtifactName: 'pcf-test-html'
    publishLocation: 'Container'
```

Notes:

- No Azure DevOps extension is needed for the `Tests` tab or `Code Coverage` tab.
- If you only want native Azure DevOps reporting, `jest-junit` is enough.
- If you want a nicer demo/showcase report, add `jest-stare`.
- If you want HTML shown inside Azure DevOps itself as a tab, that usually needs a marketplace extension. Without that, publish it as an artifact.

Sources:
- Microsoft `PublishTestResults@2`: https://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/test/publish-test-results
- Microsoft `PublishCodeCoverageResults@2`: https://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/reference/publish-code-coverage-results-v2?view=azure-pipelines
- Microsoft `task.uploadsummary`: https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops
- `jest-junit` official repo: https://github.com/jest-community/jest-junit
- `jest-stare` docs: https://dkelosky.github.io/jest-stare/

If you want, I can give you a stripped-down HMRC version with:
1. only `Tests` tab, or
2. `Tests` tab + HTML showcase report.