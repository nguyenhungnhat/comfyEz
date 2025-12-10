
import React, { useState, useMemo } from 'react';
import { Layers, Settings, ChevronLeft, X, Loader2, Sparkles, AlertCircle, CheckSquare, Square, ToggleLeft, ToggleRight } from 'lucide-react';
import { extractVariantsFromPrompt, DEFAULT_EXTRACT_VARIANTS_PROMPT } from '../../../services/llmService';
import { AppSettings, Variant } from '../../../types';

interface ExtractVariantsToolProps {
  settings: AppSettings;
  currentPrompt: string;
  existingVariants?: Variant[];
  onAddVariants: (variants: Variant[], clearCategory?: string) => void;
}

export const ExtractVariantsTool: React.FC<ExtractVariantsToolProps> = ({ 
    settings, 
    currentPrompt,
    existingVariants = [],
    onAddVariants 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration State
  const [useEmojis, setUseEmojis] = useState(true);
  const [maxVariants, setMaxVariants] = useState(3);
  const [extraOptionsCount, setExtraOptionsCount] = useState(5);
  const [targetCategory, setTargetCategory] = useState("Auto");
  const [shouldClearCategory, setShouldClearCategory] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState(DEFAULT_EXTRACT_VARIANTS_PROMPT);

  // Preview State
  const [previewVariants, setPreviewVariants] = useState<Variant[] | null>(null);
  const [selectedPreviewIds, setSelectedPreviewIds] = useState<Set<string>>(new Set());

  // Existing categories
  const existingCategories = useMemo(() => {
      const cats = new Set<string>();
      existingVariants.forEach(v => {
          if (v.category && v.category !== 'General') cats.add(v.category);
      });
      return Array.from(cats).sort();
  }, [existingVariants]);

  const handleExtract = async () => {
      if (!currentPrompt) {
          setError("Prompt is empty");
          return;
      }
      
      setIsProcessing(true);
      setError(null);
      setPreviewVariants(null);
      
      try {
          const variants = await extractVariantsFromPrompt(
              settings.llm.host,
              settings.llm.apiKey,
              settings.llm.model,
              currentPrompt,
              {
                  useEmojis,
                  maxVariants,
                  extraOptionsCount,
                  forceCategory: targetCategory,
                  systemInstruction
              }
          );
          setPreviewVariants(variants);
          // Select all by default
          setSelectedPreviewIds(new Set(variants.map(v => v.id)));
      } catch (e: any) {
          setError(e.message || "Extraction failed");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleConfirm = () => {
      if (previewVariants) {
          const toAdd = previewVariants.filter(v => selectedPreviewIds.has(v.id));
          
          // Determine if we should clear the category
          const categoryToClear = (targetCategory !== 'Auto' && shouldClearCategory) 
             ? targetCategory 
             : undefined;

          onAddVariants(toAdd, categoryToClear);
          setIsOpen(false);
          setPreviewVariants(null);
      }
  };

  const togglePreviewSelection = (id: string) => {
      const newSet = new Set(selectedPreviewIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedPreviewIds(newSet);
  };

  const resetSettings = () => {
      setUseEmojis(true);
      setMaxCategories("Auto"); // Reset legacy
      setMaxVariants(3);
      setExtraOptionsCount(5);
      setTargetCategory("Auto");
      setSystemInstruction(DEFAULT_EXTRACT_VARIANTS_PROMPT);
  };

  // Helper for max variants legacy string
  const setMaxCategories = (val: string) => {
      if(val === "Auto") setMaxVariants(5);
      else setMaxVariants(parseInt(val));
  };

  return (
    <div className="relative">
       <button
           onClick={() => setIsOpen(!isOpen)}
           disabled={isProcessing}
           className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
           title="Convert current prompt text into structured variants"
       >
           <Layers size={14} className={isProcessing ? 'animate-bounce' : ''} /> 
           <span className="hidden sm:inline">Extract</span>
       </button>
       
       {isOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-96 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-[60] animate-in fade-in slide-in-from-bottom-2 flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50 shrink-0">
                    <div className="flex items-center gap-2">
                        {showSettings && (
                            <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white mr-1">
                                <ChevronLeft size={14} />
                            </button>
                        )}
                        <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                            {showSettings ? <Settings size={12} /> : <Sparkles size={12} className="text-purple-400" />}
                            {showSettings ? "Extraction Settings" : (previewVariants ? "Approve Variants" : "Extract Variants")}
                        </span>
                    </div>
                    <div className="flex gap-2">
                         {!showSettings && !previewVariants && (
                            <button onClick={() => setShowSettings(true)} className="text-zinc-500 hover:text-white" title="Configure">
                                <Settings size={14} />
                            </button>
                         )}
                         <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Main View */}
                {!showSettings ? (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {error && (
                            <div className="p-2 m-3 mb-0 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-300 flex items-center gap-1">
                                <AlertCircle size={12} /> {error}
                            </div>
                        )}

                        {!previewVariants ? (
                            <div className="p-4 flex flex-col gap-3">
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Convert your flat prompt text into structured <b>Variants</b> (Style, Lighting, etc.) and generate extra ideas.
                                </p>
                                
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 bg-zinc-950 p-2 rounded border border-zinc-800">
                                    <div className="flex justify-between">
                                        <span>Max Variants:</span>
                                        <span className="text-zinc-300">{maxVariants}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Extra Ideas:</span>
                                        <span className="text-zinc-300">{extraOptionsCount}</span>
                                    </div>
                                    <div className="flex justify-between col-span-2">
                                        <span>Target Category:</span>
                                        <span className="text-purple-400 font-medium truncate ml-2">{targetCategory}</span>
                                    </div>
                                    {targetCategory !== 'Auto' && (
                                         <div className="flex justify-between col-span-2">
                                            <span>Action:</span>
                                            <span className={shouldClearCategory ? "text-red-400" : "text-green-400"}>
                                                {shouldClearCategory ? "Replace Existing" : "Append to Existing"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleExtract}
                                    disabled={isProcessing || !currentPrompt}
                                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <><Loader2 size={14} className="animate-spin" /> Analyzing Prompt...</>
                                    ) : (
                                        <><Layers size={14} /> Convert to Variants</>
                                    )}
                                </button>
                            </div>
                        ) : (
                            /* Preview List */
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <div className="p-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Found {previewVariants.length} Variants</span>
                                    <button 
                                        onClick={() => setPreviewVariants(null)}
                                        className="text-[10px] text-zinc-400 hover:text-white underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {previewVariants.map(v => (
                                        <div 
                                            key={v.id} 
                                            onClick={() => togglePreviewSelection(v.id)}
                                            className={`p-2 rounded border cursor-pointer transition-all ${
                                                selectedPreviewIds.has(v.id) 
                                                ? 'bg-purple-900/20 border-purple-500/50' 
                                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={`mt-0.5 ${selectedPreviewIds.has(v.id) ? 'text-purple-400' : 'text-zinc-600'}`}>
                                                    {selectedPreviewIds.has(v.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-zinc-300">{v.title}</span>
                                                        <span className="text-[9px] text-zinc-500 px-1.5 py-0.5 bg-zinc-800 rounded">{v.category}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {v.options.map((o: any, idx) => {
                                                            const isOriginal = v.selected.includes(o.name || o);
                                                            return (
                                                                <span key={idx} className={`text-[9px] border rounded px-1.5 py-0.5 ${
                                                                    isOriginal 
                                                                    ? 'bg-purple-900/30 border-purple-500/30 text-purple-200' 
                                                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                                                                }`}>
                                                                    {o.name || o}
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 border-t border-zinc-800 bg-zinc-900">
                                    <button 
                                        onClick={handleConfirm}
                                        disabled={selectedPreviewIds.size === 0}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded text-xs font-medium transition-colors"
                                    >
                                        Add {selectedPreviewIds.size} Variants
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 flex flex-col gap-4 bg-zinc-900 flex-1 overflow-y-auto">
                        {/* Settings View */}
                        
                        {/* 1. Emoji Toggle */}
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-zinc-400 font-medium">Generate Emojis</label>
                            <input 
                                type="checkbox" 
                                checked={useEmojis} 
                                onChange={(e) => setUseEmojis(e.target.checked)}
                                className="accent-purple-500"
                            />
                        </div>

                        {/* 2. Sliders */}
                        <div className="space-y-4 pt-2 border-t border-zinc-800">
                             <div>
                                <div className="flex justify-between text-xs text-zinc-400 font-medium mb-1">
                                    <span>Max Variants</span>
                                    <span className="text-zinc-300">{maxVariants}</span>
                                </div>
                                <input 
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={maxVariants}
                                    onChange={(e) => setMaxVariants(parseInt(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <p className="text-[9px] text-zinc-500 mt-0.5">Limit the number of variant groups extracted.</p>
                             </div>

                             <div>
                                <div className="flex justify-between text-xs text-zinc-400 font-medium mb-1">
                                    <span>Extra Options per Variant</span>
                                    <span className="text-zinc-300">{extraOptionsCount}</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0"
                                    max="30"
                                    value={extraOptionsCount}
                                    onChange={(e) => setExtraOptionsCount(parseInt(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <p className="text-[9px] text-zinc-500 mt-0.5">AI will brainstorm {extraOptionsCount} additional ideas for each variant.</p>
                             </div>
                        </div>

                         {/* 3. Category Target */}
                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                             <label className="text-xs text-zinc-400 font-medium block">Default Category</label>
                             <select
                                value={targetCategory}
                                onChange={(e) => setTargetCategory(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-purple-500 outline-none"
                             >
                                 <option value="Auto">Auto (AI Decision)</option>
                                 {existingCategories.map(cat => (
                                     <option key={cat} value={cat}>{cat}</option>
                                 ))}
                             </select>
                             <p className="text-[9px] text-zinc-500">
                                {targetCategory === 'Auto' ? 'AI will categorize variants automatically.' : 'Force all extracted variants into this category.'}
                             </p>
                        </div>

                        {/* 4. Merge Mode (Conditional) */}
                        {targetCategory !== 'Auto' && (
                             <div className="bg-zinc-800/50 p-2 rounded border border-zinc-700 flex items-center justify-between">
                                 <span className="text-xs text-zinc-300">Action on Category</span>
                                 <button
                                    onClick={() => setShouldClearCategory(!shouldClearCategory)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                        shouldClearCategory 
                                        ? 'bg-red-900/30 text-red-300 border border-red-500/30' 
                                        : 'bg-green-900/30 text-green-300 border border-green-500/30'
                                    }`}
                                 >
                                     {shouldClearCategory ? (
                                         <><ToggleRight size={14} /> Replace</>
                                     ) : (
                                         <><ToggleLeft size={14} /> Append</>
                                     )}
                                 </button>
                             </div>
                        )}

                        {/* System Instruction */}
                        <div className="space-y-1 pt-2 border-t border-zinc-800">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-zinc-400 font-medium">System Instruction</label>
                                <button onClick={resetSettings} className="text-[10px] text-blue-400 hover:underline">Reset</button>
                            </div>
                            <textarea 
                                value={systemInstruction}
                                onChange={(e) => setSystemInstruction(e.target.value)}
                                className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded p-2 text-[10px] font-mono focus:border-purple-500 outline-none resize-none leading-relaxed text-zinc-400"
                            />
                        </div>
                    </div>
                )}
            </div>
       )}
    </div>
  );
};
