import { GoogleGenAI } from '@google/genai';
import Store from 'electron-store';

const store = new Store();
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || store.get('geminiApiKey') || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const cleanAndParseJSON = (text) => {
  try { return JSON.parse(text); }
  catch (e) {
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
    throw new Error('Could not parse JSON from model response');
  }
}

export async function fetchSpectralData(query) {
  const prompt = `Retrieve the FULL spectroscopic dataset for: "${query}".`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingBudget: 2048 } }
    });
    const text = response.text || '';
    const data = cleanAndParseJSON(text);
    return data;
  } catch (err) {
    console.error('nodeGeminiService.fetchSpectralData Error:', err);
    throw err;
  }
}

export async function analyzeSpectra(datasets) {
  if (!datasets || datasets.length === 0) return null;
  const names = datasets.map(d => d.name).join(', ');
  const prompt = `Detailed spectral analysis for: ${names}.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    const text = response.text || '{}';
    return cleanAndParseJSON(text);
  } catch (err) {
    console.error('nodeGeminiService.analyzeSpectra Error:', err);
    return null;
  }
}
