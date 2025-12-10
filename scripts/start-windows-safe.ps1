<#
  start-windows-safe.ps1 — safer, user-confirmation based helper for SpectraScope on Windows.
  - Prompts before heavy operations like `npm install` and `npm run electron:dev`.
  - Writes logs to `scripts/start-windows.log` so users can paste errors back for support.
  - Sets working directory to script location so it runs no matter where invoked from.
#>

param(
  [switch]$Build
)

function Check-Command($cmd) {
  try { Get-Command $cmd -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

Write-Host "SpectraScope Windows Launcher (Safe Mode)"

# Move to the script location and determine repository root (parent of scripts folder).
try { Set-Location -Path $PSScriptRoot -ErrorAction Stop } catch { Write-Host "Warning: Could not set working directory to script location." }
$RepoRoot = Split-Path $PSScriptRoot -Parent


if (-not (Check-Command node)) {
  $consent = Read-Host "Node.js is not found on PATH. Would you like to open the Node.js download page? (Y/N)"
  if ($consent -match '^[Yy]') { Start-Process "https://nodejs.org/en/" }
  Write-Host "Please install Node.js LTS and ensure it is on PATH, then re-run this script."; Exit 1
}

$logFile = Join-Path $PSScriptRoot 'start-windows.log'
Write-Host "All output will also be saved to: $logFile"

# Ensure the log directory exists (PSScriptRoot is the 'scripts' dir but be defensive)
if (-not (Test-Path -Path $PSScriptRoot)) { New-Item -Path $PSScriptRoot -ItemType Directory -Force | Out-Null }

# Touch the log file to ensure the path exists and is writable
try { New-Item -Path $logFile -ItemType File -Force | Out-Null } catch { Write-Host "Warning: Could not create log file: $logFile. Output will still be shown in console." }

if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
  $consentInstall = Read-Host "node_modules is missing. Run 'npm install' now? This may take several minutes. Type 'Y' to continue"
  if ($consentInstall -match '^[Yy]') {
    Write-Host "Running npm install..."
    try {
      Push-Location -Path $RepoRoot
      npm install 2>&1 | Tee-Object -FilePath $logFile
      Pop-Location
    } catch {
      Write-Host "npm install command threw an error. Check $logFile for details.";
      Pop-Location
    }
    if ($LASTEXITCODE -ne 0) {
      Write-Error "npm install failed. Check $logFile for details and resolve before trying again."; Exit 1
    }
  } else { Write-Host "Skipping npm install. You can run 'npm install' manually later." }
}

if ($Build) {
  $consent = Read-Host "Build the project and run the packaged app (npm run start:prod)? Type 'Y' to continue"
  if ($consent -notmatch '^[Yy]') { Write-Host "Aborting as requested."; Exit 0 }
  Write-Host "Executing: npm run start:prod..."
  try { Push-Location -Path $RepoRoot; npm run start:prod 2>&1 | Tee-Object -FilePath $logFile; Pop-Location } catch { Write-Host "npm run start:prod encountered an error; check $logFile for details" }
} else {
  $consentRun = Read-Host "Start developer Electron session (runs dev server + electron)? Type 'Y' to continue"
  if ($consentRun -match '^[Yy]') {
    Write-Host "Starting Electron dev session..."
    try { Push-Location -Path $RepoRoot; npm run electron:dev:debug 2>&1 | Tee-Object -FilePath $logFile; Pop-Location } catch { Write-Host "electron dev failed; check $logFile for details" }
  } else { Write-Host "Skipped starting the Electron dev session." }
}

Write-Host "Done. See $logFile for command output and errors. If you need help, copy the file contents and paste them in the chat."
