import { GeminiResponse, DataPoint, SpectralFeature } from "../types";

const NIST_BASE_URL = "https://webbook.nist.gov";
const NIST_ASD_URL = "https://physics.nist.gov/cgi-bin/ASD/lines1.pl";

// Rotating Proxies to avoid rate limits / CORS issues
const CORS_PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://thingproxy.freeboard.io/fetch/" 
];

const fetchWithProxy = async (targetUrl: string): Promise<string> => {
    let lastError;
    for (const proxy of CORS_PROXIES) {
        try {
            const url = `${proxy}${encodeURIComponent(targetUrl)}`;
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                // NIST Webbook specific error check
                if (text.includes("Rate limit exceeded") || text.includes("403 Forbidden")) {
                    throw new Error("Rate limit");
                }
                return text;
            }
        } catch (e) {
            console.warn(`Proxy ${proxy} failed`, e);
            lastError = e;
        }
    }
    throw new Error("Unable to connect to NIST Database. Network or Proxy Error.");
};

const ELEMENT_MAP: Record<string, string> = {
  "HYDROGEN": "H", "HELIUM": "He", "LITHIUM": "Li", "BERYLLIUM": "Be", "BORON": "B",
  "CARBON": "C", "NITROGEN": "N", "OXYGEN": "O", "FLUORINE": "F", "NEON": "Ne",
  "SODIUM": "Na", "MAGNESIUM": "Mg", "ALUMINUM": "Al", "SILICON": "Si", "PHOSPHORUS": "P",
  "SULFUR": "S", "CHLORINE": "Cl", "ARGON": "Ar", "POTASSIUM": "K", "CALCIUM": "Ca",
  "TITANIUM": "Ti", "IRON": "Fe", "COPPER": "Cu", "ZINC": "Zn", "GOLD": "Au",
  "SILVER": "Ag", "MERCURY": "Hg", "LEAD": "Pb", "URANIUM": "U"
};

/**
 * Parses NIST Atomic Spectra Database (ASD) CSV output
 */
export const fetchAtomicLines = async (query: string, options: any = {}): Promise<SpectralFeature[]> => {
  const upper = query.trim().toUpperCase();
  const element = ELEMENT_MAP[upper] || query.trim();

  // Unit 1 = Angstrom, 2 = Microns, 0 = cm-1. We use Microns (2).
  const low_w = options.unit === 'nm' ? (options.minWavelength || 200) / 1000 : (options.minWavelength || 0.2);
  const high_w = options.unit === 'nm' ? (options.maxWavelength || 1000) / 1000 : (options.maxWavelength || 1.0);

  // output=0 (entire list), format=2 (CSV), unit=2 (microns)
  const url = `${NIST_ASD_URL}?spectra=${encodeURIComponent(element)}&limits_type=0&low_w=${low_w}&high_w=${high_w}&unit=2&submit=Retrieve+Data&format=2&output=0&page_size=100&intens_out=on&conf_out=on&term_out=on&en_on=on&j_out=on`;
  
  try {
    const csvText = await fetchWithProxy(url);
    const lines: SpectralFeature[] = [];
    
    // Split by new line, remove quotes
    const rows = csvText.split('\n');
    if (rows.length < 2) return [];

    // Header Detection
    // Typical Header: "Observed","Ritz","Rel.","Aki","Acc","Ei","Ek","Lower level","Upper level","Tp","Ref"
    let headerIdx = -1;
    for (let i=0; i<rows.length; i++) {
        if (rows[i].toLowerCase().includes('observed') && rows[i].toLowerCase().includes('ritz')) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1) return [];

    const cleanRow = (r: string) => r.split('","').map(s => s.replace(/^"|"$/g, '').trim());
    const header = cleanRow(rows[headerIdx]).map(h => h.toLowerCase());

    const obsIdx = header.findIndex(h => h.includes('observed'));
    const ritzIdx = header.findIndex(h => h.includes('ritz'));
    const intIdx = header.findIndex(h => h.includes('rel.') || h.includes('intensity'));
    const lowIdx = header.findIndex(h => h.includes('lower') || h.includes('conf.'));
    const upIdx = header.findIndex(h => h.includes('upper') || h.includes('term'));

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const cols = cleanRow(rows[i]);
        if (cols.length < 3) continue;

        let wl = parseFloat(cols[obsIdx]);
        if (isNaN(wl)) wl = parseFloat(cols[ritzIdx]);
        if (isNaN(wl)) continue;

        // Clean intensity (remove *, brackets, etc)
        let intensityRaw = cols[intIdx] || "";
        let intensity = parseFloat(intensityRaw.replace(/[^0-9.]/g, ''));
        if (isNaN(intensity)) intensity = 10;

        // Filter weak lines if requested
        if (options.minIntensity && intensity < options.minIntensity) continue;

        const description = `${element} Line ${wl.toFixed(4)} µm`;
        let transition = "Unknown";
        if (lowIdx > -1 && upIdx > -1) {
            transition = `${cols[lowIdx]} -> ${cols[upIdx]}`;
        }

        lines.push({
            wavelength: wl,
            description,
            species: element,
            type: 'atomic_line',
            transition,
            activeBonds: [],
            intensity: intensity > 1000 ? 'strong' : (intensity > 100 ? 'medium' : 'weak')
        });
    }

    return lines.slice(0, 100); // Limit results
  } catch (e) {
    console.error("NIST ASD Error", e);
    return [];
  }
};

interface JCAMPResult {
    dataPoints: DataPoint[];
    metadata: {
        phase?: string;
        instrumentation?: string;
        title?: string;
    }
}

