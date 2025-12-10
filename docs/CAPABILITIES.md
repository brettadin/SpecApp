# 🚀 Capabilities Report

## 1. Multi-Source Data Retrieval
SpectraScope aggregates data from distinct scientific sources:

### A. NIST Chemistry Webbook (Direct Scraping)
*   **IR Spectra**: Retreives Infrared spectra (Absorbance/Transmittance).
*   **UV-Vis Spectra**: Retrieves Ultraviolet-Visible spectra.
*   **Phase Detection**: Automatically detects and tags data as **[GAS]**, **[LIQUID]**, or **[SOLID]** based on JCAMP-DX headers.
*   **Instrumentation**: Extracts spectrometer details when available.

### B. NIST Atomic Spectra Database (ASD)
*   **Atomic Lines**: Retreives emission/absorption lines for elements (e.g., "Fe I", "H", "C II").
*   **Filtering**: Supports filtering by Wavelength Range (min/max), Units (nm/µm), and Intensity threshold.

### C. Generative AI (Gemini)
*   **Fallback Search**: If NIST fails, Gemini uses Google Search grounding to find raw data points from academic papers or other databases (Hitran, Exo-Transmit).

## 2. Advanced Visualization

### Spectral Charting
*   **Dynamic Axis**: Switch X-Axis between **Microns (µm)**, **Nanometers (nm)**, and **Wavenumbers (cm⁻¹)**.
*   **Y-Axis Modes**: Toggle between **Absorbance** and **Transmittance**.
*   **Normalization**: Normalize all loaded spectra to a 0-1 range for easy shape comparison.
*   **Atomic Overlays**: Overlay discrete atomic lines on top of continuous molecular spectra.

### 3D Molecular Viewer
*   **Structure Fetching**: Automatically pulls 3D SDF data from PubChem.
*   **Vibrational Animation**: When a specific spectral feature (e.g., "C-H Stretch") is identified, the 3D model animates to simulate that physical vibration.

## 3. AI Analysis
*   **Spectra Interpretation**: Sends the visible data context to Gemini 2.5 Flash to generate a scientific summary.
*   **Feature Identification**: AI identifies peaks and maps them to physical phenomena (e.g., "O-H Stretch at 2.9µm").

## 4. Data Management
*   **Export**: Download currently visible datasets as a standardized CSV.
*   **Annotation**: Users can click the chart to add persistent notes at specific wavelengths.
*   **Comparison**: Load multiple datasets simultaneously to compare different compounds or phases (e.g., Water Gas vs. Water Liquid).
