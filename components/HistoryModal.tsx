
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-5xl shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Image Side */}
        <div className="w-full md:w-1/2 bg-zinc-950 flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-zinc-800 relative group h-[40vh] md:h-auto min-h-0 shrink-0">
           <img 
               src={item.imageUrl} 
               alt="Generated" 
               className="w-full h-full object-contain rounded-lg shadow-lg" 
           />
           <a href={item.imageUrl} download target="_blank" rel="noreferrer" className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
               <Maximize2 size={16} />
           </a>
        </div>

        {/* Details Side */}
        <div className="w-full md:w-1/2 flex flex-col bg-zinc-900 min-h-0 h-full overflow-hidden">
           <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0 bg-zinc-900 z-10">
               <div className="flex flex-col">
                   <h3 className="text-lg font-bold text-white">Generation Details</h3>
                   <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <Calendar size={12} /> 
                        {new Date(item.timestamp).toLocaleString()}
                   </div>
               </div>
               <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 hover:bg-zinc-800 rounded-full transition-colors">
                   <X size={20} />
               </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {/* Prompt */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center sticky top-0 bg-zinc-900/95 backdrop-blur z-10 py-1">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Prompt</span>
                        <button onClick={copyPrompt} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-900/20 transition-colors">
                            <Copy size={12} /> Copy
                        </button>
                    </div>
                    {/* Enhanced scrolling for prompt */}
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-sm text-zinc-300 leading-relaxed max-h-[250px] overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words">
                        {item.params.prompt}
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-3">
                     <div className="bg-zinc-800/30 p-2.5 rounded border border-zinc-800/50">
                        <span className="block text-[10px] text-zinc-500 uppercase mb-0.5">Model</span>
                        <span className="text-xs text-white truncate block" title={item.params.model}>{item.params.model}</span>
                     </div>
                     <div className="bg-zinc-800/30 p-2.5 rounded border border-zinc-800/50">
                        <span className="block text-[10px] text-zinc-500 uppercase mb-0.5">Seed</span>
                        <span className="text-xs text-white font-mono select-all">{item.params.seed}</span>
                     </div>
                     <div className="bg-zinc-800/30 p-2.5 rounded border border-zinc-800/50">
                        <span className="block text-[10px] text-zinc-500 uppercase mb-0.5">Dimensions</span>
                        <span className="text-xs text-white">{item.params.width} x {item.params.height}</span>
                     </div>
                      <div className="bg-zinc-800/30 p-2.5 rounded border border-zinc-800/50">
                        <span className="block text-[10px] text-zinc-500 uppercase mb-0.5">Steps / CFG</span>
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
                                    <span className="text-xs text-zinc-300 truncate mr-2" title={l.name}>{l.name}</span>
                                    <span className="text-xs font-mono text-zinc-500 shrink-0">{l.strength.toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Variants */}
                {selectedVariants.length > 0 && (
                    <div className="space-y-2">
                         <div className="flex items-center gap-2 sticky top-0 bg-zinc-900/95 backdrop-blur z-10 py-1">
                             <Layers size={14} className="text-purple-500" />
                             <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Applied Variants</span>
                         </div>
                         {/* Enhanced scrolling for variants */}
                         <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                            {selectedVariants.map((v, i) => (
                                <div key={i} className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex flex-col gap-2">
                                    <div className="flex justify-between items-center border-b border-zinc-800/50 pb-1.5">
                                        <span className="text-xs font-bold text-zinc-400 truncate pr-2">{v.title}</span>
                                        {/* Icon rendering if necessary */}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {v.selected.map(optName => {
                                            const fullOption = v.options.find(o => (typeof o === 'string' ? o : o.name) === optName);
                                            const emoji = (typeof fullOption === 'object' && fullOption?.emoji) ? fullOption.emoji : null;
                                            
                                            return (
                                                <span key={optName} className="px-2 py-1 bg-purple-900/20 text-purple-300 text-[10px] rounded border border-purple-500/20 flex items-center gap-1 max-w-full">
                                                    {emoji && <span className="opacity-80 shrink-0">{emoji}</span>}
                                                    <span className="truncate">{optName}</span>
                                                </span>
                                            );
                                        })}
                                        {v.customPrompt && (
                                            <span className="px-2 py-1 bg-zinc-900 text-zinc-400 text-[10px] rounded border border-zinc-800 italic break-all">
                                                "{v.customPrompt}"
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Spacer */}
                <div className="h-4"></div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default HistoryModal;
