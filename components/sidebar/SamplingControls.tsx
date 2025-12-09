import React from 'react';
import { RotateCcw } from 'lucide-react';
import { SAMPLERS, SCHEDULERS } from '../../constants';
import { GenerationParams } from '../../types';

interface SamplingControlsProps {
    steps: number;
    cfg: number;
    sampler: string;
    scheduler: string;
    seed: number;
    handleChange: (key: keyof GenerationParams, value: any) => void;
}

const SamplingControls: React.FC<SamplingControlsProps> = ({ 
    steps, cfg, sampler, scheduler, seed, handleChange 
}) => {
  return (
    <>
        {/* CFG & Steps */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-400 uppercase">Steps</span>
              <span className="text-zinc-300">{steps}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={steps}
              onChange={(e) => handleChange('steps', parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-400 uppercase">CFG Scale</span>
              <span className="text-zinc-300">{cfg}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={cfg}
              onChange={(e) => handleChange('cfg', parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Sampler & Scheduler */}
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sampler</label>
                <select
                    value={sampler}
                    onChange={(e) => handleChange('sampler', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                >
                    {SAMPLERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Scheduler</label>
                <select
                    value={scheduler}
                    onChange={(e) => handleChange('scheduler', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                >
                    {SCHEDULERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>
        
        {/* Seed */}
         <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Seed</span>
            <span className="text-[10px] text-zinc-500 normal-case">(-1 for random)</span>
          </label>
          <div className="flex gap-2">
             <input
                type="number"
                value={seed}
                onChange={(e) => handleChange('seed', parseInt(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button 
                onClick={() => handleChange('seed', -1)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                title="Randomize"
            >
                <RotateCcw size={16} />
            </button>
          </div>
        </div>
    </>
  );
};

export default SamplingControls;