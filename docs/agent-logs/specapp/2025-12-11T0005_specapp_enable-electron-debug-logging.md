# Agent Change Log – SpecApp

Run ID: specapp_2025-12-11T0005_enable-electron-debug-logging
Date: 2025-12-11
Approx. Time: 00:05 (local)
Branch / Context: main
User Task:
- Electron crashed in dev mode returning an exit code with no actionable output in the logs; enable Electron debug flags and ensure the safe script runs the debug mode to capture more information.

## Summary of Changes
- Updated `package.json` `electron:dev` script to enable `ELECTRON_ENABLE_LOGGING` and `ELECTRON_ENABLE_STACK_DUMPING` flags to increase logging for the Electron runtime.
- Added `electron:dev:debug` script with additional `ELECTRON_ENABLE_STACK_TRACING` to gather stack traces.
- Updated `scripts/start-windows-safe.ps1` to run the `electron:dev:debug` script for dev sessions to capture more verbose logs by default.

## Files Touched
1. `package.json`
   - Type of change: modified
   - Purpose: Add Electron logging flags and a dedicated `electron:dev:debug` script for more detailed runtime logs.
2. `scripts/start-windows-safe.ps1`
   - Type of change: modified
   - Purpose: Run `electron:dev:debug` rather than the plain `electron:dev` for development sessions to expose useful stack traces and logging when the main process crashes.

## Why These Changes Were Made
- The user reported Electron crashes (exit code 3221225786). The existing logs didn't provide adequate information. Electron's runtime flags often surface stack dumps and internal errors which aid debugging.

## How It Was Implemented
- Used `cross-env` to set `ELECTRON_ENABLE_LOGGING`, `ELECTRON_ENABLE_STACK_DUMPING`, `ELECTRON_ENABLE_STACK_TRACING` environment variables in the `electron:dev*` scripts. These instruct Electron to enable additional internal logging and stack dumps.
- The safe script was modified to run the debug script and thus capture the richer output into `scripts/start-windows.log`.

## Checks and Verification

- Re-run the dev start via './scripts/start-windows-safe.ps1' and verify that the logs reflect the Electron debug environment variables.

## Side Effects and Follow-Ups

- The debug output is more verbose; the log may include sensitive stack traces. Use them for debugging only.

- If a stack dump is produced, provide the `scripts\start-windows.log` content and we’ll analyze the root cause and patch it.
