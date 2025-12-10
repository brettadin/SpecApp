import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ControlPanel from './components/ControlPanel';
import SpectralChart from './components/SpectralChart';
import InfoPanel from './components/InfoPanel';
import { fetchSpectralData, analyzeSpectra } from './services/geminiService';
import { searchNISTDirect } from './services/nistService';
import { SpectralDataset, AnalysisResult, CHART_COLORS, Annotation, ViewMode } from './types';

const App: React.FC = () => {
  const [datasets, setDatasets] = useState<SpectralDataset[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
  const [isNormalized, setIsNormalized] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('wavelength');

  // --- Data Loading ---
  const handleSearch = useCallback(async (query: string, mode: 'ai' | 'direct') => {
    setIsLoading(true);
    setError(null);
    try {
      let result;
      
      if (mode === 'direct') {
        try {
           result = await searchNISTDirect(query);
        } catch (e: any) {
           throw e; // NIST Errors are usually descriptive now
        }
      } else {
        result = await fetchSpectralData(query);
      }
      
      const newDataset: SpectralDataset = {
        id: uuidv4(),
        name: result.name,
        type: result.type as any,
        data: result.dataPoints.map(dp => ({ wavelength: dp[0], intensity: dp[1] })),
        units: { x: result.unitsX, y: result.unitsY },
        description: result.description,
        composition: result.composition,
        references: result.references,
        color: CHART_COLORS[datasets.length % CHART_COLORS.length],
        isVisible: true,
      };

      setDatasets(prev => [...prev, newDataset]);
      if (datasets.length > 0) setAnalysisResult(null);

    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [datasets.length]);

  // --- State Management ---
  const handleToggleVisibility = (id: string) => {
    setDatasets(prev => prev.map(ds => 
      ds.id === id ? { ...ds, isVisible: !ds.isVisible } : ds
    ));
  };

  const handleRemove = (id: string) => {
    setDatasets(prev => prev.filter(ds => ds.id !== id));
  };

  const handleToggleNormalize = () => {
    setIsNormalized(prev => !prev);
  };
  
  const handleToggleViewMode = () => {
    setViewMode(prev => prev === 'wavelength' ? 'wavenumber' : 'wavelength');
  };

  // --- Analysis ---
  const handleAnalyze = async () => {
    setIsLoading(true);
    const visible = datasets.filter(d => d.isVisible);
    try {
      const result = await analyzeSpectra(visible);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError("Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Annotations ---
  const handlePlotClick = (wavelength: number) => {
    const text = window.prompt(`Add note at ${wavelength.toFixed(3)} µm:`);
    if (text) {
      const newNote: Annotation = {
        id: uuidv4(),
        wavelength,
        text,
        timestamp: Date.now()
      };
      setAnnotations(prev => [...prev, newNote]);
    }
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  // --- Export ---
  const handleExportCSV = () => {
    const visible = datasets.filter(d => d.isVisible);
    if (visible.length === 0) return;

    // Build header row
    const headers = ['Wavelength (um)'];
    visible.forEach(ds => headers.push(`${ds.name} (${isNormalized ? 'Normalized' : 'Raw'})`));
    
    // Collect all wavelengths
    const allWavelengths = new Set<number>();
    visible.forEach(ds => ds.data.forEach(p => allWavelengths.add(p.wavelength)));
    const sortedWavelengths = Array.from(allWavelengths).sort((a, b) => a - b);

    // Build rows
    const rows = sortedWavelengths.map(w => {
        const row = [w.toFixed(5)];
        visible.forEach(ds => {
            const point = ds.data.find(p => Math.abs(p.wavelength - w) < 0.001);
            let val = point ? point.intensity : '';
            if (val !== '' && isNormalized) {
                 const max = Math.max(...ds.data.map(p => p.intensity));
                 val = (val as number) / max;
            }
            row.push(val.toString());
        });
        return row.join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(',') + "\n" 
        + rows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spectrascope_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-space-950 text-white overflow-hidden font-sans selection:bg-accent-cyan selection:text-black">
      {/* Sidebar / Workbench Controls */}
      <ControlPanel 
        onSearch={handleSearch}
        isLoading={isLoading}
        datasets={datasets}
        onToggleVisibility={handleToggleVisibility}
        onRemove={handleRemove}
        onAnalyze={handleAnalyze}
        isNormalized={isNormalized}
        onToggleNormalize={handleToggleNormalize}
        onExport={handleExportCSV}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Error Toast */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/10 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg backdrop-blur-md max-w-lg">
            <span>⚠️</span>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* Chart Section */}
        <div className="flex-1 p-4 h-[60%] min-h-[400px]">
          <SpectralChart 
            datasets={datasets} 
            analysisResults={analysisResult} 
            annotations={annotations}
            isNormalized={isNormalized}
            onPlotClick={handlePlotClick}
            viewMode={viewMode}
          />
        </div>

        {/* Lab Notebook */}
        <InfoPanel 
          analysis={analysisResult} 
          datasets={datasets} 
          annotations={annotations}
          onDeleteAnnotation={handleDeleteAnnotation}
        />
      </div>
    </div>
  );
};

export default App;