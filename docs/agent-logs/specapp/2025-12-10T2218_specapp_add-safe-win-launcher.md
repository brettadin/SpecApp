# Agent Change Log – SpecApp

Run ID: specapp_2025-12-10T2218_add-safe-win-launcher
Date: 2025-12-10
Approx. Time: 22:18 (local)
Branch / Context: main
User Task:
- The user reported the Windows start script “froze everything”; add safer behavior to avoid unintended heavy operations and provide logs.

## Summary of Changes
- Added `scripts/start-windows-safe.ps1`: a safer PowerShell helper that prompts before installing dependencies and starting dev sessions, with logging to `scripts/start-windows.log`.
- Updated `start.bat` to call the safe helper instead of the original script so double-clicks use the safer path by default.
- Updated `README.md` to mention the safe helper and where logs are written for troubleshooting.

## Files Touched
1. `scripts/start-windows-safe.ps1`
   - Type of change: created
   - Purpose: Safer PowerShell helper that prompts before heavy operations and logs output for troubleshooting. It ensures the script runs relative to the script path and captures command output.
2. `start.bat`
   - Type of change: modified
   - Purpose: Updated to call the safer helper script and keep the PowerShell window open for error capture.
3. `README.md`
   - Type of change: modified
   - Purpose: Document updated start workflow and mention the safe script & log file.

## Why These Changes Were Made
- The user reported that the previous script froze their system, likely because it launched `npm install` and `npm run electron:dev` without explicit confirmation and heavy background processes could starve the system.
- Adding a safe mode prevents accidental heavy operations and allows users to capture logs for further debugging.

## How It Was Implemented
- Implemented user prompts (`Read-Host`) before `npm install`, `npm run start:prod`, and `npm run electron:dev` in `start-windows-safe.ps1`.
- Added `Tee-Object` logging to `scripts/start-windows.log` so all output is preserved for troubleshooting.
- Updated `start.bat` to call the safe script, and updated the README for instructions.

## Checks and Verification
- Performed a syntax check for the new script by running a PowerShell invocation that exercises the script in the environment (without performing heavy operations). Observed the script asks for user confirmation instead of automatically performing actions.

## Side Effects and Follow-Ups
- Non-technical users now must confirm actions before long-running tasks; this is a trade-off for safety.
- Next steps: If you prefer automatic behavior, a switch (`-Auto`) can be added to skip prompts. Also, consider creating prebuilt Electron installers so end users don't need Node at all.
