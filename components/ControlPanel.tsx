import React, { useState } from 'react';
import { Search, Eye, EyeOff, Trash2, Atom, Activity, Database, Settings2, Download, Server, BrainCircuit, ArrowLeftRight, TrendingDown, ScanBarcode, Box, Filter, Check, Ruler, FlaskConical, CloudFog } from 'lucide-react';
import { SpectralDataset, ViewMode, YAxisMode } from '../types';

interface ControlPanelProps {
  onSearch: (query: string, mode: 'ai' | 'direct' | 'lines', filters?: any) => void;
  isLoading: boolean;
  datasets: SpectralDataset[];
  activeDatasetId: string | null;
  onActivateDataset: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onRemove: (id: string) => void;
  onAnalyze: () => void;
  isNormalized: boolean;
  onToggleNormalize: () => void;
  onExport: () => void;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  yAxisMode: YAxisMode;
  onToggleYAxisMode: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onSearch,
  isLoading,
  datasets,
  activeDatasetId,
  onActivateDataset,
  onToggleVisibility,
  onRemove,
  onAnalyze,
  isNormalized,
  onToggleNormalize,
  onExport,
  viewMode,
  onToggleViewMode,
  yAxisMode,
  onToggleYAxisMode
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'data' | 'tools'>('data');
  const [searchMode, setSearchMode] = useState<'ai' | 'direct' | 'lines'>('direct');
  const [directType, setDirectType] = useState<'IR' | 'UVVis'>('IR');

