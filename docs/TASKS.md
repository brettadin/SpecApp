# ✅ Tasks & Roadmap

## Current Tasks (Active)
- [x] **Phase Differentiation**: Implemented logic to detect Gas vs Condensed phase in NIST data.
- [x] **UV-Vis Support**: Fixed scraping logic to find UV-Vis data at different NIST indices.
- [x] **Unit Conversion**: Added native support for Nanometers (nm) and Wavenumbers (cm⁻¹).
- [x] **Atomic Lines**: Fixed CSV parsing for NIST ASD to correctly display emission lines.
- [x] **Structure Fallback**: Added PubChem 2D fallback if 3D conformer is missing.

## Immediate To-Do
- [ ] **Data Persistence**: Save loaded datasets to `localStorage` so they survive a page refresh.
- [ ] **Error Toasts**: Replace browser `alert` or simple text errors with a robust Toast notification system.


## Future Roadmap
- [ ] **Backend Relay**: Build a simple Node.js/Python backend to proxy NIST requests, removing reliance on flaky public CORS proxies.
- [ ] **User Accounts**: Allow users to save "Projects" (collections of spectra + annotations) to a database.
- [ ] **Custom Upload**: Allow users to upload their own `.jcamp`, `.csv`, `.txt`, `.spc`, and any other files for analysis.
- [ ] **Header Reading**: Read headers from uploaded documents to display information regarding file inside app, and use it to correctly show data in ranges provided.
