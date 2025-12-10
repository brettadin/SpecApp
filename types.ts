export interface DataPoint {
  wavelength: number; // in microns usually, or nm
  intensity: number;  // normalized flux or absorbance
}

export interface SpectralDataset {
  id: string;
  name: string;
  type: 'Planet' | 'Star' | 'Moon' | 'Exoplanet' | 'Exomoon' | 'Compound' | 'Element';
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
}

export type AnalysisResult = {
  summary: string;
  features: {
    wavelength: number;
    description: string;
    species: string;
  }[];
} | null;

export type ViewMode = 'wavelength' | 'wavenumber';

export const CHART_COLORS = [
  '#00f0ff', // Cyan
  '#bd00ff', // Purple
  '#00ff9d', // Green
  '#ff0055', // Red/Pink
  '#ffae00', // Orange
  '#ffffff', // White
];