import { MolecularStructure, Atom, Bond } from "../types";

const PUBCHEM_3D_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name";
const PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://thingproxy.freeboard.io/fetch/"
];

export const fetchMolecularStructure = async (query: string): Promise<MolecularStructure | null> => {
  const q = query.trim();

  // 1. Atomic Fallback
  if (/^[A-Z][a-z]?$/.test(q) || ['H2', 'N2', 'O2'].includes(q.toUpperCase())) {
      // Simple generator could go here, but let's try PubChem first, it often has H2 etc.
  }

  // 2. Try Fetching SDF
  let sdfText: string | null = null;
  const targetUrl = `${PUBCHEM_3D_URL}/${encodeURIComponent(q)}/record/SDF/?record_type=3d`;

  for (const proxy of PROXIES) {
      try {
          const res = await fetch(`${proxy}${encodeURIComponent(targetUrl)}`);
          if (res.ok) {
              const text = await res.text();
              if (text.includes("V2000") || text.includes("V3000")) {
                  sdfText = text;
                  break;
              }
          }
      } catch (e) {
          console.warn(`Structure fetch failed on proxy ${proxy}`);
      }
  }

  if (sdfText) {
      return parseSDF(sdfText, q);
  }

  // 3. Fallback: Try 2D if 3D fails (PubChem often has 2D where 3D calculation failed)
  // We can "fake" 3D by just returning the 2D coords with Z=0, looking flat but better than nothing.
  const url2d = `${PUBCHEM_3D_URL}/${encodeURIComponent(q)}/record/SDF/?record_type=2d`;
  try {
     const res = await fetch(`${PROXIES[0]}${encodeURIComponent(url2d)}`);
     if (res.ok) {
         const text = await res.text();
         if (text.includes("V2000")) {
             return parseSDF(text, q + " (2D)");
         }
     }
  } catch(e) {}

  return null;
};

const parseSDF = (sdf: string, name: string): MolecularStructure => {
  const lines = sdf.split(/\r?\n/);
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  
  let countsLineIndex = -1;
  for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("V2000")) {
        countsLineIndex = i;
        break;
    }
  }

  if (countsLineIndex === -1) {
      // Sometimes headers are missing, try to guess based on line 4
      if (lines.length > 4) countsLineIndex = 3;
      else return { atoms: [], bonds: [], name };
  }

  const countsLine = lines[countsLineIndex];
  const numAtoms = parseInt(countsLine.substring(0, 3).trim());
  const numBonds = parseInt(countsLine.substring(3, 6).trim());

  if (isNaN(numAtoms)) return { atoms: [], bonds: [], name };

  // Parse Atoms
  for (let i = 0; i < numAtoms; i++) {
    const line = lines[countsLineIndex + 1 + i];
    const parts = line.split(/\s+/).filter(p => p !== '');
    if (parts.length >= 4) {
      atoms.push({
        x: parseFloat(parts[0]),
        y: parseFloat(parts[1]),
        z: parseFloat(parts[2]),
        symbol: parts[3],
        id: i + 1
      });
    }
  }

  // Parse Bonds
  for (let i = 0; i < numBonds; i++) {
    const line = lines[countsLineIndex + 1 + numAtoms + i];
    const parts = line.split(/\s+/).filter(p => p !== '');
    if (parts.length >= 3) {
      bonds.push({
        source: parseInt(parts[0]),
        target: parseInt(parts[1]),
        type: parseInt(parts[2])
      });
    }
  }

  return { atoms, bonds, name };
};