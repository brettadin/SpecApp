#!/usr/bin/env node
// CommonJS bootstrap for Electron main when the real implementation is an ESM module
// This avoids `require()` trying to load an `.mjs` file directly and failing with ERR_REQUIRE_ESM.

(async () => {
  try {
    // Dynamic import of the ESM main implementation executes its top-level code
    await import('./main.mjs');
  } catch (err) {
    // Log and exit so Electron shows the error clearly
    console.error('Failed to import ESM main.mjs:', err);
    process.exit(1);
  }
})();
