import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Label
} from 'recharts';
import { SpectralDataset, AnalysisResult, Annotation, ViewMode } from '../types';

interface SpectralChartProps {
  datasets: SpectralDataset[];
  analysisResults?: AnalysisResult | null;
  annotations: Annotation[];
  isNormalized: boolean;
  onPlotClick: (wavelength: number) => void;
  viewMode: ViewMode;
}

const CustomTooltip = ({ active, payload, label, isNormalized, viewMode }: any) => {
  if (active && payload && payload.length) {
    const xVal = Number(label);
    
    // Calculate values based on view mode
    let wavelength, wavenumber;
    if (viewMode === 'wavenumber') {
        wavenumber = xVal;
        wavelength = 10000 / xVal;
    } else {
        wavelength = xVal;
        wavenumber = 10000 / xVal;
    }

    return (
      <div className="bg-space-800 border border-space-700 p-3 rounded shadow-xl bg-opacity-95 backdrop-blur-sm z-50">
        <div className="flex justify-between items-baseline gap-4 mb-2 border-b border-space-700 pb-2">
           <div>
             <span className="text-[10px] text-gray-500 uppercase block">Wavelength</span>
             <span className="text-gray-200 font-mono text-sm">{wavelength.toFixed(4)} µm</span>
           </div>
           <div className="text-right">
             <span className="text-[10px] text-gray-500 uppercase block">Wavenumber</span>
             <span className="text-accent-cyan font-mono text-sm">{wavenumber.toFixed(1)} cm⁻¹</span>
           </div>
        </div>
        
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="text-gray-200 font-medium truncate max-w-[120px]" title={entry.name}>{entry.name}:</span>
            <span className="font-mono text-white ml-auto">
              {Number(entry.value).toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SpectralChart: React.FC<SpectralChartProps> = ({ 
  datasets, 
  analysisResults, 
  annotations, 
  isNormalized,
  onPlotClick,
  viewMode
}) => {
  const visibleDatasets = datasets.filter(d => d.isVisible);
  
  if (visibleDatasets.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-space-700 select-none bg-space-900/50 rounded-lg border border-space-800 border-dashed">
        <div className="text-center">
          <p className="text-xl font-light text-gray-500">No Data Loaded</p>
          <p className="text-sm text-gray-600">Search for data using the control panel.</p>
        </div>
      </div>
    );
  }

  // Helper to get max intensity for normalization
  const maxValues: Record<string, number> = {};
  if (isNormalized) {
    visibleDatasets.forEach(d => {
      maxValues[d.id] = Math.max(...d.data.map(p => p.intensity)) || 1;
    });
  }

  // 1. Gather all unique X points (either Wavelength or Wavenumber)
  const allX = new Set<number>();
  visibleDatasets.forEach(d => {
    d.data.forEach(p => {
        if (viewMode === 'wavenumber') {
            // Convert micron to cm-1
            if (p.wavelength > 0) allX.add(10000 / p.wavelength);
        } else {
            allX.add(p.wavelength);
        }
    });
  });

  // 2. Sort Logic
  // Wavenumber view usually goes High -> Low (reversed), but Recharts handles domain reversal via `domain`.
  // We sort ascending here for the data structure, then flip domain in Axis prop.
  const sortedX = Array.from(allX).sort((a, b) => a - b);

  // 3. Construct Chart Data
  const chartData = sortedX.map(xVal => {
    const point: any = { x: xVal };
    
    // Calculate the 'other' unit for the secondary axis tick formatter
    // if xVal is Wavelength(um), other is Wavenumber(cm-1)
    // if xVal is Wavenumber(cm-1), other is Wavelength(um)
    const otherVal = xVal > 0 ? 10000 / xVal : 0;
    point.otherX = otherVal;

    visibleDatasets.forEach(d => {
      // We need to find the data point matching 'xVal'.
      // Convert xVal back to Wavelength to search in the dataset (which stores microns)
      const targetWavelength = viewMode === 'wavenumber' ? (10000 / xVal) : xVal;
      
      // Look for match within tolerance
      const tolerance = viewMode === 'wavenumber' ? 1.0 : 0.001; // cm-1 is larger scale
      const match = d.data.find(p => Math.abs(p.wavelength - targetWavelength) < tolerance);
      
      if (match) {
        point[d.id] = isNormalized ? match.intensity / maxValues[d.id] : match.intensity;
      }
    });
    return point;
  });

  const handleChartClick = (e: any) => {
    if (e && e.activeLabel) {
       // activeLabel is in the current viewMode units.
       const val = Number(e.activeLabel);
       // Annotations are stored in Microns. Convert if needed.
       const wavelength = viewMode === 'wavenumber' ? 10000 / val : val;
       onPlotClick(wavelength);
    }
  };

  return (
    <div className="w-full h-full p-4 bg-space-900 rounded-lg border border-space-800 relative shadow-inner">
      <div className="absolute top-4 left-14 z-10 pointer-events-none bg-space-900/80 px-2 py-1 rounded backdrop-blur-sm border border-space-800">
         <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
          {viewMode === 'wavenumber' ? 'IR MODE' : 'STANDARD MODE'}
          <span className="text-space-700">|</span>
          <span className={isNormalized ? 'text-accent-cyan' : 'text-gray-500'}>
             {isNormalized ? 'NORM (0-1)' : 'ABS FLUX'}
          </span>
        </h3>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={chartData} 
          margin={{ top: 30, right: 30, left: 20, bottom: 30 }}
          onClick={handleChartClick}
        >
          <CartesianGrid stroke="#2a2d4a" strokeDasharray="3 3" opacity={0.3} />
          
          {/* PRIMARY X-AXIS (BOTTOM) */}
          <XAxis 
            xAxisId="primary"
            dataKey="x" 
            type="number" 
            // If IR Mode (Wavenumber), standard is High -> Low. 
            // If Standard (Wavelength), Low -> High.
            domain={viewMode === 'wavenumber' ? ['dataMax', 'dataMin'] : ['dataMin', 'dataMax']} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            tickFormatter={(val) => val.toFixed(viewMode === 'wavenumber' ? 0 : 2)}
            height={40}
            interval="preserveStartEnd"
          >
             <Label 
               value={viewMode === 'wavenumber' ? "Wavenumber (cm⁻¹)" : "Wavelength (µm)"} 
               offset={0} 
               position="insideBottom" 
               fill="#94a3b8" 
               fontSize={12} 
             />
          </XAxis>

          {/* SECONDARY X-AXIS (TOP) */}
          <XAxis 
            xAxisId="secondary"
            orientation="top"
            dataKey="x" // We use the same 'x' data key but formatted differently
            type="number"
            domain={viewMode === 'wavenumber' ? ['dataMax', 'dataMin'] : ['dataMin', 'dataMax']} 
            tick={{ fill: '#00f0ff', fontSize: 10, fontFamily: 'JetBrains Mono', opacity: 0.6 }}
            tickFormatter={(val) => {
                const other = val > 0 ? 10000 / val : 0;
                return other.toFixed(viewMode === 'wavenumber' ? 2 : 0);
            }}
            height={40}
            stroke="#00f0ff33"
            interval="preserveStartEnd"
          >
            <Label 
               value={viewMode === 'wavenumber' ? "Wavelength (µm)" : "Wavenumber (cm⁻¹)"} 
               offset={0} 
               position="insideTop" 
               fill="#00f0ff" 
               fontSize={11} 
               opacity={0.6} 
            />
          </XAxis>

          <YAxis 
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            domain={isNormalized ? [0, 1.05] : ['auto', 'auto']}
          >
            <Label value="Intensity / Absorbance" angle={-90} position="insideLeft" fill="#94a3b8" fontSize={12} style={{textAnchor: 'middle'}} />
          </YAxis>

          <Tooltip 
            content={<CustomTooltip isNormalized={isNormalized} viewMode={viewMode} />} 
            cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeOpacity: 0.2 }}
            isAnimationActive={false} 
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="plainline" />
          
          {visibleDatasets.map((dataset) => (
            <Line
              key={dataset.id}
              xAxisId="primary"
              type="linear" 
              dataKey={dataset.id}
              name={dataset.name}
              stroke={dataset.color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
              connectNulls={true}
              isAnimationActive={false}
            />
          ))}

          {/* Feature Lines need to map to the correct X value */}
          {analysisResults?.features.map((feature, idx) => {
            const xVal = viewMode === 'wavenumber' ? (10000 / feature.wavelength) : feature.wavelength;
            return (
                <ReferenceLine
                xAxisId="primary"
                key={`ai-${idx}`}
                x={xVal}
                stroke="#00ff9d"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{
                    position: 'top',
                    value: feature.species,
                    fill: '#00ff9d',
                    fontSize: 10,
                    opacity: 0.8
                }}
                />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpectralChart;