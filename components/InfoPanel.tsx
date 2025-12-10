import React from 'react';
import { AnalysisResult, SpectralDataset, Annotation } from '../types';
import { BookOpen, Sparkles, StickyNote, Tag, ArrowRight } from 'lucide-react';

interface InfoPanelProps {
  analysis: AnalysisResult;
  datasets: SpectralDataset[];
  annotations: Annotation[];
  onDeleteAnnotation: (id: string) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ analysis, datasets, annotations, onDeleteAnnotation }) => {
  const visibleDatasets = datasets.filter(d => d.isVisible);

  return (
    <div className="bg-space-950 border-t border-space-800 h-72 shrink-0 flex flex-col md:flex-row overflow-hidden">
      
      {/* 1. Lab Notebook / Annotations */}
      <div className="w-full md:w-1/3 p-4 border-b md:border-b-0 md:border-r border-space-800 bg-space-900/30 overflow-y-auto">
        <h3 className="text-xs font-bold text-accent-green uppercase tracking-wider mb-3 flex items-center gap-2 sticky top-0 bg-space-950/0 backdrop-blur-sm py-1">
          <StickyNote size={14} />
          Lab Notebook & Annotations
        </h3>
        
        {annotations.length === 0 ? (
           <div className="text-gray-600 text-xs italic mt-4 px-2">
             Click anywhere on the chart to add a scientific note at a specific wavelength.
           </div>
        ) : (
          <div className="space-y-2">
            {annotations.map(note => (
              <div key={note.id} className="bg-space-950 border border-space-800 p-2 rounded group hover:border-space-600 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-accent-cyan font-mono text-[10px] bg-space-900 px-1 rounded">
                    {note.wavelength.toFixed(3)} µm
                  </span>
                  <button 
                    onClick={() => onDeleteAnnotation(note.id)}
                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-300 text-xs leading-snug">{note.text}</p>
                <span className="text-[9px] text-gray-600 block mt-1">
                  {new Date(note.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Analysis / Line Data */}
      <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-space-800 overflow-y-auto">
        <h3 className="text-xs font-bold text-accent-purple uppercase tracking-wider mb-3 flex items-center gap-2 sticky top-0 bg-space-950/0 backdrop-blur-sm py-1">
          <Sparkles size={14} />
          Analysis & Line Data
        </h3>
        {analysis ? (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed font-light">{analysis.summary}</p>
            {analysis.features.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-500 mb-2 uppercase">Identified Features</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {analysis.features.map((f, i) => (
                    <div key={i} className="bg-space-900/50 p-2 rounded border border-space-800/50 flex items-start gap-3 hover:border-accent-purple/50 transition-colors cursor-default">
                      <div className="mt-0.5">
                         <Tag size={12} className={f.type === 'atomic_line' ? "text-accent-purple" : "text-gray-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-white text-xs font-bold truncate">{f.species}</span>
                          <span className="text-accent-green font-mono text-[10px] whitespace-nowrap">{f.wavelength.toFixed(4)} µm</span>
                        </div>
                        {f.transition ? (
                           <div className="text-gray-400 text-[10px] mt-1 flex items-center gap-1 font-mono">
                             <span className="truncate" title={f.transition.split('->')[0]}>{f.transition.split('->')[0]}</span>
                             <ArrowRight size={8} />
                             <span className="truncate" title={f.transition.split('->')[1]}>{f.transition.split('->')[1]}</span>
                           </div>
                        ) : (
                           <span className="text-gray-400 text-[10px] block leading-tight mt-0.5">{f.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-600 text-xs italic mt-4">
            Select "Analyze" or perform a "Lines" search to view detailed spectral data.
          </div>
        )}
      </div>

      {/* 3. Provenance / Metadata */}
      <div className="w-full md:w-64 p-4 bg-space-950 overflow-y-auto">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2 sticky top-0 bg-space-950 py-1">
          <BookOpen size={14} />
          Sources
        </h3>
        <div className="space-y-3">
            {visibleDatasets.map(ds => (
                <div key={ds.id} className="text-[10px]">
                    <div className="font-semibold text-gray-300 mb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: ds.color}}></span>
                        {ds.name}
                    </div>
                    {ds.references && ds.references.length > 0 ? (
                       <ul className="space-y-1 pl-3 border-l border-space-800 ml-0.5">
                           {ds.references.slice(0, 2).map((ref, idx) => (
                               <li key={idx} className="text-gray-500 truncate" title={ref}>
                                   {ref}
                               </li>
                           ))}
                       </ul>
                    ) : (
                      <span className="text-gray-700 italic pl-3">Synthetic Data</span>
                    )}
                </div>
            ))}
            {visibleDatasets.length === 0 && <span className="text-gray-700 text-[10px] italic">No active data sources.</span>}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;