import { GeminiResponse, DataPoint } from "../types";

const NIST_BASE_URL = "https://webbook.nist.gov";
// Using a public CORS proxy to attempt to make this work in the browser
const CORS_PROXY = "https://corsproxy.io/?"; 

/**
 * PARSER: Converts JCAMP-DX format (standard for spectra) to JSON.
 * This is a simplified parser for the specific subset NIST uses.
 */
const parseJCAMP = (jcamp: string): DataPoint[] => {
  const lines = jcamp.split(/\r?\n/);
  const dataPoints: DataPoint[] = [];
  let inDataSection = false;
  let xFactor = 1;
  let yFactor = 1;

  for (const line of lines) {
    if (line.startsWith('##XYDATA=')) {
      inDataSection = true;
      // check for compressed format (not supported in this simple parser)
      if (line.includes('(XY..XY)')) {
         console.warn("Compressed JCAMP detected. This simple parser might fail.");
      }
      continue;
    }
    if (line.startsWith('##END=')) {
      inDataSection = false;
      continue;
    }
    if (line.startsWith('##XFACTOR=')) {
      xFactor = parseFloat(line.split('=')[1]);
    }
    if (line.startsWith('##YFACTOR=')) {
      yFactor = parseFloat(line.split('=')[1]);
    }

    if (inDataSection) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Basic support for "X Y" format
      // Some files might be compressed. This regex looks for Number Space Number
      const parts = trimmed.split(/\s+/);
      
      if (parts.length >= 2) {
        const xVal = parseFloat(parts[0]);
        const yVal = parseFloat(parts[1]);

        if (!isNaN(xVal) && !isNaN(yVal)) {
          const x = xVal * xFactor;
          const y = yVal * yFactor;

          // NIST IR is usually in Wavenumbers (cm-1). 
          // Our system uses Microns as the base storage unit.
          // Conversion: Microns = 10000 / Wavenumber
          const wavelength = x !== 0 ? 10000 / x : 0;
          
          // Filter out garbage
          if (wavelength > 0 && wavelength < 1000) {
             dataPoints.push({
               wavelength: wavelength,
               intensity: y
             });
          }
        }
      }
    }
  }
  
  // Sort by wavelength (ascending)
  return dataPoints.sort((a, b) => a.wavelength - b.wavelength);
};

export const searchNISTDirect = async (query: string): Promise<GeminiResponse> => {
  // 1. Search for the compound to get the CAS ID
  // NIST Search URL: https://webbook.nist.gov/cgi/cbook.cgi?Name=methane&Units=SI
  const searchUrl = `${NIST_BASE_URL}/cgi/cbook.cgi?Name=${encodeURIComponent(query)}&Units=SI`;
  const proxiedSearchUrl = `${CORS_PROXY}${encodeURIComponent(searchUrl)}`;
  
  console.log(`Attempting direct fetch to: ${searchUrl} via proxy`);
  
  let searchRes;
  try {
    searchRes = await fetch(proxiedSearchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      }
    });
  } catch (e) {
    throw new Error("Network Error: Could not reach NIST even via Proxy. Check your connection.");
  }

  if (!searchRes.ok) throw new Error(`NIST Search failed: ${searchRes.statusText}`);
  
  const html = await searchRes.text();
  
  // 2. Extract CAS Registry Number using Regex
  const casMatch = html.match(/CAS Registry Number:<\/strong>\s*([\d-]+)/);
  
  if (!casMatch || !casMatch[1]) {
    throw new Error("Compound not found in NIST Webbook or CAS ID missing. Try the exact chemical name.");
  }
  
  const casID = casMatch[1];
  console.log(`Found CAS ID: ${casID}`);

  // 3. Fetch the IR Spectrum in JCAMP-DX format
  const cleanID = 'C' + casID.replace(/-/g, '');
  const jcampUrl = `${NIST_BASE_URL}/cgi/cbook.cgi?JCAMP=${cleanID}&Index=1&Type=IR`;
  const proxiedJcampUrl = `${CORS_PROXY}${encodeURIComponent(jcampUrl)}`;
  
  const jcampRes = await fetch(proxiedJcampUrl);
  if (!jcampRes.ok) throw new Error("Failed to retrieve spectral data file.");
  
  const jcampText = await jcampRes.text();
  
  if (jcampText.includes("##TITLE=Spectrum not found")) {
    throw new Error("IR Spectrum not available for this compound in NIST.");
  }

  const dataPoints = parseJCAMP(jcampText);

  if (dataPoints.length === 0) {
    throw new Error("Parsed data is empty. The file format might be compressed/unsupported.");
  }

  // 4. Construct Response
  return {
    name: query.toUpperCase(),
    type: "Compound",
    dataPoints: dataPoints.map(dp => [dp.wavelength, dp.intensity]),
    unitsX: "Microns",
    unitsY: "Absorbance", 
    description: `Directly retrieved from NIST Webbook (CAS: ${casID}). Data parsed from JCAMP-DX source.`,
    composition: [query],
    references: [searchUrl, jcampUrl]
  };
};