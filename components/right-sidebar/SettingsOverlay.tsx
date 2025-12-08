import React from 'react';
import { Settings, X } from 'lucide-react';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  systemInstruction: string;
  setSystemInstruction: (value: string) => void;
  defaultInstruction: string;
}

const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  isOpen,
  onClose,
  systemInstruction,
  setSystemInstruction,
  defaultInstruction
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-zinc-900 animate-in fade-in slide-in-from-right-10 flex flex-col">
        <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
            <h3 className="font-bold text-zinc-300 flex items-center gap-2">
                <Settings size={14} /> Generator Settings
            </h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
                <X size={16} />
            </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">System Instruction</label>
            <p className="text-[10px] text-zinc-500 mb-2">
                Customize how the LLM generates variants. Ensure you request JSON output.
            </p>
            <textarea 
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded p-3 text-xs font-mono focus:border-purple-500 outline-none resize-none leading-relaxed"
            />
            <button 
                onClick={() => setSystemInstruction(defaultInstruction)}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
            >
                Reset to Default
            </button>
        </div>
    </div>
  );
};

export default SettingsOverlay;