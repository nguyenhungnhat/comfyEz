import React from 'react';
import { X, CheckSquare, Sparkles } from 'lucide-react';

interface GenerationSectionProps {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  isSingleMode: boolean;
  setIsSingleMode: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  disabled: boolean;
  presets: string[];
}

const GenerationSection: React.FC<GenerationSectionProps> = ({
  prompt,
  setPrompt,
  isSingleMode,
  setIsSingleMode,
  isLoading,
  error,
  onGenerate,
  disabled,
  presets
}) => {
  return (
    <div className="p-3 border-b border-zinc-800 space-y-3 bg-zinc-900/50">
        
        {/* Presets */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {presets.map(preset => (
                <button
                    key={preset}
                    onClick={() => setPrompt(prev => prev ? `${prev}, ${preset}` : preset)}
                    className="whitespace-nowrap px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                >
                    {preset}
                </button>
            ))}
        </div>

        <div className="relative">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe variants to generate..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 pr-8 text-xs focus:outline-none focus:border-purple-500 resize-none h-16"
            />
            {prompt && (
                <button 
                    onClick={() => setPrompt('')}
                    className="absolute right-2 top-2 text-zinc-500 hover:text-white"
                >
                    <X size={14} />
                </button>
            )}
        </div>

        <div className="flex items-center gap-2">
             <label className="flex items-center gap-2 cursor-pointer select-none">
                 <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSingleMode ? 'bg-purple-600 border-purple-600 text-white' : 'bg-zinc-950 border-zinc-700'}`}>
                    {isSingleMode && <CheckSquare size={10} />}
                 </div>
                 <input 
                     type="checkbox" 
                     checked={isSingleMode}
                     onChange={(e) => setIsSingleMode(e.target.checked)}
                     className="hidden"
                 />
                 <span className="text-[10px] text-zinc-400 font-medium">Single Variant Mode</span>
             </label>
        </div>

        {error && <p className="text-[10px] text-red-400">{error}</p>}
        
        <button
            onClick={onGenerate}
            disabled={disabled}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2"
        >
            {isLoading ? (
                <span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full"></span>
            ) : (
                <span className="flex items-center gap-2"><Sparkles size={14} /> Generate Suggestions</span>
            )}
        </button>
    </div>
  );
};

export default GenerationSection;