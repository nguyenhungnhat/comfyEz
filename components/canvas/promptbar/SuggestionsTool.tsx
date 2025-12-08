
import React, { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { suggestPrompts } from '../../../services/llmService';
import { AppSettings } from '../../../types';

interface SuggestionsToolProps {
  settings: AppSettings;
  currentPrompt: string;
  onUpdatePrompt: (prompt: string) => void;
}

export const SuggestionsTool: React.FC<SuggestionsToolProps> = ({ settings, currentPrompt, onUpdatePrompt }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      setSuggestions([]);
      try {
          const res = await suggestPrompts(
              settings.llm.host,
              settings.llm.apiKey,
              settings.llm.model,
              currentPrompt
          );
          setSuggestions(res);
      } catch (e) {
          console.error("Suggestions failed", e);
      } finally {
          setLoadingSuggestions(false);
      }
  };

  return (
    <div className="relative">
        <button 
            onClick={() => { setShowSuggestions(!showSuggestions); if(!showSuggestions && suggestions.length === 0 && currentPrompt) fetchSuggestions(); }}
            disabled={loadingSuggestions || !currentPrompt}
            className="p-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-yellow-900/30 hover:text-yellow-300 transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Prompt Ideas"
        >
            <Lightbulb size={14} className={loadingSuggestions ? 'animate-pulse' : ''} /> Ideas
        </button>
        {showSuggestions && (
                <div className="absolute bottom-full mb-2 left-0 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-zinc-400">Suggestions</span>
                    <div className="flex gap-2">
                        <button onClick={fetchSuggestions} className="text-blue-400 hover:text-blue-300 text-[10px]">Refresh</button>
                        <button onClick={() => setShowSuggestions(false)} className="text-zinc-500 hover:text-white"><X size={12} /></button>
                    </div>
                </div>
                {loadingSuggestions ? (
                    <div className="text-center py-4 text-xs text-zinc-500">Thinking...</div>
                ) : (
                    <div className="space-y-2">
                        {suggestions.map((s, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => { onUpdatePrompt(s); setShowSuggestions(false); }}
                                className="text-xs p-2 bg-zinc-800 rounded hover:bg-zinc-700 cursor-pointer text-zinc-300 border border-transparent hover:border-zinc-600 transition-colors"
                            >
                                {s}
                            </div>
                        ))}
                        {suggestions.length === 0 && <div className="text-center text-xs text-zinc-600">No suggestions yet.</div>}
                    </div>
                )}
                </div>
        )}
    </div>
  );
};
