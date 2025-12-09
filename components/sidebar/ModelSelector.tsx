import React from 'react';
import { GenerationParams } from '../../types';

interface ModelSelectorProps {
    model: string;
    checkpoints: string[];
    handleChange: (key: keyof GenerationParams, value: any) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ model, checkpoints, handleChange }) => {
  return (
    <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Checkpoint</label>
        <select
            value={model}
            onChange={(e) => handleChange('model', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs truncate focus:outline-none focus:border-blue-500"
        >
            {checkpoints.length === 0 && <option value={model}>{model}</option>}
            {checkpoints.map(ckpt => <option key={ckpt} value={ckpt}>{ckpt}</option>)}
        </select>
    </div>
  );
};

export default ModelSelector;