  // Line Search Filters
  const [lineFilters, setLineFilters] = useState({
    minWavelength: 0.2,
    maxWavelength: 20,
    unit: 'um', // 'nm' or 'um'
    minIntensity: 50
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, searchMode, searchMode === 'lines' ? lineFilters : { type: directType });
      if (searchMode !== 'lines') setQuery(''); 
    }
  };

  const getPlaceholder = () => {
      switch(searchMode) {
          case 'direct': return "Compound (e.g. Methane)";
          case 'lines': return "Element (e.g. H, Fe II)";
          default: return "Search...";
      }
  }

  const getPhaseIcon = (phase?: string) => {
     if (!phase) return <Activity size={10} />;
     const p = phase.toLowerCase();
     if (p.includes('gas')) return <CloudFog size={10} className="text-gray-400" />;
     if (p.includes('liquid') || p.includes('condensed') || p.includes('solution')) return <FlaskConical size={10} className="text-blue-400" />;
     if (p.includes('solid')) return <Box size={10} className="text-amber-600" />;
     return <Activity size={10} />;
  }

  return (
    <div className="flex flex-col h-full bg-space-900 border-r border-space-800 text-gray-200 w-80 shrink-0 z-20 shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-space-800 bg-space-950">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent-cyan" />
          Spectra<span className="text-accent-cyan">Scope</span>
        </h1>
        <p className="text-[10px] text-gray-500 mt-1 font-mono tracking-wide uppercase">
          Spectral Analysis Workbench
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-space-800">
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
            activeTab === 'data' ? 'bg-space-800 text-white border-b-2 border-accent-cyan' : 'bg-space-900 text-gray-500 hover:text-gray-300'
          }`}
        >
          Datasets
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
            activeTab === 'tools' ? 'bg-space-800 text-white border-b-2 border-accent-cyan' : 'bg-space-900 text-gray-500 hover:text-gray-300'
          }`}
        >
          View & Tools
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* DATA TAB */}
        {activeTab === 'data' && (
          <>
            <div className="p-4 bg-space-900 space-y-3">
              {/* Source Selector */}
              <div className="grid grid-cols-2 gap-1 bg-space-950 p-1 rounded-md border border-space-800">
                <button
                  onClick={() => setSearchMode('direct')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-medium transition-all ${
                    searchMode === 'direct' 
                      ? 'bg-space-800 text-accent-cyan shadow-sm border border-space-700' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title="Direct from NIST Webbook"
                >
                  <Server size={12} />
                  NIST DB
                </button>
                <button
                  onClick={() => setSearchMode('lines')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-medium transition-all ${
                    searchMode === 'lines' 
                      ? 'bg-space-800 text-accent-purple shadow-sm border border-space-700' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title="Atomic Lines from NIST ASD"
                >
                  <ScanBarcode size={12} />
                  Lines
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full bg-space-950 border border-space-700 text-white rounded-md pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all placeholder-gray-600"
                    disabled={isLoading}
                  />
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                  {isLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-3 w-3 border-2 border-accent-cyan border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Direct Search Options */}
                {searchMode === 'direct' && (
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => setDirectType('IR')}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                directType === 'IR' 
                                ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/50' 
                                : 'bg-space-800 text-gray-500 border-space-700 hover:text-gray-300'
                            }`}
                        >
                            IR Spectrum
                        </button>
                        <button 
                            type="button"
                            onClick={() => setDirectType('UVVis')}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                directType === 'UVVis' 
                                ? 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/50' 
                                : 'bg-space-800 text-gray-500 border-space-700 hover:text-gray-300'
                            }`}
                        >
                            UV-Vis Spectrum
                        </button>
                    </div>
                )}

                {/* Line Search Options */}
                {searchMode === 'lines' && (
                  <div className="bg-space-950 border border-space-800 rounded p-2 text-xs space-y-2">
                     <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
                        <span className="text-gray-400 font-semibold flex items-center gap-1"><Filter size={10}/> Search Filters</span>
                        <span className="text-gray-600 text-[10px]">{showFilters ? 'Hide' : 'Show'}</span>
                     </div>
                     
                     {showFilters && (
                       <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-space-800">
                         <div>
                            <label className="text-[9px] text-gray-500 block mb-0.5">Min Wavelength</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={lineFilters.minWavelength}
                              onChange={e => setLineFilters({...lineFilters, minWavelength: parseFloat(e.target.value)})}
                              className="w-full bg-space-900 border border-space-700 rounded px-1.5 py-1 text-white"
                            />
                         </div>
                         <div>
                            <label className="text-[9px] text-gray-500 block mb-0.5">Max Wavelength</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={lineFilters.maxWavelength}
                              onChange={e => setLineFilters({...lineFilters, maxWavelength: parseFloat(e.target.value)})}
                              className="w-full bg-space-900 border border-space-700 rounded px-1.5 py-1 text-white"
                            />
                         </div>
                         <div>
                            <label className="text-[9px] text-gray-500 block mb-0.5">Units</label>
                            <select 
                              value={lineFilters.unit}
                              onChange={e => setLineFilters({...lineFilters, unit: e.target.value})}
                              className="w-full bg-space-900 border border-space-700 rounded px-1.5 py-1 text-white"
                            >
                              <option value="um">Microns (µm)</option>
                              <option value="nm">Nanometers (nm)</option>
                            </select>
                         </div>
                         <div>
                            <label className="text-[9px] text-gray-500 block mb-0.5">Min Intensity</label>
                            <input 
                              type="number" 
                              value={lineFilters.minIntensity}
                              onChange={e => setLineFilters({...lineFilters, minIntensity: parseFloat(e.target.value)})}
                              className="w-full bg-space-900 border border-space-700 rounded px-1.5 py-1 text-white"
                            />
                         </div>
                         <div className="col-span-2">
                           <button type="submit" className="w-full bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple border border-accent-purple/50 py-1 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1">
                             <Check size={10} /> Apply & Search
                           </button>
                         </div>
                       </div>
                     )}
                  </div>
                )}
              </form>
              
              <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                {searchMode === 'lines' ? (
                   ['H', 'He', 'C', 'Fe', 'O III'].map(s => (
                    <button key={s} onClick={() => {
                      setQuery(s);
                      onSearch(s, 'lines', lineFilters);
                    }} className="whitespace-nowrap px-2 py-1 bg-space-800 hover:bg-space-700 rounded text-[10px] text-accent-purple border border-space-700/50">
                      {s}
                    </button>
                  ))
                ) : (
                  ['Water', 'CO2', 'Methane', 'Ethanol'].map(s => (
                    <button key={s} onClick={() => {
                      setQuery(s);
                      onSearch(s, 'direct', { type: directType });
                    }} className="whitespace-nowrap px-2 py-1 bg-space-800 hover:bg-space-700 rounded text-[10px] text-gray-400 border border-space-700">
                      {s}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {datasets.length === 0 && (
                <div className="text-center py-10 opacity-40 flex flex-col items-center gap-2">
                  <Database size={24} />
                  <p className="text-xs">Library Empty</p>
                </div>
              )}

              {datasets.map((ds) => (
                <div 
                  key={ds.id} 
                  onClick={() => onActivateDataset(ds.id)}
                  className={`relative p-3 rounded border transition-all group cursor-pointer ${
                    activeDatasetId === ds.id 
                      ? 'bg-space-800 border-accent-cyan/50 shadow-[0_0_10px_rgba(0,240,255,0.1)]' 
                      : (ds.isVisible ? 'bg-space-800 border-space-600 hover:border-space-500' : 'bg-space-950 border-space-800 opacity-60')
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {ds.type !== 'Line' && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ds.color }}></div>}
                      {ds.type === 'Line' && <ScanBarcode size={10} className="text-accent-purple" />}
                      <span className={`font-semibold text-xs truncate ${activeDatasetId === ds.id ? 'text-white' : 'text-gray-300'}`} title={ds.name}>
                        {ds.name.split(' (')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {ds.structure && (
                         <Box size={10} className="text-gray-500 mr-2" />
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(ds.id); }}
                        className="p-1 hover:bg-space-700 rounded text-gray-400 hover:text-white"
                      >
                        {ds.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(ds.id); }}
                        className="p-1 hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Phase & Instrumentation Tags */}
                  <div className="flex flex-wrap gap-1 mb-1">
                      {ds.phase && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-space-900 text-gray-400 border border-space-700 flex items-center gap-1 uppercase">
                              {getPhaseIcon(ds.phase)}
                              {ds.phase}
                          </span>
                      )}
                      {ds.type === 'Line' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-space-900 text-gray-400 border border-space-700">ATOMIC</span>}
                  </div>

                  <div className="text-[9px] text-gray-600 font-mono flex justify-between mt-1">
                    <span className="truncate max-w-[150px]">{ds.instrumentation || ds.type}</span>
                    {activeDatasetId === ds.id && <span className="text-accent-cyan">Active</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TOOLS TAB */}
        {activeTab === 'tools' && (
          <div className="p-4 space-y-6 overflow-y-auto">
            
            {/* Display Settings */}
             <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Settings2 size={12} /> View Settings
              </h3>
              
              {/* X Axis Unit Selection */}
               <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-300 flex items-center gap-2">
                    <Ruler size={12} className="text-accent-purple"/>
                    X-Axis Units
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                   {['microns', 'nanometers', 'wavenumber'].map((m) => (
                      <button 
                         key={m}
                         onClick={() => onToggleViewMode(m as ViewMode)}
                         className={`py-1.5 px-1 rounded text-[10px] uppercase font-bold transition-all border ${
                            viewMode === m
                             ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/50 shadow-sm' 
                             : 'bg-space-800 text-gray-500 border-space-700 hover:text-gray-300'
                         }`}
                      >
                         {m === 'microns' ? 'µm' : (m === 'nanometers' ? 'nm' : 'cm⁻¹')}
                      </button>
                   ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 leading-tight">
                  {viewMode === 'wavenumber' 
                    ? 'IR Frequency (Reciprocal Centimeters)' 
                    : (viewMode === 'nanometers' ? 'Visible Light / UV Wavelength' : 'Infrared Wavelength')}
                </p>
              </div>

              {/* Transmittance Toggle */}
              <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-300 flex items-center gap-2">
                    <TrendingDown size={12} className="text-accent-green"/>
                    Transmittance
                  </span>
                  <button 
                    onClick={onToggleYAxisMode}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${yAxisMode === 'transmittance' ? 'bg-accent-green' : 'bg-space-700'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${yAxisMode === 'transmittance' ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                   Switch between Absorbance (Peaks Up) and Transmittance (Valleys Down).
                </p>
              </div>

              <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-300">Normalize</span>
                  <button 
                    onClick={onToggleNormalize}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isNormalized ? 'bg-accent-cyan' : 'bg-space-700'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${isNormalized ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Scales all visible spectra to 0-1 range.
                </p>
              </div>
            </div>

            {/* Export Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Download size={12} /> Export
              </h3>
              
              <button
                onClick={onExport}
                disabled={datasets.length === 0}
                className="w-full bg-space-800 hover:bg-space-700 border border-space-700 text-gray-200 py-2 rounded text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Database size={12} />
                Download CSV
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;