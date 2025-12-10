import { GoogleGenAI } from "@google/genai";
import { GeminiResponse, AnalysisResult, SpectralDataset } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DATA_MODEL = "gemini-2.5-flash"; 
const ANALYSIS_MODEL = "gemini-2.5-flash";

const cleanAndParseJSON = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      try { return JSON.parse(jsonMatch[1]); } catch (e2) {}
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const raw = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(raw);
    }
    throw new Error("Could not parse JSON from model response");
  }
};

export const fetchSpectralData = async (query: string): Promise<GeminiResponse> => {
  const prompt = `
    Task: Retrieve the FULL, EXACT spectroscopic dataset for: "${query}".
    
    Role: Scientific Data Retrieval Agent.
    
    Instructions:
    1. USE GOOGLE SEARCH to locate the raw data source (NIST, HITRAN, Exo-Transmit, or published papers).
    2. EXTRACTION:
       - Extract the EXACT data points found in the table or source file.
       - **DO NOT SMOOTH, DO NOT SIMPLIFY, DO NOT ADD NOISE.**
       - I want the raw values exactly as they appear in the source.
    3. DENSITY: 
       - Retrieve as many data points as possible to preserve high resolution. 
       - Aim for >500 points if the source allows.
    4. RANGE: Use the full spectral range available in the source.
    
    Output JSON:
    {
      "name": "Scientific Name",
      "type": "Compound" | "Planet" | "Star",
      "dataPoints": [[1.23, 0.56], ...], // [Wavelength(um), Intensity]
      "unitsX": "Microns",
      "unitsY": "Absorbance / Flux",
      "description": "Exact source and instrument details.",
      "composition": ["Formula"],
      "references": ["Exact URL of the data source"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: DATA_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }, // Increased budget for processing larger datasets
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");

    const data = cleanAndParseJSON(text) as GeminiResponse;
    
    // Fallback: Inject citations if missing
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (grounding && (!data.references || data.references.length === 0)) {
       const urls = grounding.map(c => c.web?.uri).filter((u): u is string => !!u);
       data.references = [...new Set([...(data.references || []), ...urls])];
    }

    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to retrieve spectral data. Please try again.");
  }
};

export const analyzeSpectra = async (datasets: SpectralDataset[]): Promise<AnalysisResult> => {
  if (datasets.length === 0) return null;

  const names = datasets.map(d => d.name).join(", ");
  const context = datasets.map(d => `
    Object: ${d.name} (${d.type})
    Range: ${d.data[0]?.wavelength.toFixed(2)} - ${d.data[d.data.length-1]?.wavelength.toFixed(2)} um
  `).join("\n");

  const prompt = `
    Comparative spectral analysis for: ${names}.
    Context: ${context}
    
    Identify features, discuss chemistry/physics.
    Return JSON: { "summary": "...", "features": [{ "wavelength": 1.1, "species": "H2O", "description": "..." }] }
  `;

  try {
     const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text || "{}") as AnalysisResult;
  } catch (error) {
    return null;
  }
};