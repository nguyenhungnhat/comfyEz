import React, { useState } from 'react';
import { AlignLeft } from 'lucide-react';
import { prettifyPrompt } from '../../../services/llmService';
import { AppSettings } from '../../../types';

interface PrettifyToolProps {
  settings: AppSettings;
  currentPrompt: string;
  onUpdatePrompt: (prompt: string) => void;
}

export const PrettifyTool: React.FC<PrettifyToolProps> = ({ settings, currentPrompt, onUpdatePrompt }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePrettify = async () => {
      if (!currentPrompt) return;
      setIsProcessing(true);
      try {
          const formatted = await prettifyPrompt(
              settings.llm.host,
              settings.llm.apiKey,
              settings.llm.model,
              currentPrompt
          );
          onUpdatePrompt(formatted);
      } catch (e) {
          console.error("Prettify failed", e);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="relative">
       <button
           onClick={handlePrettify}
           disabled={isProcessing || !currentPrompt}
           className="p-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-teal-900/30 hover:text-teal-300 transition-colors flex items-center gap-1 disabled:opacity-50"
           title="Format Prompt Structure"
       >
           <AlignLeft size={14} className={isProcessing ? 'animate-pulse' : ''} /> 
           <span className="hidden sm:inline">Prettify</span>
       </button>
    </div>
  );
};
