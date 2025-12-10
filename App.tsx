import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ControlPanel from './components/ControlPanel';
import SpectralChart from './components/SpectralChart';
import InfoPanel from './components/InfoPanel';
import MoleculeViewer from './components/MoleculeViewer';
import { fetchSpectralData, analyzeSpectra } from './services/geminiService';
import { searchNISTDirect, fetchAtomicLines } from './services/nistService';
import { fetchMolecularStructure } from './services/structureService';
import { SpectralDataset, AnalysisResult, CHART_COLORS, Annotation, ViewMode, YAxisMode, MolecularStructure, SpectralFeature } from './types';

const App: React.FC = () => {
  const [datasets, setDatasets] = useState<SpectralDataset[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
  const [isNormalized, setIsNormalized] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('microns'); // Default
  const [yAxisMode, setYAxisMode] = useState<YAxisMode>('absorbance');
  
  // Selection State
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [activeStructure, setActiveStructure] = useState<MolecularStructure | null>(null);
  
  const [hoverWavelength, setHoverWavelength] = useState<number | null>(null);
  const [activeFeature, setActiveFeature] = useState<SpectralFeature | null>(null);

  useEffect(() => {
    if (activeDatasetId) {
        const ds = datasets.find(d => d.id === activeDatasetId);
        if (ds && ds.structure) {
            setActiveStructure(ds.structure);
        } else {
            setActiveStructure(null);
        }
    } else {
        setActiveStructure(null);
    }
  }, [activeDatasetId, datasets]);

  const handleSearch = useCallback(async (query: string, mode: 'ai' | 'direct' | 'lines', filters?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'lines') {
          // Fetch Atomic Lines (NIST ASD)
          const lines = await fetchAtomicLines(query, filters);
          if (lines.length === 0) throw new Error(`No lines found for ${query} with current filters.`);
          
          const struct = await fetchMolecularStructure(query);
          
          const newDataset: SpectralDataset = {
              id: uuidv4(),
              name: query,
              data: lines.map(l => ({ wavelength: l.wavelength, intensity: 1 })), 
              units: { x: 'Microns', y: 'Rel. Int' },
              description: `NIST ASD Lines for ${query}. Found ${lines.length} lines.`,
              composition: [query],
              references: ['https://physics.nist.gov/ASD'],
              color: '#bd00ff', // Purple for lines
              isVisible: true,
              type: 'Line',
              structure: struct,
              instrumentation: 'Atomic Emission/Absorption'
          };
          
          setDatasets(prev => [...prev, newDataset]);
          setActiveDatasetId(newDataset.id);
          setViewMode('nanometers'); // Lines usually viewed in nm
          
          setAnalysisResult({
              summary: `Loaded ${lines.length} atomic lines for ${query} from NIST Atomic Spectra Database.`,
              features: lines
          });

      } else {
          // Standard Spectrum Search (Compound)
          let results: any[] = [];
          
          if (mode === 'direct') {
             // Extract type from filters (passed from ControlPanel)
             const searchType = filters?.type || 'IR'; 
             results = await searchNISTDirect(query, searchType); // Returns GeminiResponse[]
          } else {
             const oneResult = await fetchSpectralData(query);
             results = [oneResult];
          }
          
          const struct = await fetchMolecularStructure(query);
          const newDatasets: SpectralDataset[] = [];

          results.forEach((result, idx) => {
               newDatasets.push({
                id: uuidv4(),
                name: result.name,
                type: result.type as any,
                data: result.dataPoints.map((dp: any) => ({ wavelength: dp[0], intensity: dp[1] })),
                units: { x: result.unitsX, y: result.unitsY },
                description: result.description,
                composition: result.composition,
                references: result.references,
                color: CHART_COLORS[(datasets.length + idx) % CHART_COLORS.length],
                isVisible: true,
                structure: struct,
                phase: result.phase,
                instrumentation: result.instrumentation
              });
          });

          setDatasets(prev => [...prev, ...newDatasets]);
          
          if (newDatasets.length > 0) {
              setActiveDatasetId(newDatasets[0].id);
              
              // Smart View Switching
              const first = newDatasets[0];
              const sampleWavelength = first.data[0]?.wavelength || 0;
              
              if (sampleWavelength > 2.0) {
                  setViewMode('wavenumber');
              } else if (sampleWavelength < 0.8) {
                  setViewMode('nanometers');
              } else {
                  setViewMode('microns');
              }
          }
          
          setAnalysisResult(null); 
      }

    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [datasets.length]);

  const handleToggleVisibility = (id: string) => {
    setDatasets(prev => prev.map(ds => 
      ds.id === id ? { ...ds, isVisible: !ds.isVisible } : ds
    ));
  };

  const handleRemove = (id: string) => {
    setDatasets(prev => prev.filter(ds => ds.id !== id));
    if (activeDatasetId === id) setActiveDatasetId(null);
  };

  const handleToggleNormalize = () => setIsNormalized(prev => !prev);
  const handleToggleViewMode = (mode: ViewMode) => setViewMode(mode);
  const handleToggleYAxisMode = () => setYAxisMode(prev => prev === 'absorbance' ? 'transmittance' : 'absorbance');

  const handleAnalyze = async () => {
    setIsLoading(true);
    const visible = datasets.filter(d => d.isVisible && d.type !== 'Line');
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

  useEffect(() => {
    if (hoverWavelength && analysisResult?.features) {
       const closest = analysisResult.features.find(f => Math.abs(f.wavelength - hoverWavelength) < 0.05); 
       if (closest && closest !== activeFeature) {
           setActiveFeature(closest);
       } else if (!closest) {
           setActiveFeature(null);
       }
    } else {
        setActiveFeature(null);
    }
  }, [hoverWavelength, analysisResult]);

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

  const handleExportCSV = () => {
    const visible = datasets.filter(d => d.isVisible);
    if (visible.length === 0) return;

    const headers = ['Wavelength (um)'];
    visible.forEach(ds => headers.push(`${ds.name} [${ds.phase || 'N/A'}]`));
    
    const allWavelengths = new Set<number>();
    visible.forEach(ds => ds.data.forEach(p => allWavelengths.add(p.wavelength)));
    const sortedWavelengths = Array.from(allWavelengths).sort((a, b) => a - b);

    const rows = sortedWavelengths.map(w => {
        const row = [w.toFixed(5)];
        visible.forEach(ds => {
            const point = ds.data.find(p => Math.abs(p.wavelength - w) < 0.001);
            row.push(point ? point.intensity.toString() : '');
        });
        return row.join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `spectrascope_export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-space-950 text-white overflow-hidden font-sans selection:bg-accent-cyan selection:text-black">
      <ControlPanel 
        onSearch={handleSearch}
        isLoading={isLoading}
        datasets={datasets}
        activeDatasetId={activeDatasetId}
        onActivateDataset={setActiveDatasetId}
        onToggleVisibility={handleToggleVisibility}
        onRemove={handleRemove}
        onAnalyze={handleAnalyze}
        isNormalized={isNormalized}
        onToggleNormalize={handleToggleNormalize}
        onExport={handleExportCSV}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        yAxisMode={yAxisMode}
        onToggleYAxisMode={handleToggleYAxisMode}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/10 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg backdrop-blur-md max-w-lg">
            <span>⚠️</span>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:text-white font-bold">✕</button>
          </div>
        )}

        <div className="flex-none h-[55%] p-4 min-h-[300px]">
          <SpectralChart 
            datasets={datasets} 
            analysisResults={analysisResult} 
            annotations={annotations}
            isNormalized={isNormalized}
            onPlotClick={handlePlotClick}
            viewMode={viewMode}
            yAxisMode={yAxisMode}
            onHover={setHoverWavelength}
          />
        </div>

        <div className="flex-1 flex overflow-hidden border-t border-space-800">
           <div className="w-[40%] bg-space-900 border-r border-space-800 relative">
               <MoleculeViewer structure={activeStructure} activeFeature={activeFeature} />
           </div>

           <div className="flex-1 bg-space-950 overflow-hidden">
             <InfoPanel 
                analysis={analysisResult} 
                datasets={datasets} 
                annotations={annotations}
                onDeleteAnnotation={handleDeleteAnnotation}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;