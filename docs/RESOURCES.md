# 🔗 Resources & References

## Data Sources
*   **[NIST Chemistry WebBook](https://webbook.nist.gov/chemistry/)**: Primary source for IR and UV-Vis molecular spectra.
*   **[NIST Atomic Spectra Database (ASD)](https://physics.nist.gov/PhysRefData/ASD/lines_form.html)**: Source for atomic emission and absorption lines.
*   **[PubChem REST API (PUG REST)](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest)**: Source for molecular properties and 3D SDF structures.

## AI & Grounding
*   **[Google AI Studio](https://aistudio.google.com/)**: Platform used to tune the Gemini 2.5 Flash model prompts.
*   **[Google Search Grounding](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/grounding/google-search)**: Used to verify spectral data when direct database access fails.

## Visualization Libraries
*   **[Three.js Documentation](https://threejs.org/docs/)**: Core 3D engine.
*   **[Recharts](https://recharts.org/en-US/)**: Composable charting library for React.
*   **[Lucide Icons](https://lucide.dev/)**: Iconography set.

## Spectral File Formats
*   **[JCAMP-DX Standard](http://www.jcamp-dx.org/)**: The format used by NIST for spectral data transfer, parsed manually in `nistService.ts`.
*   **[SDF/Molfile](https://en.wikipedia.org/wiki/Chemical_table_file)**: The format used by PubChem for 3D structures, parsed in `structureService.ts`.
