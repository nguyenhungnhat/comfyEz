import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';
import { fetchLLMModels } from '../services/llmService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const [llmModels, setLlmModels] = useState<{id: string, name?: string}[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleFetchModels = async () => {
    setLoadingModels(true);
    setFetchError(null);
    try {
        const models = await fetchLLMModels(settings.llm.host, settings.llm.apiKey);
        setLlmModels(models);
    } catch (e) {
        setFetchError("Failed to fetch models. Check URL/Key.");
    } finally {
        setLoadingModels(false);
    }
  };

  const updateLLM = (key: string, value: any) => {
    setSettings({
        ...settings,
        llm: { ...settings.llm, [key]: value }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold">Settings</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
                <X size={20} />
            </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          {/* ComfyUI Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">ComfyUI Config</h3>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Host URL
              </label>
              <input
                type="text"
                value={settings.host}
                onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                placeholder="http://127.0.0.1:8188"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* LLM Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">LLM Config</h3>
                <label className="flex items-center cursor-pointer">
                    <span className="mr-2 text-xs text-zinc-400">Enable</span>
                    <input 
                       type="checkbox" 
                       checked={settings.llm.enabled}
                       onChange={(e) => updateLLM('enabled', e.target.checked)}
                       className="hidden"
                    />
                     <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.llm.enabled ? 'bg-purple-600' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.llm.enabled ? 'left-4.5' : 'left-0.5'}`} style={{ left: settings.llm.enabled ? '18px' : '2px'}} />
                    </div>
                </label>
             </div>

             <div className={`space-y-4 transition-opacity ${settings.llm.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">API Host</label>
                    <input
                        type="text"
                        value={settings.llm.host}
                        onChange={(e) => updateLLM('host', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://openrouter.ai/api/v1"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">API Key</label>
                    <input
                        type="password"
                        value={settings.llm.apiKey}
                        onChange={(e) => updateLLM('apiKey', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="sk-..."
                    />
                 </div>
                 
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-zinc-400">Model</label>
                        <button 
                            onClick={handleFetchModels}
                            disabled={loadingModels || !settings.llm.apiKey}
                            className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 disabled:opacity-50"
                        >
                           <RefreshCw size={12} className={loadingModels ? 'animate-spin' : ''} />
                           Fetch List
                        </button>
                    </div>
                    
                    {fetchError && <p className="text-xs text-red-500 mb-2">{fetchError}</p>}

                    {llmModels.length > 0 ? (
                        <select 
                            value={settings.llm.model}
                            onChange={(e) => updateLLM('model', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {llmModels.map(m => (
                                <option key={m.id} value={m.id}>{m.name || m.id}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={settings.llm.model}
                            onChange={(e) => updateLLM('model', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="gpt-4o-mini"
                        />
                    )}
                 </div>
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;