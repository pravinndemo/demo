param(
  [string]$EnvUrl,
  [switch]$Managed,
  [switch]$UsePacBuild,
  [switch]$FixNpmPythonWarn,
  [string]$PublisherName = "dsync",
  [string]$PublisherPrefix = "svt"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found on PATH: $name"
  }
}

Ensure-Command npm
Ensure-Command pac

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$solutionDir = Join-Path $repoRoot 'solution'
$pcfProj = Join-Path $repoRoot 'DetailsListVOA.pcfproj'
$binDir = Join-Path $repoRoot 'bin'

Write-Host "Repo root: $repoRoot"

# Remove legacy npm 'python' config to avoid deprecation warning
function Remove-NpmLegacyConfigs {
  param([string[]]$Keys = @('python','unsafe-perm'))

  foreach ($key in $Keys) {
    try { $userVal = (& npm config get $key --location=user 2>$null).ToString().Trim() } catch { $userVal = '' }
    if ($userVal -and $userVal -ne 'undefined' -and $userVal -ne 'null') {
      Write-Host "Removing npm user config '$key'..."
      try { & npm config delete $key --location=user | Out-Host } catch { Write-Warning $_.Exception.Message }
    }

    try { $globalVal = (& npm config get $key --location=global 2>$null).ToString().Trim() } catch { $globalVal = '' }
    if ($globalVal -and $globalVal -ne 'undefined' -and $globalVal -ne 'null') {
      Write-Host "Removing npm global config '$key'..."
      try { & npm config delete $key --location=global | Out-Host } catch { Write-Warning $_.Exception.Message }
    }
  }
}

if ($FixNpmPythonWarn) { Remove-NpmLegacyConfigs }

# Clean + build
Push-Location $repoRoot
try {
  Write-Host "Running npm ci..."
  npm ci
  Write-Host "Rebuilding PCF..."
  npm run rebuild
} finally {
  Pop-Location
}

# Ensure solution folder exists and is initialized
if (-not (Test-Path $solutionDir)) {
  Write-Host "Creating solution folder at $solutionDir"
  New-Item -ItemType Directory -Path $solutionDir | Out-Null
  Push-Location $solutionDir
  try {
    Write-Host "Initializing solution (publisher: $PublisherName / $PublisherPrefix)"
    pac solution init --publisher-name $PublisherName --publisher-prefix $PublisherPrefix | Out-Host
  } finally {
    Pop-Location
  }
}

# Add reference to PCF project (ignore if already added)
Push-Location $solutionDir
try {
  if (-not (Test-Path $pcfProj)) {
    throw "PCF project not found at $pcfProj"
  }
  Write-Host "Adding project reference: $pcfProj"
  try {
    pac solution add-reference --path $pcfProj | Out-Host
  } catch {
    Write-Warning "add-reference reported an error (possibly already added): $($_.Exception.Message)"
  }
} finally {
  Pop-Location
}

# Prepare output folder
if (-not (Test-Path $binDir)) {
  New-Item -ItemType Directory -Path $binDir | Out-Null
}
Get-ChildItem -Path (Join-Path $binDir 'DetailsListVOA_*.zip') -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Create solution package(s)
$unmanagedZip = Join-Path $binDir 'DetailsListVOA_unmanaged.zip'
$managedZip = Join-Path $binDir 'DetailsListVOA_managed.zip'

if ($UsePacBuild.IsPresent) {
  Push-Location $solutionDir
  try {
    $cdsprojPath = Join-Path $solutionDir 'solution.cdsproj'
    if (-not (Test-Path $cdsprojPath)) {
      throw "cdsproj not found: $cdsprojPath"
    }
    Write-Host "Building solution via PAC (Release)"
    pac solution build --configuration Release | Out-Host

    Write-Host "Creating unmanaged package -> $unmanagedZip"
    pac solution create-package --path $cdsprojPath --packageType Unmanaged --configuration Release --zipFile $unmanagedZip | Out-Host

    if ($Managed.IsPresent) {
      Write-Host "Creating managed package -> $managedZip"
      pac solution create-package --path $cdsprojPath --packageType Managed --configuration Release --zipFile $managedZip | Out-Host
    }
  } finally {
    Pop-Location
  }
} else {
  # Pack using SolutionPackager from src folder (no MSBuild required)
  $srcFolder = Join-Path $solutionDir 'src'
  if (-not (Test-Path $srcFolder)) {
    throw "Expected solution source folder not found: $srcFolder"
  }
  Write-Host "Packing unmanaged solution from '$srcFolder' -> $unmanagedZip"
  pac solution pack --folder $srcFolder --zipFile $unmanagedZip --packageType Unmanaged | Out-Host
  if ($Managed.IsPresent) {
    Write-Host "Packing managed solution from '$srcFolder' -> $managedZip"
    pac solution pack --folder $srcFolder --zipFile $managedZip --packageType Managed | Out-Host
  }
}

# Optional import
if ($EnvUrl) {
  Write-Host "Authenticating to $EnvUrl"
  pac auth create --url $EnvUrl | Out-Host
  $zipToImport = if ($Managed.IsPresent) { $managedZip } else { $unmanagedZip }
  Write-Host "Importing solution: $zipToImport"
  pac solution import --path $zipToImport | Out-Host
}

Write-Host "Done. Zips at: $binDir" -ForegroundColor Green
