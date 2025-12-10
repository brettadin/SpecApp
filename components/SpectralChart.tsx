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
import { SpectralDataset, AnalysisResult, Annotation, ViewMode, YAxisMode, SpectralFeature } from '../types';

interface SpectralChartProps {
  datasets: SpectralDataset[];
  analysisResults?: AnalysisResult | null;
  annotations: Annotation[];
  isNormalized: boolean;
  onPlotClick: (wavelength: number) => void;
  viewMode: ViewMode;
  yAxisMode: YAxisMode;
  onHover?: (wavelength: number | null) => void;
  spectralLines?: SpectralFeature[]; 
}

const CustomTooltip = ({ active, payload, label, isNormalized, viewMode, yAxisMode }: any) => {
  if (active && payload && payload.length) {
    const xVal = label;
    
    let wavelength, wavenumber, nanometers;
    if (viewMode === 'wavenumber') {
        wavenumber = xVal;
        wavelength = xVal > 0 ? 10000 / xVal : 0;
        nanometers = wavelength * 1000;
    } else if (viewMode === 'nanometers') {
        nanometers = xVal;
        wavelength = xVal / 1000;
        wavenumber = wavelength > 0 ? 10000 / wavelength : 0;
    } else {
        wavelength = xVal;
        nanometers = xVal * 1000;
        wavenumber = xVal > 0 ? 10000 / xVal : 0;
    }

    return (
      <div className="bg-space-900 border border-space-700 p-3 rounded shadow-xl bg-opacity-95 z-50">
        <div className="flex justify-between items-baseline gap-4 mb-2 border-b border-space-700 pb-2">
           <div>
             <span className="text-[10px] text-gray-500 uppercase block">Wavelength</span>
             <span className="text-gray-200 font-mono text-sm">{wavelength.toFixed(4)} µm / {nanometers.toFixed(1)} nm</span>
           </div>
           <div className="text-right">
             <span className="text-[10px] text-gray-500 uppercase block">Wavenumber</span>
             <span className="text-accent-cyan font-mono text-sm">{wavenumber.toFixed(1)} cm⁻¹</span>
           </div>
        </div>
        
        {payload.map((entry: any, index: number) => {
          // If it's a dataset line
          if (entry.dataKey) {
            return (
              <div key={index} className="flex items-center gap-2 text-xs mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="text-gray-200 font-medium truncate max-w-[120px]" title={entry.name}>{entry.name}:</span>
                <span className="font-mono text-white ml-auto">
                  {Number(entry.value).toFixed(4)}
                  {yAxisMode === 'transmittance' && !isNormalized ? '%' : ''}
                </span>
              </div>
            );
          }
          return null;
        })}
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
  viewMode,
  yAxisMode,
  onHover,
  spectralLines 
}) => {
  const visibleDatasets = datasets.filter(d => d.isVisible && d.type !== 'Line'); 
  const lineDatasets = datasets.filter(d => d.type === 'Line' && d.isVisible);

  if (visibleDatasets.length === 0 && lineDatasets.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-space-700 select-none bg-space-900/50 rounded-lg border border-space-800 border-dashed">
        <div className="text-center">
          <p className="text-xl font-light text-gray-500">No Data Loaded</p>
          <p className="text-sm text-gray-600">Search for data using the control panel.</p>
        </div>
      </div>
    );
  }

  // Normalize Logic
  const maxValues: Record<string, number> = {};
  if (isNormalized) {
    visibleDatasets.forEach(d => {
      maxValues[d.id] = Math.max(...d.data.map(p => p.intensity)) || 1;
    });
  }

  // Domain Calculation
  const allX = new Set<number>();
  
  const getX = (wavelengthMicrons: number) => {
      if (viewMode === 'wavenumber') {
          return wavelengthMicrons > 0 ? 10000 / wavelengthMicrons : 0;
      }
      if (viewMode === 'nanometers') {
          return wavelengthMicrons * 1000;
      }
      return wavelengthMicrons;
  }

  visibleDatasets.forEach(d => {
    d.data.forEach(p => allX.add(getX(p.wavelength)));
  });

  lineDatasets.forEach(d => {
      d.data.forEach(p => allX.add(getX(p.wavelength)));
  });

  const sortedX = Array.from(allX).sort((a, b) => a - b);
  
  let chartData: any[] = [];
  
  if (visibleDatasets.length > 0 || lineDatasets.length > 0) {
      chartData = sortedX.map(xVal => {
        const point: any = { x: xVal };
        const currentWavelength = viewMode === 'wavenumber' 
            ? (10000 / xVal) 
            : (viewMode === 'nanometers' ? xVal / 1000 : xVal);

        visibleDatasets.forEach(d => {
           // Tolerance adjustments based on units
           let tolerance = 0.005; // microns default
           if (viewMode === 'wavenumber') tolerance = 1.0;
           if (viewMode === 'nanometers') tolerance = 1.0; // 1 nm

           const match = d.data.find(p => {
               if (viewMode === 'wavenumber') return Math.abs((10000/p.wavelength) - xVal) < tolerance;
               if (viewMode === 'nanometers') return Math.abs((p.wavelength * 1000) - xVal) < tolerance;
               return Math.abs(p.wavelength - currentWavelength) < tolerance;
           });
           
           if (match) {
            let val = match.intensity;
            if (yAxisMode === 'transmittance') {
                val = Math.pow(10, -val);
                if (!isNormalized) val = val * 100; 
            }
            if (isNormalized && yAxisMode !== 'transmittance') {
                 val = val / maxValues[d.id];
            }
            point[d.id] = val;
          }
        });
        return point;
      });
  }

  const getAxisLabel = () => {
      switch(viewMode) {
          case 'wavenumber': return "Wavenumber (cm⁻¹)";
          case 'nanometers': return "Wavelength (nm)";
          default: return "Wavelength (µm)";
      }
  }

  return (
    <div className="w-full h-full p-2 bg-space-900 rounded-lg border border-space-800 relative shadow-inner flex flex-col">
      <div className="absolute top-4 right-14 z-10 pointer-events-none text-right">
         <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-space-950/80 px-2 py-1 rounded border border-space-800 inline-block">
          {getAxisLabel()}
        </h3>
      </div>
      
      <div className="flex-1 min-h-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          onClick={(e: any) => {
              if (e && e.activeLabel) {
                  const x = Number(e.activeLabel);
                  let wl = x;
                  if (viewMode === 'wavenumber') wl = 10000 / x;
                  if (viewMode === 'nanometers') wl = x / 1000;
                  onPlotClick(wl);
              }
          }}
          onMouseMove={(e: any) => {
              if (onHover && e && e.activeLabel) {
                  const x = Number(e.activeLabel);
                  let wl = x;
                  if (viewMode === 'wavenumber') wl = 10000 / x;
                  if (viewMode === 'nanometers') wl = x / 1000;
                  onHover(wl);
              }
          }}
          onMouseLeave={() => onHover && onHover(null)}
        >
          <CartesianGrid stroke="#2a2d4a" strokeDasharray="3 3" opacity={0.3} vertical={false} />
          
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={['dataMin', 'dataMax']} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            tickFormatter={(val) => val.toFixed(viewMode === 'microns' ? 2 : 0)}
            height={40}
            minTickGap={30}
            reversed={viewMode === 'wavenumber'}
          >
             <Label 
                value={getAxisLabel()} 
                offset={0} 
                position="insideBottom" 
                fill="#94a3b8" 
                fontSize={12} 
             />
          </XAxis>

          <YAxis 
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            domain={['auto', 'auto']}
            width={40}
          >
            <Label 
                value={yAxisMode === 'transmittance' ? "Transmittance (%)" : "Absorbance"} 
                angle={-90} 
                position="insideLeft" 
                fill="#94a3b8" 
                fontSize={12} 
                style={{textAnchor: 'middle'}} 
            />
          </YAxis>

          <Tooltip 
            content={<CustomTooltip isNormalized={isNormalized} viewMode={viewMode} yAxisMode={yAxisMode} />} 
            cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeOpacity: 0.2 }}
            isAnimationActive={false}
          />
          
          {visibleDatasets.map((dataset) => (
            <Line
              key={dataset.id}
              type="monotone" 
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

          {/* Render Real Atomic Lines with Transitions */}
          {lineDatasets.map(ds => {
             return ds.data.map((pt, idx) => {
                 const xVal = getX(pt.wavelength);
                 
                 // Hide lines outside of typical view ranges to prevent bunching
                 if (viewMode === 'wavenumber' && (xVal > 25000 || xVal < 50)) return null;
                 
                 return (
                    <ReferenceLine
                        key={`${ds.id}-${idx}`}
                        x={xVal}
                        stroke={ds.color} 
                        strokeOpacity={0.7}
                        strokeWidth={1}
                        label={{
                            position: 'insideTop',
                            value: ds.name, 
                            fill: ds.color,
                            fontSize: 9,
                            angle: -90,
                            dx: 10,
                            dy: 40
                        }}
                    />
                 );
             });
          })}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpectralChart;