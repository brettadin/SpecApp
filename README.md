## Run the Production App Locally

If you want to run the Electron packaged app locally (without the Vite dev server), you can use the helper that runs `npm run build` and starts Electron.

Windows quick-start:

1. Install Node and dependencies (if you haven't already):
```powershell
cd C:\Code\SpecApp
npm install
```

2. Build and start the app (this launches Electron using the built built files):
```powershell
.
\start-prod.bat
```

This is useful for testing the app in a packaged state before producing platform-specific installers.

# SpectraScope 🌌

**SpectraScope** is a specialized scientific workbench for retrieving, visualizing, and analyzing spectroscopic data. It combines real-time data scraping from government databases (NIST) with generative AI (Google Gemini) to provide a comprehensive tool for astronomers, chemists, and students.

## 📚 Project Documentation

We maintain extensive documentation to ensure clarity in development, architecture, and usage. Please review the specific reports below:

### 🏗️ Architecture & Code
* [**Architecture Overview**](docs/ARCHITECTURE.md) - High-level design, data flow, and service separation.
* [**Code Structure & Tech Stack**](docs/CODE_STRUCTURE.md) - Deep dive into libraries (React, Three.js, Recharts), file organization, and key components.

### 🚀 Functionality
* [**Capabilities Report**](docs/CAPABILITIES.md) - Detailed breakdown of what the application can currently do.
* [**User Guide**](docs/USER_GUIDE.md) - Instructions on how to use search modes, visualization tools, and export features.

### ⚠️ Status & Roadmap
* [**Known Issues**](docs/KNOWN_ISSUES.md) - Current bugs, limitations, and stability concerns.
* [**Task List**](docs/TASKS.md) - Active development tasks and immediate to-do items.
* [**Wishlist**](docs/WISHLIST.md) - Long-term ideas and "dream features".

### 🔗 References
* [**Resources & References**](docs/RESOURCES.md) - Direct links to APIs, databases (NIST, PubChem), and scientific papers used.

---

## Quick Start

1. **Install Dependencies**: `npm install`
2. **Environment**: Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (Google Gemini) in your environment variables.
3. **Run (dev server)**: `npm run dev` (or platform specific command)
	- Optional: `npm run build` then `npm run preview` for a production preview

## Developer tools

After you've installed dependencies, you can run:

- Lint the codebase: `npm run lint`
- Run tests: `npm run test`
- Auto-format project files: `npm run format`

## Debugging in VS Code

1. Ensure you have the [Debugger for Chrome / Edge extension] or use the built-in "pwa-chrome" / "pwa-msedge" available in recent VS Code versions.
2. Start the dev server and attach the browser debugger from the Run/Debug view, or select the "Dev + Chrome" compound and press F5.
3. To debug tests, choose the "Debug Vitest Tests (Node)" launch config which will run `vitest --run` under Node and attach the debugger.

Note: The `preLaunchTask` will run `npm run dev` automatically. The dev server runs in the background so you can attach to it in a browser.

## AI AGENT LOGGING CONTRACT

refer to docs\AGENT_LOGGING_CONTRACT 



## Running as a Desktop (Standalone) App

You can run SpectraScope as a standalone desktop app using Electron. This wraps the Vite-built UI into a native app shell and allows packaging for Windows, macOS, and Linux.

1. Install dependencies: `npm install` (if you're unsure, `npm install` works; `npm ci` requires package-lock.json)
2. Start a desktop dev session (this runs the Vite dev server and launches Electron):

   * `npm run electron:dev` (ensure `GEMINI_API_KEY` is available via `.env` or environment)

   Example (PowerShell):

   ```powershell
   $env:GEMINI_API_KEY = 'your_api_key_here'
   npm run electron:dev
   ```
  
3. Build a distributable package (this creates OS installers/packages in `dist_electron`):

   * `npm run build` (to build the front-end assets)
   * `npm run electron:build` (to package into a desktop installer using `electron-builder`)

CI / One-click installers

We added a GitHub Actions workflow that will build desktop installers (Windows `.exe`/NSIS, macOS `.dmg`, and Linux AppImage) on pushes to `main` and for manual dispatch. Artifacts are uploaded to the workflow run so you can download installers directly from the Actions run page.

To build locally instead of using CI, run:

```powershell
npm run build:installer
```

This will build the web assets and then run `electron-builder` without attempting to publish the artifacts.

Security note: The build includes frontend code bundled into the application. Avoid embedding sensitive API keys directly into the renderer code — consider moving secret handling to the main process or using OS-provided secure storage solutions (Keychain / Credential Manager / SecretStore).


Note: Keep your `.env` file secret and do not commit it — use `.env.example` as the template.

### Windows: Install Node/npm if not available

On Windows, if you see "npm: The term 'npm' is not recognized", install Node.js (LTS) via:

* Installer: [https://nodejs.org/en/](https://nodejs.org/en/) (Download Windows Installer)
* Or package manager: `choco install nodejs-lts` (requires Chocolatey)

After installing, ensure `node -v` and `npm -v` return versions, then rerun `npm ci`.
For a simpler Windows experience, after installing Node, you can double-click `start.bat` in the repository root to run the app — this script will run the safer helper script (`scripts/start-windows-safe.ps1`) which prompts before long operations and writes logs to `scripts/start-windows.log` so you can copy and share outputs.

Important: If you double-click `start.bat`, it should run from your project folder automatically. If you instead run the command from a PowerShell window, make sure you first `cd` into the repository root (for example: `cd C:\Code\SpecApp`) and then run `start.bat` or the PowerShell helper script.

If the console closes quickly or you can’t copy errors, double-click `start.bat` — the safer helper will prompt and leave a persistent console for copying errors. If you need the previous behavior, `scripts/start-windows.ps1` remains available (note: it's the original script). Use the `start-windows-safe.ps1` for now to avoid freezes and accidental background installs.

NOTE: If you run commands manually from a shell, make sure to `cd` to the repository root first (e.g., `cd C:\Code\SpecApp`). Running `npm install 2>&1 | Tee-Object -FilePath .\scripts\start-windows.log` from inside the `scripts` folder will create a nested `scripts\scripts` path which won't exist and will fail. Always use the absolute (or `$PSScriptRoot`) path shown by the helper in the console for log file paths, or run the helper script itself.


## License

MIT
