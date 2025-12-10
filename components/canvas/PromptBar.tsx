import React, { useState, useRef, useEffect } from 'react';
import { Zap, Settings2, Trash2, List, ToggleLeft, ToggleRight } from 'lucide-react';
import { GenerationParams, AppSettings, QueueItem, Variant } from '../../types';
import QueuePopover from '../QueuePopover';

// Decoupled Tools
import { EnhanceTool } from './promptbar/EnhanceTool';
import { SuggestionsTool } from './promptbar/SuggestionsTool';
import { ChatTool } from './promptbar/ChatTool';
import { ExtractTool } from './promptbar/ExtractTool';
import { PrettifyTool } from './promptbar/PrettifyTool';
import { ExtractVariantsTool } from './promptbar/ExtractVariantsTool';

interface PromptBarProps {
  isActive: boolean;
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
  onGenerate: () => void;
  settings: AppSettings;
  queue: QueueItem[];
  queueActions: {
    remove: (id: string) => void;
    clear: () => void;
    reorder: (d: number, h: number) => void;
  };
  addToCurrent: boolean;
  setAddToCurrent: (v: boolean) => void;
  onClearCanvas: () => void;
}

const PromptBar: React.FC<PromptBarProps> = ({
  isActive,
  params,
  setParams,
  onGenerate,
  settings,
  queue,
  queueActions,
  addToCurrent,
  setAddToCurrent,
  onClearCanvas
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist textarea height with ResizeObserver and Debounce
  useEffect(() => {
      const savedHeight = localStorage.getItem('comfy_prompt_height');
      if (savedHeight && textareaRef.current) {
          textareaRef.current.style.height = `${savedHeight}px`;
      }

      let timeoutId: any;
      const observer = new ResizeObserver(() => {
          if (textareaRef.current?.style.height) {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                  localStorage.setItem('comfy_prompt_height', textareaRef.current!.style.height.replace('px', ''));
              }, 400);
          }
      });
      
      if (textareaRef.current) {
          observer.observe(textareaRef.current);
      }
      return () => {
          observer.disconnect();
          clearTimeout(timeoutId);
      };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  };

  const updatePrompt = (newPrompt: string) => {
      setParams(prev => ({ ...prev, prompt: newPrompt }));
  };

  const addExtractedVariants = (newVariants: Variant[], clearCategory?: string) => {
      setParams(prev => {
          let updatedVariants = [...prev.variants];
          
          // If we need to clear a category first (replace mode)
          if (clearCategory) {
              updatedVariants = updatedVariants.filter(v => v.category !== clearCategory);
          }

          return {
              ...prev,
              variants: [...updatedVariants, ...newVariants]
          };
      });
  };

  return (
    <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 z-50 transition-all duration-300 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 ring-1 ring-black/20 relative">
          
          {/* AI Tools Bar */}
          <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 mb-1 px-1">
               <EnhanceTool 
                   settings={settings} 
                   currentPrompt={params.prompt} 
                   onUpdatePrompt={updatePrompt} 
               />
               <PrettifyTool 
                   settings={settings} 
                   currentPrompt={params.prompt} 
                   onUpdatePrompt={updatePrompt} 
               />
               <SuggestionsTool 
                   settings={settings} 
                   currentPrompt={params.prompt} 
                   onUpdatePrompt={updatePrompt} 
               />
               <ChatTool 
                   settings={settings} 
                   currentPrompt={params.prompt} 
                   onUpdatePrompt={updatePrompt} 
               />
               
               {/* Spacer to push extract to right */}
               <div className="flex-1" />

               <ExtractTool 
                   settings={settings} 
                   currentPrompt={params.prompt} 
                   onUpdatePrompt={updatePrompt} 
               />
          </div>

          <div className="flex items-start gap-2">
            <textarea
                ref={textareaRef}
                value={params.prompt}
                onChange={(e) => setParams(p => ({ ...p, prompt: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="Describe your imagination..."
                className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0 resize-y py-2 px-3 min-h-[80px] max-h-[60vh] text-sm leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
            />
            <div className="flex flex-col gap-2">
                 <button
                    onClick={onGenerate}
                    className={`p-3.5 rounded-xl transition-all duration-200 shrink-0 ${
                    !params.prompt.trim()
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95'
                    }`}
                    title="Add to Queue"
                >
                    <Zap size={20} fill={params.prompt.trim() ? "currentColor" : "none"} />
                </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-2 px-1 gap-4">
             {/* Left Side: Advanced Mode */}
             <div className="flex items-center gap-4 shrink-0">
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox"
                        checked={params.advancedMode}
                        onChange={(e) => setParams(p => ({ ...p, advancedMode: e.target.checked }))}
                        className="hidden"
                    />
                    <div className={`p-1.5 rounded-lg transition-colors ${params.advancedMode ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                        <Settings2 size={16} />
                    </div>
                    <span className={`text-xs font-medium transition-colors ${params.advancedMode ? 'text-purple-300' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                        Advanced Mode
                    </span>
                 </label>
                 
                 {params.advancedMode && (
                     <>
                        <ExtractVariantsTool 
                            settings={settings}
                            currentPrompt={params.prompt}
                            existingVariants={params.variants}
                            onAddVariants={addExtractedVariants}
                        />
                        <div className="text-xs text-zinc-500 hidden sm:block">
                            Variants: {params.variants.reduce((acc, v) => acc + v.selected.length, 0)}
                        </div>
                     </>
                 )}
             </div>
             
             {/* Right Side: Tools */}
             <div className="flex items-center gap-3 shrink-0">
                
                {/* Batch Size */}
                <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
                    {[1, 2, 3, 4].map(n => (
                        <button
                            key={n}
                            onClick={() => setParams(p => ({ ...p, batchSize: n }))}
                            className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded transition-colors ${
                                params.batchSize === n ? 'bg-zinc-700 text-green-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                            title={`Batch Size: ${n}`}
                        >
                            {n}
                        </button>
                    ))}
                </div>

                <div className="w-px h-4 bg-zinc-800" />

                {/* Append Toggle */}
                <button
                    onClick={() => setAddToCurrent(!addToCurrent)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                        addToCurrent ? 'bg-purple-500/10 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Append images to current view instead of replacing"
                >
                    {addToCurrent ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    <span className="hidden sm:inline">Append</span>
                </button>

                {/* Empty Canvas */}
                <button
                    onClick={onClearCanvas}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Clear Canvas"
                >
                    <Trash2 size={14} />
                </button>

                <div className="w-px h-4 bg-zinc-800" />

                {/* Queue */}
                <div className="relative">
                    {showQueue && (
                        <QueuePopover 
                            queue={queue} 
                            onRemove={queueActions.remove} 
                            onClear={queueActions.clear}
                            onReorder={queueActions.reorder}
                            onClose={() => setShowQueue(false)}
                        />
                    )}
                    <button 
                        onClick={() => setShowQueue(!showQueue)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all relative ${
                            queue.length > 0 
                            ? 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="Generation Queue"
                    >
                        <List size={14} />
                        {queue.length > 0 && (
                            <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                                {queue.length}
                            </span>
                        )}
                    </button>
                </div>

             </div>
          </div>
        </div>
    </div>
  );
};

export default PromptBar;