import React, { useState } from 'react';
import { Search, Eye, EyeOff, Trash2, Atom, Activity, Database, Settings2, Download, Server, BrainCircuit, ArrowLeftRight } from 'lucide-react';
import { SpectralDataset, ViewMode } from '../types';

interface ControlPanelProps {
  onSearch: (query: string, mode: 'ai' | 'direct') => void;
  isLoading: boolean;
  datasets: SpectralDataset[];
  onToggleVisibility: (id: string) => void;
  onRemove: (id: string) => void;
  onAnalyze: () => void;
  isNormalized: boolean;
  onToggleNormalize: () => void;
  onExport: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onSearch,
  isLoading,
  datasets,
  onToggleVisibility,
  onRemove,
  onAnalyze,
  isNormalized,
  onToggleNormalize,
  onExport,
  viewMode,
  onToggleViewMode
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'data' | 'tools'>('data');
  const [searchMode, setSearchMode] = useState<'ai' | 'direct'>('ai');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, searchMode);
      setQuery('');
    }
  };

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
              <div className="flex bg-space-950 p-1 rounded-md border border-space-800">
                <button
                  onClick={() => setSearchMode('ai')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                    searchMode === 'ai' 
                      ? 'bg-space-800 text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <BrainCircuit size={12} />
                  AI Retrieval
                </button>
                <button
                  onClick={() => setSearchMode('direct')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                    searchMode === 'direct' 
                      ? 'bg-space-800 text-accent-cyan shadow-sm border border-space-700' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title="Uses CORS Proxy"
                >
                  <Server size={12} />
                  Direct DB
                </button>
              </div>

              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchMode === 'direct' ? "Exact Formula (e.g. C6H6)" : "Object (e.g. Methane)"}
                  className="w-full bg-space-950 border border-space-700 text-white rounded-md pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all placeholder-gray-600"
                  disabled={isLoading}
                />
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                {isLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-3 w-3 border-2 border-accent-cyan border-t-transparent rounded-full"></div>
                  </div>
                )}
              </form>
              
              <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                {['Methane', 'Benzene', 'Water', 'Ethanol'].map(s => (
                  <button key={s} onClick={() => {
                    setQuery(s);
                    onSearch(s, searchMode);
                  }} className="whitespace-nowrap px-2 py-1 bg-space-800 hover:bg-space-700 rounded text-[10px] text-gray-400 border border-space-700">
                    {s}
                  </button>
                ))}
              </div>

              {searchMode === 'direct' && (
                <div className="text-[9px] text-amber-500/80 bg-amber-900/20 p-2 rounded border border-amber-900/30">
                  <strong>Mode:</strong> Fetches JCAMP-DX from NIST. Using CORS Proxy for browser compatibility.
                </div>
              )}
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
                  className={`p-3 rounded border transition-all group ${ds.isVisible ? 'bg-space-800 border-space-600' : 'bg-space-950 border-space-800 opacity-60'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ds.color }}></div>
                      <span className="font-semibold text-xs truncate" title={ds.name}>{ds.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onToggleVisibility(ds.id)}
                        className="p-1 hover:bg-space-700 rounded text-gray-400 hover:text-white"
                      >
                        {ds.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button 
                        onClick={() => onRemove(ds.id)}
                        className="p-1 hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {ds.type} • {ds.data.length} pts
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
              
              {/* IR Mode Toggle */}
               <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-300 flex items-center gap-2">
                    <ArrowLeftRight size={12} className="text-accent-purple"/>
                    IR View (cm⁻¹)
                  </span>
                  <button 
                    onClick={onToggleViewMode}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${viewMode === 'wavenumber' ? 'bg-accent-purple' : 'bg-space-700'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${viewMode === 'wavenumber' ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Standard Infrared Spectroscopy view. Sets X-axis to Wavenumber (reversed) and Y-axis to Absorbance.
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

            {/* AI Action */}
            <div className="pt-4 border-t border-space-800">
              <button
                onClick={onAnalyze}
                disabled={datasets.length === 0 || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-lg text-xs font-bold tracking-wide uppercase shadow-lg shadow-indigo-900/20 transition-all hover:translate-y-[-1px]"
              >
                <Atom size={14} />
                Analyze Spectra
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;