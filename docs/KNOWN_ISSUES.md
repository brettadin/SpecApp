# ⚠️ Known Issues & Limitations

## 1. Network & CORS Proxies
*   **Issue**: The application relies on public CORS proxies (`corsproxy.io`, `allorigins.win`) to access NIST.
*   **Impact**: If these proxies go down or rate-limit the request, data fetching will fail even if NIST is up.
*   **Workaround**: The app implements a "Proxy Rotation" strategy, trying 3 different proxies before failing.

## 2. NIST Scraping Fragility
*   **Issue**: NIST Webbook is an old HTML site. If they change their URL structure or HTML layout, the regex-based scraping in `nistService.ts` will break.
*   **Impact**: Search results might return "Compound not found" incorrectly.

## 3. 3D Structure Availability
*   **Issue**: Not all compounds have 3D conformers in PubChem.
*   **Impact**: Some searches may load the spectrum but show "No Structure Data" in the viewer.
*   **Mitigation**: We attempt to fetch 2D coordinates as a fallback, but these appear flat.

## 4. AI Hallucination
*   **Issue**: While heavily grounded, Gemini may occasionally invent spectral features if the data is noisy or ambiguous.
*   **Impact**: Analysis summaries should be verified by a human scientist.

## 5. UV-Vis vs IR Overlap
*   **Issue**: When viewing UV-Vis (nanometers) and IR (microns) simultaneously, the scale difference is massive (0.5 vs 10.0).
*   **Impact**: The chart may look compressed. Users should use the "View Mode" toggle to switch units rather than trying to view both at `microns` scale.
