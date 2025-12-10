# 🏗️ Architecture Report

## Overview
SpectraScope is built as a **Single Page Application (SPA)** using **React 19** and **TypeScript**. It operates entirely client-side for UI rendering, but heavily relies on external APIs and CORS proxies to fetch scientific data.

## Core Design Pattern
The application follows a **Service-Oriented Architecture** on the frontend. Logic regarding data retrieval is strictly separated from UI components.

### 1. The Service Layer (`/services`)
We treat external data sources as distinct services. The UI components do not know *how* data is fetched, only that they request it and receive a typed response.

*   **`nistService.ts`**: Handles scraping of the NIST Webbook (HTML parsing) and NIST Atomic Spectra Database (CSV parsing). It implements a **Proxy Rotation Strategy** to bypass CORS restrictions and basic rate limits.
*   **`geminiService.ts`**: Manages interaction with the Google Gemini API. It handles prompt engineering for data retrieval (JSON extraction) and spectral analysis (scientific interpretation).
*   **`structureService.ts`**: Interacts with the PubChem PUG REST API to fetch 3D (SDF) and 2D molecular structures. It includes fallback logic to generate "flat" 3D models if only 2D data exists.

### 2. State Management
State is currently managed via React `useState` and `useEffect` hooks within `App.tsx` and propagated down via props.
*   **Central Store**: `App.tsx` holds the `datasets[]` array, which is the source of truth for the chart.
*   **Selection State**: Active dataset, active feature, and hover states are tracked to synchronize the **Chart**, **Molecule Viewer**, and **Info Panel**.

### 3. Data Flow
1.  **User Input**: User queries via `ControlPanel`.
2.  **Service Call**: App calls `nistService.searchNISTDirect()` or `geminiService.fetchSpectralData()`.
3.  **Normalization**: Raw data (JCAMP-DX, CSV, or JSON) is parsed into a standardized `SpectralDataset` interface.
4.  **Rendering**:
    *   `SpectralChart` renders the X/Y data.
    *   `MoleculeViewer` renders the chemical structure (if available).
    *   `InfoPanel` renders metadata and analysis.

## Key Technical Decisions
*   **Client-Side Scraping**: To avoid maintaining a backend, we scrape NIST directly from the browser using CORS proxies. *Trade-off: This is fragile and depends on proxy uptime.*
*   **Three.js for Molecules**: We use raw Three.js rather than a wrapper library to allow for custom physics-based animations (vibrational modes) linked to spectral features.
*   **Recharts for Plotting**: Chosen for its React-native composability, allowing us to overlay infinite lines (atomic spectra) alongside continuous data (molecular spectra).
