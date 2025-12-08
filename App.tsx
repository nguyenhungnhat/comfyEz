

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import ImageCanvas from './components/ImageCanvas';
import SettingsModal from './components/SettingsModal';
import WorkflowModal from './components/WorkflowModal';
import { AppSettings, GenerationParams } from './types';
import { DEFAULT_SETTINGS, DEFAULT_PARAMS } from './constants';
import { getCheckpoints, getLoras } from './services/comfyService';
import { useComfy } from './hooks/useComfy';
import { useWorkflows } from './hooks/useWorkflows';
import { loadSessionParams, saveSessionParams } from './services/db';

function App() {
  // --- Persistent UI State ---
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('comfy_settings');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    if (!parsed.llm) parsed.llm = DEFAULT_SETTINGS.llm;
    return parsed;
  });

  // Init params with defaults, then load from IDB async
  const [params, setParams] = useState<GenerationParams>(DEFAULT_PARAMS);
  const [isParamsLoaded, setIsParamsLoaded] = useState(false);

  const [addToCurrent, setAddToCurrent] = useState(false);

  // --- Hooks ---
  const { 
    queue, 
    history, 
    canvasImages, 
    setCanvasImages,
    setHistory,
    removeHistoryItem, 
    isProcessing, 
    processingError, 
    addToQueue, 
    removeFromQueue, 
    clearQueue,
    reorderQueue
  } = useComfy(settings, addToCurrent);

  const {
    presets,
    activePresetId,
    activePreset,
    setActivePresetId,
    addPreset,
    updatePreset,
    deletePreset,
    replacePresets,
    resetPresets
  } = useWorkflows();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(false);
  const [checkpoints, setCheckpoints] = useState<string[]>([]);
  const [availableLoras, setAvailableLoras] = useState<string[]>([]);

  // --- Effects ---
  useEffect(() => { localStorage.setItem('comfy_settings', JSON.stringify(settings)); }, [settings]);
  
  // Load Session Params from IDB
  useEffect(() => {
      loadSessionParams().then(saved => {
          if (saved) {
               // Ensure defaults exist if schema changed
               if (saved.advancedMode === undefined) saved.advancedMode = false;
               if (!saved.variants) saved.variants = [];
               if (!saved.model) saved.model = DEFAULT_PARAMS.model;
               if (!saved.loras) saved.loras = [];
               if (!saved.batchSize) saved.batchSize = 1;
               if (saved.denoise === undefined) saved.denoise = 1.0;
               setParams(saved);
          }
          setIsParamsLoaded(true);
      }).catch(err => {
          console.error("Failed to load session", err);
          setIsParamsLoaded(true);
      });
  }, []);

  // Save Session Params to IDB (debounce could be added here if needed, but simple for now)
  useEffect(() => {
      if (isParamsLoaded) {
          saveSessionParams(params).catch(console.error);
      }
  }, [params, isParamsLoaded]);

  useEffect(() => {
      const fetchData = async () => {
          const ckpts = await getCheckpoints(settings.host);
          setCheckpoints(ckpts);
          const loras = await getLoras(settings.host);
          setAvailableLoras(loras);
      };
      if (settings.host) {
        fetchData();
      }
  }, [settings.host]);

  // --- Handlers ---
  const handleGenerate = () => {
    // Inject the current workflow state into the params before queuing
    const finalParams: GenerationParams = {
        ...params,
        workflow: activePreset.workflow,
        nodeMapping: activePreset.mapping
    };
    addToQueue(finalParams);
  };

  const handleSelectHistory = (item: any) => {
      setParams(item.params);
      setCanvasImages([{
          id: Date.now().toString(),
          url: item.imageUrl,
          width: item.params.width,
          height: item.params.height,
          params: item.params
      }]);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-900 text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      <Sidebar 
        params={params}
        setParams={setParams}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenWorkflows={() => setIsWorkflowsOpen(true)}
        checkpoints={checkpoints}
        availableLoras={availableLoras}
        presets={presets}
        activePresetId={activePresetId}
        setActivePresetId={setActivePresetId}
      />
      
      <main className="flex-1 h-full relative flex flex-col bg-zinc-950">
        <ImageCanvas 
          canvasImages={canvasImages}
          setCanvasImages={setCanvasImages}
          isProcessing={isProcessing} 
          params={params}
          setParams={setParams}
          onGenerate={handleGenerate}
          error={processingError}
          history={history}
          setHistory={setHistory}
          onRemoveHistory={removeHistoryItem}
          onSelectHistory={handleSelectHistory}
          settings={settings}
          queue={queue}
          onRemoveFromQueue={removeFromQueue}
          onClearQueue={clearQueue}
          onReorderQueue={reorderQueue}
          addToCurrent={addToCurrent}
          setAddToCurrent={setAddToCurrent}
          supportedFeatures={activePreset.features}
        />
        
        {/* Active Preset Indicator */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
           <div className="bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full px-3 py-1 text-xs text-zinc-400 flex items-center gap-2 shadow-lg">
              <span className={`w-2 h-2 rounded-full ${activePreset.features?.includes('inpainting') ? 'bg-purple-500' : 'bg-green-500'}`}></span>
              {activePreset.name}
           </div>
        </div>
      </main>

      {/* Right Sidebar for Advanced Mode */}
      {params.advancedMode && (
          <RightSidebar 
             settings={settings}
             params={params}
             setParams={setParams}
          />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />

      <WorkflowModal
        isOpen={isWorkflowsOpen}
        onClose={() => setIsWorkflowsOpen(false)}
        presets={presets}
        activePresetId={activePresetId}
        setActivePresetId={setActivePresetId}
        onAdd={addPreset}
        onUpdate={updatePreset}
        onDelete={deletePreset}
        onOverwrite={replacePresets}
        onReset={resetPresets}
      />
    </div>
  );
}

export default App;