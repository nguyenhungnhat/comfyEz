

import React, { useState } from 'react';
import { Zap, Plus, Trash2, LayoutGrid, Star, Image as ImageIcon, Key, X, SlidersHorizontal, Check } from 'lucide-react';
import { Lora, GenerationParams } from '../../types';
import LoraExplorer from './LoraExplorer';

interface LoraSectionProps {
    loras: Lora[]; // Active params LoRAs
    availableLoras: string[]; // Raw names (legacy prop, used less now)
    library: Lora[]; // Rich metadata library
    selectedLoraToAdd: string;
    setSelectedLoraToAdd: (value: string) => void;
    addLora: (name: string) => void;
    removeLora: (id: string) => void;
    updateLora: (id: string, updates: Partial<Lora>) => void;
    
    // New Props for Explorer
    onUpdateMetadata: (name: string, updates: Partial<Lora>) => void;
    onAddTriggerToPrompt: (trigger: string) => void;
    prompt?: string;
}

// Helper to access prompt from context/props if needed, but currently passed via handler
const LoraSection: React.FC<LoraSectionProps> = ({
    loras,
    availableLoras,
    library,
    selectedLoraToAdd,
    setSelectedLoraToAdd,
    addLora,
    removeLora,
    updateLora,
    onUpdateMetadata,
    onAddTriggerToPrompt,
    prompt = ""
}) => {
  const [showExplorer, setShowExplorer] = useState(false);

  // Filter Library for Recents/Favorites
  const favoriteLoras = library.filter(l => l.isFavorite);
  const recentLoras = library.filter(l => l.lastUsed > 0 && !l.isFavorite).sort((a,b) => b.lastUsed! - a.lastUsed!).slice(0, 5);
  const quickAccess = [...favoriteLoras, ...recentLoras].slice(0, 8);

  const toggleActive = (name: string) => {
      const existing = loras.find(l => l.name === name);
      if (existing) {
          removeLora(existing.id);
      } else {
          addLora(name);
      }
  };

  const getMetadata = (name: string) => library.find(l => l.name === name);
  
  return (
    <div className="space-y-3 relative group">
        <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Zap size={12} className="text-yellow-400"/> LoRA Stack
            </label>
            <button 
                onClick={() => setShowExplorer(!showExplorer)}
                className={`text-[10px] flex items-center gap-1 transition-colors px-2 py-1 rounded-full ${showExplorer ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
            >
                <LayoutGrid size={12} /> {showExplorer ? 'Close' : 'Browse'}
            </button>
        </div>

        {/* Quick Access Strip */}
        {quickAccess.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {quickAccess.map(l => {
                    const isActive = loras.some(active => active.name === l.name);
                    return (
                        <div 
                            key={l.name}
                            onClick={() => toggleActive(l.name)}
                            className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden relative cursor-pointer group/item transition-all ${
                                isActive 
                                ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' 
                                : 'opacity-70 hover:opacity-100 ring-1 ring-zinc-700'
                            }`}
                            title={l.name}
                        >
                            {l.previewImage ? (
                                <img src={l.previewImage} className="w-full h-full object-cover" alt="preview" />
                            ) : (
                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                    <span className="text-[9px] text-zinc-400 font-mono text-center leading-none px-1 break-all line-clamp-2">{l.name.slice(0,6)}..</span>
                                </div>
                            )}
                            {l.isFavorite && (
                                <div className="absolute top-0 right-0 p-0.5 bg-black/40 backdrop-blur-[1px] rounded-bl">
                                    <Star size={8} className="text-yellow-400 fill-yellow-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
                 <button 
                    onClick={() => setShowExplorer(true)}
                    className="shrink-0 w-14 h-14 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors"
                 >
                     <Plus size={16} />
                 </button>
            </div>
        )}
        
        {/* Active List */}
        <div className="space-y-2">
            {loras.length === 0 && (
                <div 
                    onClick={() => setShowExplorer(true)}
                    className="border border-dashed border-zinc-800 rounded-lg p-4 text-center cursor-pointer hover:bg-zinc-800/30 transition-colors"
                >
                    <p className="text-xs text-zinc-500">No LoRAs active</p>
                    <p className="text-[10px] text-zinc-600">Click to browse library</p>
                </div>
            )}

            {loras.map(lora => {
                const meta = getMetadata(lora.name);
                const isTriggerActive = meta?.triggerKey && prompt.includes(meta.triggerKey);

                return (
                    <div key={lora.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 transition-all hover:border-zinc-700 shadow-sm overflow-hidden flex gap-3 h-20">
                        {/* Thumbnail Image */}
                        <div className="w-16 h-full shrink-0 bg-zinc-950 rounded border border-zinc-800 overflow-hidden relative group/img">
                            {meta?.previewImage ? (
                                <img src={meta.previewImage} className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                    <ImageIcon size={16} />
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                         <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input 
                                                type="checkbox" 
                                                checked={lora.enabled}
                                                onChange={(e) => updateLora(lora.id, { enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-6 h-3.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                        <span 
                                            className={`text-xs font-medium truncate ${lora.enabled ? 'text-zinc-200' : 'text-zinc-500 line-through'}`} 
                                            title={lora.name}
                                        >
                                            {lora.name.replace(/\.(safetensors|pt)$/, '')}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeLora(lora.id)} 
                                    className="p-1 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>

                            {lora.enabled && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <SlidersHorizontal size={10} className="text-zinc-600 shrink-0" />
                                        <input 
                                            type="range" 
                                            min="0.1" 
                                            max="2.0" 
                                            step="0.05" 
                                            value={lora.strength}
                                            onChange={(e) => updateLora(lora.id, { strength: parseFloat(e.target.value) })}
                                            className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                                        />
                                        <span className="text-[10px] font-mono text-zinc-400 w-6 text-right">{lora.strength.toFixed(1)}</span>
                                    </div>
                                    
                                    {meta?.triggerKey && (
                                        <div 
                                            onClick={() => onAddTriggerToPrompt(meta.triggerKey!)}
                                            className={`flex items-center gap-1.5 cursor-pointer text-[10px] transition-colors ${
                                                isTriggerActive 
                                                ? 'text-blue-400' 
                                                : 'text-zinc-600 hover:text-zinc-400'
                                            }`}
                                            title={meta.triggerKey}
                                        >
                                            <div className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${isTriggerActive ? 'bg-blue-500 border-blue-500' : 'border-zinc-700 bg-zinc-800'}`}>
                                                 {isTriggerActive && <Check size={8} className="text-white" />}
                                            </div>
                                            <span className="font-medium">Use Trigger</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <LoraExplorer 
            isOpen={showExplorer}
            onClose={() => setShowExplorer(false)}
            library={library}
            activeLoras={loras}
            onToggleActive={toggleActive}
            onUpdateMetadata={onUpdateMetadata}
            onAddTrigger={onAddTriggerToPrompt}
        />
    </div>
  );
};

export default LoraSection;