
import React from 'react';
import { X, Copy, Calendar, Layers, Image, Zap, Box, Maximize2 } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryModalProps {
  item: HistoryItem | null;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const copyPrompt = () => {
    navigator.clipboard.writeText(item.params.prompt);
  };

  const selectedVariants = item.params.variants?.filter(v => v.selected.length > 0 || v.customPrompt) || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
        
        {/* Image Side */}
        <div className="w-full md:w-1/2 bg-zinc-950 flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-zinc-800 relative group">
           <img src={item.imageUrl} alt="Generated" className="max-w-full max-h-[40vh] md:max-h-full object-contain rounded-lg shadow-lg" />
           <a href={item.imageUrl} download target="_blank" rel="noreferrer" className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
               <Maximize2 size={16} />
           </a>
        </div>

        {/* Details Side */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-zinc-900">
           <div className="flex items-center justify-between p-4 border-b border-zinc-800">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <Calendar size={16} className="text-zinc-500" /> 
                   {new Date(item.timestamp).toLocaleString()}
               </h3>
               <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded">
                   <X size={20} />
               </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Prompt</span>
                        <button onClick={copyPrompt} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Copy size={12} /> Copy
                        </button>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-sm text-zinc-300 leading-relaxed">
                        {item.params.prompt}
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-zinc-800/30 p-2 rounded border border-zinc-800/50">
                        <span className="block text-[10px] text-zinc-500 uppercase">Model</span>
                        <span className="text-xs text-white truncate block" title={item.params.model}>{item.params.model}</span>
                     </div>
                     <div className="bg-zinc-800/30 p-2 rounded border border-zinc-800/50">
                        <span className="block text-[10px] text-zinc-500 uppercase">Seed</span>
                        <span className="text-xs text-white font-mono">{item.params.seed}</span>
                     </div>
                     <div className="bg-zinc-800/30 p-2 rounded border border-zinc-800/50">
                        <span className="block text-[10px] text-zinc-500 uppercase">Size</span>
                        <span className="text-xs text-white">{item.params.width} x {item.params.height}</span>
                     </div>
                      <div className="bg-zinc-800/30 p-2 rounded border border-zinc-800/50">
                        <span className="block text-[10px] text-zinc-500 uppercase">Steps / CFG</span>
                        <span className="text-xs text-white">{item.params.steps} / {item.params.cfg}</span>
                     </div>
                </div>

                {/* LoRAs */}
                {item.params.loras && item.params.loras.some(l => l.enabled) && (
                    <div className="space-y-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Zap size={12} className="text-yellow-500" /> Active LoRAs
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                            {item.params.loras.filter(l => l.enabled).map((l, i) => (
                                <div key={i} className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800">
                                    <span className="text-xs text-zinc-300 truncate">{l.name}</span>
                                    <span className="text-xs font-mono text-zinc-500">{l.strength}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Variants */}
                {selectedVariants.length > 0 && (
                    <div className="space-y-2">
                         <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Layers size={12} className="text-purple-500" /> Applied Variants
                        </span>
                        <div className="space-y-2">
                            {selectedVariants.map((v, i) => (
                                <div key={i} className="bg-zinc-950 p-2 rounded border border-zinc-800 flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold text-zinc-400">{v.title}</span>
                                        {v.icon && <span className="text-[10px] text-zinc-600">{v.icon}</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {v.selected.map(optName => {
                                            // Find full option object if available to show emoji
                                            const fullOption = v.options.find(o => (typeof o === 'string' ? o : o.name) === optName);
                                            const emoji = (typeof fullOption === 'object' && fullOption?.emoji) ? fullOption.emoji : null;
                                            
                                            return (
                                                <span key={optName} className="px-1.5 py-0.5 bg-purple-900/30 text-purple-300 text-[10px] rounded border border-purple-500/20 flex items-center gap-1">
                                                    {emoji && <span className="opacity-80">{emoji}</span>}
                                                    {optName}
                                                </span>
                                            );
                                        })}
                                        {v.customPrompt && <span className="text-[10px] text-zinc-400 italic">"{v.customPrompt}"</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

           </div>
        </div>

      </div>
    </div>
  );
};

export default HistoryModal;