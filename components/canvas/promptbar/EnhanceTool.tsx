
import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { enhancePrompt } from '../../../services/llmService';
import { AppSettings } from '../../../types';

interface EnhanceToolProps {
  settings: AppSettings;
  currentPrompt: string;
  onUpdatePrompt: (prompt: string) => void;
}

export const EnhanceTool: React.FC<EnhanceToolProps> = ({ settings, currentPrompt, onUpdatePrompt }) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showEnhanceMenu, setShowEnhanceMenu] = useState(false);

  const runEnhancer = async (intensity: 'Low' | 'Medium' | 'High') => {
      if (!currentPrompt) return;
      setIsEnhancing(true);
      setShowEnhanceMenu(false);
      try {
          const enhanced = await enhancePrompt(
              settings.llm.host,
              settings.llm.apiKey,
              settings.llm.model,
              currentPrompt,
              intensity
          );
          onUpdatePrompt(enhanced);
      } catch (e) {
          console.error("Enhance failed", e);
      } finally {
          setIsEnhancing(false);
      }
  };

  return (
    <div className="relative">
       <button 
           onClick={() => setShowEnhanceMenu(!showEnhanceMenu)}
           disabled={isEnhancing || !currentPrompt}
           className="p-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-purple-900/30 hover:text-purple-300 transition-colors flex items-center gap-1 disabled:opacity-50"
           title="Enhance Prompt"
       >
           <Wand2 size={14} className={isEnhancing ? 'animate-spin' : ''} /> Enhance
       </button>
       {showEnhanceMenu && (
           <div className="absolute bottom-full mb-2 left-0 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-bottom-2">
               {['Low', 'Medium', 'High'].map((intensity) => (
                   <button
                      key={intensity}
                      onClick={() => runEnhancer(intensity as any)}
                      className="text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                   >
                       {intensity} Intensity
                   </button>
               ))}
           </div>
       )}
    </div>
  );
};
