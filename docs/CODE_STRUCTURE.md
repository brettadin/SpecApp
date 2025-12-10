# 💻 Code Structure & Technology Stack

## Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19 | UI Component Library |
| **Language** | TypeScript | Type safety and interface definitions |
| **AI Engine** | Google GenAI SDK | Analyzing spectra & reasoning |
| **Visualization** | Recharts | 2D Spectral plotting |
| **3D Engine** | Three.js | 3D Molecular rendering & animation |
| **Icons** | Lucide React | Consistent UI iconography |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Utilities** | uuid | Unique ID generation for datasets |

## File Structure

```
/
├── index.html              # Entry point, imports index.tsx
├── index.tsx               # React Root mounting
├── App.tsx                 # Main Application Controller & State Holder
├── types.ts                # Global TypeScript Interfaces (DataPoint, SpectralDataset, etc.)
├── metadata.json           # Permissions & App Info
├── services/
│   ├── geminiService.ts    # AI Interaction (Analysis & Fallback Search)
│   ├── nistService.ts      # NIST Webbook & ASD Scraping Logic
│   └── structureService.ts # PubChem API Integration
└── components/
    ├── ControlPanel.tsx    # Left Sidebar: Search, Filters, Dataset List
    ├── SpectralChart.tsx   # Main Center: Interactive Recharts Graph
    ├── MoleculeViewer.tsx  # Bottom Center: Three.js 3D Viewer
    └── InfoPanel.tsx       # Bottom Right: Analysis text & Annotations
```

## Key Interfaces (`types.ts`)

*   **`SpectralDataset`**: The core object. Contains `data[]` (points), `structure` (3D coords), `metadata` (phase, instrumentation), and UI state (`isVisible`, `color`).
*   **`SpectralFeature`**: Represents a specific peak or line. Used for linking the Chart (visual peak) to the Molecule Viewer (vibrating bond).
*   **`AnalysisResult`**: The output from Gemini, containing a text summary and a list of identified features.

## Libraries & Licensing
*   **@google/genai**: Apache 2.0. Used for all AI operations.
*   **recharts**: MIT. Used for the main spectral display.
*   **three**: MIT. Used for molecular visualization.
*   **lucide-react**: ISC. Used for icons.
