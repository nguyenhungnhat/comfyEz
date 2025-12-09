import React from 'react';
import { ASPECT_RATIOS } from '../../constants';
import { GenerationParams } from '../../types';

interface DimensionsControlProps {
    width: number;
    height: number;
    setRatio: (w: number, h: number) => void;
    handleChange: (key: keyof GenerationParams, value: any) => void;
}

const DimensionsControl: React.FC<DimensionsControlProps> = ({ width, height, setRatio, handleChange }) => {
  return (
    <div className="space-y-3">
       <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dimensions</label>
       
       {/* Aspect Ratio Presets */}
       <div className="grid grid-cols-3 gap-2">
         {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.label}
              onClick={() => setRatio(ratio.width, ratio.height)}
              className={`text-xs py-1.5 px-2 rounded border transition-all ${
                width === ratio.width && height === ratio.height
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {ratio.label}
            </button>
         ))}
       </div>

       <div className="grid grid-cols-2 gap-2">
          <div>
              <label className="text-xs text-zinc-500 block mb-1">Width</label>
              <input 
                  type="number" 
                  value={width}
                  onChange={(e) => handleChange('width', parseInt(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-blue-500 outline-none"
              />
          </div>
          <div>
              <label className="text-xs text-zinc-500 block mb-1">Height</label>
              <input 
                  type="number" 
                  value={height}
                  onChange={(e) => handleChange('height', parseInt(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-blue-500 outline-none"
              />
          </div>
       </div>
    </div>
  );
};

export default DimensionsControl;