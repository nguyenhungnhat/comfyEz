
import React, { useState } from 'react';
import { MessageSquare, Send, X, Undo } from 'lucide-react';
import { modifyPrompt } from '../../../services/llmService';
import { AppSettings } from '../../../types';

interface ChatToolProps {
  settings: AppSettings;
  currentPrompt: string;
  onUpdatePrompt: (prompt: string) => void;
}

export const ChatTool: React.FC<ChatToolProps> = ({ settings, currentPrompt, onUpdatePrompt }) => {
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [previousPrompt, setPreviousPrompt] = useState<string | null>(null);

  const handleChatSubmit = async () => {
      if (!chatInput.trim() || !currentPrompt) return;
      setIsChatting(true);
      try {
          const modified = await modifyPrompt(
              settings.llm.host, 
              settings.llm.apiKey, 
              settings.llm.model, 
              currentPrompt, 
              chatInput
          );
          setPreviousPrompt(currentPrompt);
          onUpdatePrompt(modified);
          setChatInput(""); 
      } catch (e) {
          console.error("Chat modify failed", e);
      } finally {
          setIsChatting(false);
      }
  };

  const handleRevert = () => {
      if (!previousPrompt) return;
      onUpdatePrompt(previousPrompt);
      setPreviousPrompt(null);
  };

  return (
    <div className="relative">
       <button
           onClick={() => setShowChat(!showChat)}
           disabled={isChatting || !currentPrompt}
           className="p-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-blue-900/30 hover:text-blue-300 transition-colors flex items-center gap-1 disabled:opacity-50"
           title="Chat with AI"
       >
           <MessageSquare size={14} className={isChatting ? 'animate-bounce' : ''} /> Chat
       </button>
       
       {showChat && (
            <div className="absolute bottom-full mb-2 left-0 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                        <MessageSquare size={12} /> Refine Prompt
                    </span>
                    <button onClick={() => setShowChat(false)} className="text-zinc-500 hover:text-white">
                        <X size={12} />
                    </button>
                </div>
                <textarea 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="How should I change the prompt? (e.g., 'Make it night time', 'Add a cyberpunk city background')"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-xs focus:outline-none focus:border-blue-500 resize-none h-20 placeholder-zinc-600"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatSubmit();
                        }
                    }}
                />
                <div className="flex gap-2">
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
                        onClick={handleChatSubmit}
                        disabled={isChatting || !chatInput.trim()}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                        {isChatting ? (
                            <><span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full"></span> Updating...</>
                        ) : (
                            <><Send size={12} /> Update Prompt</>
                        )}
                    </button>
                </div>
            </div>
       )}
    </div>
  );
};
