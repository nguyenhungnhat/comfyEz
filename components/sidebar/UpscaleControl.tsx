import React from 'react';
import { Box } from 'lucide-react';
import { UPSCALE_METHODS } from '../../constants';
import { GenerationParams } from '../../types';

interface UpscaleControlProps {
    supported: boolean;
    upscaler: boolean;
    upscaleMethod?: string;
    upscaleFactor?: number;
    handleChange: (key: keyof GenerationParams, value: any) => void;
}

const UpscaleControl: React.FC<UpscaleControlProps> = ({ 
    supported, upscaler, upscaleMethod, upscaleFactor, handleChange 
}) => {
  if (!supported) return null;

  return (
    <div className="space-y-2 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
        <div 
            onClick={() => handleChange('upscaler', !upscaler)}
            className={`cursor-pointer flex items-center justify-between transition-all`}
        >
            <div className="flex items-center gap-2">
                <Box size={18} className={upscaler ? 'text-blue-400' : 'text-zinc-500'} />
                <span className={`text-sm font-medium ${upscaler ? 'text-blue-200' : 'text-zinc-400'}`}>
                    Upscaler
                </span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${upscaler ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${upscaler ? 'left-4.5' : 'left-0.5'}`} style={{ left: upscaler ? '18px' : '2px'}} />
            </div>
        </div>

        {upscaler && (
            <div className="pt-2 animate-in slide-in-from-top-1 space-y-3">
                 {/* Method */}
                <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold mb-1 block">Method</label>
                    <select
                        value={upscaleMethod || 'lanczos'}
                        onChange={(e) => handleChange('upscaleMethod', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                    >
                        {UPSCALE_METHODS.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                
                {/* Factor */}
                <div>
                     <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-semibold mb-1">
                        <span>Scale Factor</span>
                        <span>{upscaleFactor || 2}x</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.5"
                        value={upscaleFactor || 2}
                        onChange={(e) => handleChange('upscaleFactor', parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
        )}
    </div>
  );
};

export default UpscaleControl;