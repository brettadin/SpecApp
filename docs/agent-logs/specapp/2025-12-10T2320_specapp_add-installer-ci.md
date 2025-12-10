# Agent Change Log – SpecApp

Run ID: specapp_2025-12-10T2320_add-installer-ci
Date: 2025-12-10
Approx. Time: 23:20 (local)
Branch / Context: main
User Task:
- Create a one-click Windows installer (and macOS/Linux artifacts) by adding a CI workflow and supporting build steps so non-developer users can install the app without Node/npm.

## Summary of Changes
- Added a cross-platform GitHub Actions workflow (`.github/workflows/desktop-build.yml`) that builds desktop installers for Windows, macOS, and Linux and uploads them as workflow artifacts.
- Added `build:installer` npm script to help developers build installers locally without publishing.
- Updated `README.md` to document CI workflow and the local `build:installer` command.

## Files Touched
1. `.github/workflows/desktop-build.yml`
   - Type of change: created
   - Purpose: Run builds on Windows, macOS, and Linux to produce platform installers, and upload installer artifacts to the workflow run.
2. `package.json`
   - Type of change: modified
   - Purpose: Add `build:installer` script that runs `npm run build` then `electron-builder --publish never`.
3. `README.md`
   - Type of change: modified
   - Purpose: Add documentation for one-click installer CI and guide to local `build:installer` build.

## Why These Changes Were Made
- The user requested an easy, one-click installation option; creating platform installers removes the need for users to have Node or npm installed and gives a simple installer experience.
- CI build artifacts allow non-developer users to download the native installers from the GitHub Actions run page.

## How It Was Implemented
- Added a GitHub workflow with three jobs (Windows, macOS, and Linux). Each job:
  - Checks out code
  - Sets up Node.js v18
  - Installs dependencies via `npm ci`
  - Runs `npm run build` to build the web assets with Vite
  - Runs `npm run electron:build` to create platform installers
  - Uploads `dist_electron/**` as workflow artifacts
- Added `build:installer` script for local builds that avoids publish attempts.

## Checks and Verification
- Verified the workflow steps are valid and apply typical `electron-builder` usage patterns.
- Verified the `build:installer` script is syntactically correct. Actual CI runs and local packaging need to be validated by someone with CI permissions or locally with Node/Electron installed.

## Side Effects and Follow-Ups
- The produced installers will be unsigned by default. For proper distribution, add code signing and notarization credentials (GH secrets) for Windows and macOS.
- GitHub Actions will produce unsigned artifacts for download. If you want automatic releases, add publishing and signing steps.
- Follow-up: optionally add a release automation workflow to build only per Git tag and publish installers automatically.
