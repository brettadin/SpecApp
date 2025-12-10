# 📖 User Guide

## 1. Searching for Data

### Direct NIST Search (Recommended)
1.  Go to the **Datasets** tab in the left panel.
2.  Select **NIST DB**.
3.  Choose **IR Spectrum** or **UV-Vis Spectrum**.
4.  Type a compound name (e.g., "Benzene", "Water", "Carbon Dioxide").
5.  Press Enter. The app will fetch the data and detect the phase (Gas/Liquid).

### Atomic Line Search
1.  Select **Lines** in the source selector.
2.  Type an element or ion (e.g., "Fe", "Fe I", "H").
3.  (Optional) Open **Search Filters** to set min/max wavelength or intensity thresholds.
4.  Press Enter. Vertical lines representing atomic transitions will appear.

## 2. Viewing Data
*   **Toggle Visibility**: Click the Eye icon 👁️ next to a dataset to hide/show it.
*   **Change Units**: Go to the **View & Tools** tab. Click **µm**, **nm**, or **cm⁻¹** to change the X-Axis scale.
*   **Normalize**: Toggle "Normalize" to scale all spectra to a 0-1 height, making it easier to compare peak positions regardless of concentration.

## 3. Analyzing
1.  Ensure the datasets you want to analyze are visible.
2.  Click the **Analyze** button (wand icon) in the Dataset list (or "Analysis" button depending on UI version).
3.  Gemini will generate a summary in the bottom-right **Info Panel**.
4.  **Interactive 3D**: If Gemini identifies a feature (e.g., "C-H Stretch"), clicking or hovering that feature in the Info Panel will animate the 3D molecule in the viewer.

## 4. Exporting
1.  Go to **View & Tools**.
2.  Click **Download CSV**.
3.  A file named `spectrascope_export_[timestamp].csv` will download, containing columns for Wavelength and Intensity for all visible datasets.