const parseJCAMP = (jcamp: string): JCAMPResult => {
  const lines = jcamp.split(/\r?\n/);
  const dataPoints: DataPoint[] = [];
  
  const metadata: any = { phase: 'Unknown' };
  
  let xFactor = 1;
  let yFactor = 1;
  let isWavenumber = true; // Most NIST IR is wavenumber
  let isTransmittance = false;
  let inData = false;

  for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('##TITLE=')) metadata.title = trimmed.split('=')[1].trim();
      if (trimmed.startsWith('##STATE=')) metadata.phase = trimmed.split('=')[1].trim();
      if (trimmed.startsWith('##SPECTROMETER/DATA SYSTEM=')) metadata.instrumentation = trimmed.split('=')[1].trim();
      if (trimmed.startsWith('##XUNITS=')) {
          const u = trimmed.split('=')[1].toUpperCase();
          if (u.includes('MICROMETERS') || u.includes('MICRONS')) isWavenumber = false;
          if (u.includes('NANOMETERS')) { isWavenumber = false; xFactor = 0.001; } // Convert nm to um
      }
      if (trimmed.startsWith('##YUNITS=')) {
          if (trimmed.toUpperCase().includes('TRANSMITTANCE')) isTransmittance = true;
      }
      if (trimmed.startsWith('##XFACTOR=')) xFactor = parseFloat(trimmed.split('=')[1]);
      if (trimmed.startsWith('##YFACTOR=')) yFactor = parseFloat(trimmed.split('=')[1]);
      if (trimmed.startsWith('##XYDATA=')) { inData = true; continue; }
      if (trimmed.startsWith('##END=')) inData = false;

      if (inData) {
          // Format: X Y
          // or packed X Y1 Y2 Y3...
          const parts = trimmed.split(/\s+/).filter(p => p !== '');
          if (parts.length < 2) continue;
          
          // Simple XY support (NIST standard usually)
          // Handling packed format fully requires more complex logic, but NIST Webbook usually delivers (X++(Y..Y)) which is unpacked effectively line by line or XY pairs
          // Actually NIST often uses PACKED: X Y1 Y2 ... where X increments
          // But for simple "XYDATA=(X++(Y..Y))" lines often start with X and follow with Ys
          // Let's implement a robust reader for XY pairs which covers 90% of NIST simple downloads
          
          // Fallback: assume first is X, second is Y.
          let xRaw = parseFloat(parts[0]);
          let yRaw = parseFloat(parts[1]);
          
          if (!isNaN(xRaw) && !isNaN(yRaw)) {
              let realX = xRaw * xFactor;
              let realY = yRaw * yFactor;
              
              let wavelength = isWavenumber ? (realX > 0 ? 10000 / realX : 0) : realX;
              let intensity = realY;
              
              if (isTransmittance) {
                  // Convert T to A: A = 2 - log10(%T) or -log10(T) depending on scale
                  // NIST usually 0-1 or 0-100?
                  // Usually 0-1 if yFactor makes it so.
                  // Let's assume normalized 0-1.
                  intensity = -Math.log10(Math.max(realY, 0.0001));
              }
              
              if (wavelength > 0.05 && wavelength < 1000) {
                 dataPoints.push({ wavelength, intensity });
              }
          }
      }
  }

  return { dataPoints: dataPoints.sort((a,b) => a.wavelength - b.wavelength), metadata };
};

export const searchNISTDirect = async (query: string, type: 'IR' | 'UVVis'): Promise<GeminiResponse[]> => {
    // 1. Search CAS
    let searchHtml = "";
    try {
        searchHtml = await fetchWithProxy(`${NIST_BASE_URL}/cgi/cbook.cgi?Name=${encodeURIComponent(query)}&Units=SI`);
    } catch(e) { throw new Error("Connection failed to NIST"); }

    const casMatch = searchHtml.match(/CAS Registry Number:<\/strong>\s*([\d-]+)/);
    if (!casMatch) throw new Error("Compound not found or no CAS number available.");
    
    const casID = casMatch[1];
    const cleanID = 'C' + casID.replace(/-/g, '');
    
    const results: GeminiResponse[] = [];
    
    // NIST Indexing Strategy:
    // They don't list how many spectra exist easily. We must probe indices.
    // Usually 0, 1, 2.
    // UVVis might be at index 0 even if IR is present? No, they are separate types.
    // Query: Type=IR or Type=UVVis
    
    const maxIndices = 3; // Check first 3 slots
    
    for (let i = 0; i < maxIndices; i++) {
        try {
            const jcampUrl = `${NIST_BASE_URL}/cgi/cbook.cgi?JCAMP=${cleanID}&Index=${i}&Type=${type}`;
            const jcamp = await fetchWithProxy(jcampUrl);
            
            if (jcamp.includes("##XYDATA=") && !jcamp.includes("Spectrum not found")) {
                const parsed = parseJCAMP(jcamp);
                
                if (parsed.dataPoints.length > 5) {
                    const phase = parsed.metadata.phase || (jcamp.toLowerCase().includes("gas") ? "Gas" : "Condensed");
                    const name = `${query} (${phase})`;
                    
                    results.push({
                        name: name,
                        type: "Compound",
                        dataPoints: parsed.dataPoints.map(dp => [dp.wavelength, dp.intensity]),
                        unitsX: "Microns",
                        unitsY: "Absorbance",
                        description: parsed.metadata.title || `${phase} Phase Spectrum`,
                        composition: [query],
                        references: [jcampUrl],
                        phase: phase,
                        instrumentation: parsed.metadata.instrumentation || "NIST Standard Reference"
                    });
                }
            }
        } catch (e) {
            // Index likely doesn't exist, continue to next
        }
    }
    
    if (results.length === 0) {
        throw new Error(`No ${type} data found for ${query}. Try a different spelling or compound.`);
    }
    
    return results;
}