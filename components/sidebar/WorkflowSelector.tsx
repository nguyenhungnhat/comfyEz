import React from 'react';
import { WorkflowPreset } from '../../types';

interface WorkflowSelectorProps {
    presets: WorkflowPreset[];
    activePresetId: string;
    setActivePresetId: (id: string) => void;
}

const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({ presets, activePresetId, setActivePresetId }) => {
  return (
    <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Workflow</label>
        <select
            value={activePresetId}
            onChange={(e) => setActivePresetId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs truncate focus:outline-none focus:border-blue-500"
        >
            {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
    </div>
  );
};

export default WorkflowSelector;