<#
  start-windows-prod.ps1 — Build and run the production Electron app on Windows.
  This script is intended for running the packaged app locally without the dev server.
  It will prompt to install dependencies and run `npm run build` before launching Electron.
#>

param(
  [switch]$ForceInstall
)

function Check-Command($cmd) {
  try { Get-Command $cmd -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

Write-Host "SpectraScope Production Runner"

if (-not (Check-Command node)) {
  Write-Host "Node.js is not installed on PATH. Please install Node LTS from https://nodejs.org/en/ and try again."; Exit 1
}

$logFile = Join-Path $PSScriptRoot 'start-windows-prod.log'
try { New-Item -Path $logFile -ItemType File -Force | Out-Null } catch {}

if ($ForceInstall -or (-not (Test-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'node_modules')))) {
  $consent = Read-Host "Install dependencies (npm install)? Type 'Y' to continue"
  if ($consent -match '^[Yy]') {
    Push-Location -Path (Split-Path $PSScriptRoot -Parent)
    npm install 2>&1 | Tee-Object -FilePath $logFile
    Pop-Location
  } else { Write-Host "Skipping npm install." }
}

Write-Host "Building assets and launching Electron (production)...";
Push-Location -Path (Split-Path $PSScriptRoot -Parent)
try { npm run build 2>&1 | Tee-Object -FilePath $logFile } catch { Write-Host "Build failed; check $logFile" }
try { electron . 2>&1 | Tee-Object -FilePath $logFile } catch { Write-Host "Electron failed to start; check $logFile" }
Pop-Location

Write-Host "Launched Electron in production mode; see $logFile for output/errors.";
