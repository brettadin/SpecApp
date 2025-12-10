export interface DataPoint {
  wavelength: number; // in microns usually, or nm
  intensity: number;  // normalized flux or absorbance
}

export interface Atom {
  x: number;
  y: number;
  z: number;
  symbol: string;
  id: number;
}

export interface Bond {
  source: number; // Atom ID
  target: number; // Atom ID
  type: number; // 1=Single, 2=Double, etc
}

export interface MolecularStructure {
  atoms: Atom[];
  bonds: Bond[];
  name: string;
}

export interface SpectralDataset {
  id: string;
  name: string;
  type: 'Planet' | 'Star' | 'Moon' | 'Exoplanet' | 'Exomoon' | 'Compound' | 'Element' | 'Line';
  data: DataPoint[];
  units: {
    x: string;
    y: string;
  };
  description: string;
  composition: string[]; // List of chemical formulas detected
  references: string[]; // Citations
  color: string;
  isVisible: boolean;
  structure?: MolecularStructure | null; // Cached 3D structure
  phase?: string; // 'Gas', 'Liquid', 'Solid', 'Solution', 'Unknown'
  instrumentation?: string;
}

export interface Annotation {
  id: string;
  wavelength: number;
  text: string;
  timestamp: number;
}

export interface GeminiResponse {
  name: string;
  type: string;
  dataPoints: [number, number][]; // Optimized: [wavelength, intensity] tuples for speed
  unitsX: string;
  unitsY: string;
  description: string;
  composition: string[];
  references: string[];
  phase?: string;
  instrumentation?: string;
}

export interface SpectralFeature {
  wavelength: number;
  description: string;
  species: string;
  type: 'stretch' | 'bend' | 'rock' | 'wag' | 'twist' | 'scissoring' | 'unknown' | 'atomic_line';
  transition?: string; // e.g. "2p 2P -> 3d 2D"
  activeBonds: string[]; // e.g., ["C-H", "O-H"]
  intensity: 'strong' | 'medium' | 'weak';
}

export type AnalysisResult = {
  summary: string;
  features: SpectralFeature[];
} | null;

export type ViewMode = 'microns' | 'nanometers' | 'wavenumber';
export type YAxisMode = 'absorbance' | 'transmittance';

export const CHART_COLORS = [
  '#00f0ff', // Cyan
  '#bd00ff', // Purple
  '#00ff9d', // Green
  '#ff0055', // Red/Pink
  '#ffae00', // Orange
  '#ffffff', // White
];