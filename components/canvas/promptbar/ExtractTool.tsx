

import React, { useState, useRef } from 'react';
import { ScanEye, Upload, X, Undo, AlertCircle, Loader2, Settings, ChevronLeft, Brain } from 'lucide-react';
import { extractPromptFromImage, DEFAULT_EXTRACT_CONSTRAINTS } from '../../../services/llmService';
import { AppSettings } from '../../../types';

interface ExtractToolProps {
  settings: AppSettings;
  currentPrompt: string;
  onUpdatePrompt: (prompt: string) => void;
}

export const ExtractTool: React.FC<ExtractToolProps> = ({ settings, currentPrompt, onUpdatePrompt }) => {
  const [show, setShow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  
  // Settings State
  const [instruction, setInstruction] = useState("");
  const [temperature, setTemperature] = useState(0.5);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_EXTRACT_CONSTRAINTS);
  
  // Reasoning State
  const [enableReasoning, setEnableReasoning] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('medium');

  const [isExtracting, setIsExtracting] = useState(false);
  const [previousPrompt, setPreviousPrompt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) setImage(ev.target.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleExtract = async () => {
      if (!image) return;
      setIsExtracting(true);
      try {
          const result = await extractPromptFromImage(
              settings.llm.host,
              settings.llm.apiKey,
              settings.llm.model,
              image,
              instruction,
              systemPrompt,
              temperature,
              { enabled: enableReasoning, effort: reasoningEffort }
          );
          setPreviousPrompt(currentPrompt);
          onUpdatePrompt(result);
      } catch (e) {
          console.error("Extraction failed", e);
      } finally {
          setIsExtracting(false);
      }
  };

  const handleRevert = () => {
      if (previousPrompt) {
          onUpdatePrompt(previousPrompt);
          setPreviousPrompt(null);
      }
  };

  const toggleSettings = () => {
      setShowSettings(!showSettings);
  };

  return (
    <div className="relative">
       <button
           onClick={() => setShow(!show)}
           disabled={isExtracting}
           className="p-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-green-900/30 hover:text-green-300 transition-colors flex items-center gap-1 disabled:opacity-50"
           title="Extract Prompt from Image"
       >
           <ScanEye size={14} className={isExtracting ? 'animate-pulse' : ''} /> 
           <span className="hidden sm:inline">Extract</span>
       </button>
       
       {show && (
            <div className="absolute bottom-full mb-2 right-0 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 flex flex-col">
                
                {/* Header */}
                <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                        {showSettings && (
                            <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white mr-1">
                                <ChevronLeft size={14} />
                            </button>
                        )}
                        <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                            {showSettings ? <Settings size={12} /> : <ScanEye size={12} />}
                            {showSettings ? "Extractor Settings" : "Image to Prompt"}
                        </span>
                    </div>
                    <div className="flex gap-2">
                         {!showSettings && (
                            <button onClick={toggleSettings} className="text-zinc-500 hover:text-white" title="Settings">
                                <Settings size={14} />
                            </button>
                         )}
                         <button onClick={() => setShow(false)} className="text-zinc-500 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Main View */}
                {!showSettings ? (
                    <div className="p-3 flex flex-col gap-3">
                        {/* Image Upload */}
                        {!image ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="h-24 border border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors bg-zinc-950/50"
                            >
                                <Upload size={20} className="text-zinc-500 mb-1" />
                                <span className="text-[10px] text-zinc-500">Click to upload image</span>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border border-zinc-700 bg-black h-32 flex items-center justify-center group">
                                <img src={image} alt="Extract Source" className="h-full object-contain" />
                                <button 
                                    onClick={() => setImage(null)}
                                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        {/* Quick Instruction */}
                        <div>
                            <input
                                type="text"
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                placeholder="Optional instruction (e.g. 'Focus on colors')"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-xs focus:outline-none focus:border-green-500 placeholder-zinc-600"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            {previousPrompt && (
                                <button 
                                    onClick={handleRevert}
                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                    title="Revert to previous prompt"
                                >
                                    <Undo size={12} /> Revert
                                </button>
                            )}
                            <button 
                                onClick={handleExtract}
                                disabled={isExtracting || !image}
                                className="flex-1 py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                                {isExtracting ? (
                                    <><Loader2 size={12} className="animate-spin" /> Extracting...</>
                                ) : (
                                    <><ScanEye size={12} /> Extract Prompt</>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 flex flex-col gap-3 bg-zinc-900">
                        {/* Settings View */}
                        
                        {/* Custom System Prompt */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">System Prompt (Constraints)</label>
                            <textarea 
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded p-2 text-[10px] font-mono focus:border-green-500 outline-none resize-none leading-relaxed text-zinc-400"
                            />
                        </div>

                        {/* Reasoning Config */}
                        <div className="space-y-2 border-t border-zinc-800 pt-2">
                             <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                                    <Brain size={12} /> Reasoning
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={enableReasoning} onChange={(e) => setEnableReasoning(e.target.checked)} className="sr-only peer" />
                                    <div className="w-7 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                             </div>

                             {enableReasoning ? (
                                 <div className="animate-in slide-in-from-top-1 fade-in">
                                     <div className="grid grid-cols-3 gap-1 mb-2">
                                        {['low', 'medium', 'high'].map((effort) => (
                                            <button
                                                key={effort}
                                                onClick={() => setReasoningEffort(effort as any)}
                                                className={`py-1 text-[10px] uppercase font-bold rounded border ${
                                                    reasoningEffort === effort 
                                                    ? 'bg-green-900/30 border-green-500 text-green-400' 
                                                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                                                }`}
                                            >
                                                {effort}
                                            </button>
                                        ))}
                                     </div>
                                     <div className="flex items-start gap-1.5 p-2 bg-blue-900/10 rounded border border-blue-500/20">
                                        <AlertCircle size={12} className="text-blue-400 shrink-0 mt-0.5" />
                                        <span className="text-[10px] text-blue-300 leading-tight">
                                            Make sure your configured LLM supports reasoning (e.g. o1, o3-mini).
                                        </span>
                                    </div>
                                 </div>
                             ) : (
                                 /* Temperature (Only shown when reasoning is disabled) */
                                <div className="space-y-1 animate-in slide-in-from-top-1 fade-in">
                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                        <span>Creativity (Temp)</span>
                                        <span>{temperature.toFixed(1)}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.1" 
                                        value={temperature}
                                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                                    />
                                </div>
                             )}
                        </div>

                        <div className="flex items-start gap-1.5 p-2 bg-zinc-800/50 rounded border border-zinc-800">
                            <AlertCircle size={12} className="text-zinc-500 shrink-0 mt-0.5" />
                            <span className="text-[10px] text-zinc-500 leading-tight">
                                Ensure your configured LLM supports image understanding.
                            </span>
                        </div>
                    </div>
                )}
            </div>
       )}
    </div>
  );
};
