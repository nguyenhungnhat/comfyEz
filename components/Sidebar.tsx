

import React from 'react';
import { GenerationParams, WorkflowPreset } from '../types';
import { useSidebar } from '../hooks/useSidebar';
import { useLoraLibrary } from '../hooks/useLoraLibrary';
import { DEFAULT_SETTINGS } from '../constants';

import SidebarHeader from './sidebar/SidebarHeader';
import WorkflowSelector from './sidebar/WorkflowSelector';
import ImageInput from './sidebar/ImageInput';
import ModelSelector from './sidebar/ModelSelector';
import LoraSection from './sidebar/LoraSection';
import DimensionsControl from './sidebar/DimensionsControl';
import SamplingControls from './sidebar/SamplingControls';
import UpscaleControl from './sidebar/UpscaleControl';

interface SidebarProps {
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
  onOpenSettings: () => void;
  onOpenWorkflows: () => void;
  checkpoints: string[];
  availableLoras: string[];
  presets: WorkflowPreset[];
  activePresetId: string;
  setActivePresetId: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  params, 
  setParams, 
  onOpenSettings,
  onOpenWorkflows,
  checkpoints,
  availableLoras,
  presets,
  activePresetId,
  setActivePresetId
}) => {
  const {
      selectedLoraToAdd,
      setSelectedLoraToAdd,
      isDragging,
      supportsUpscaling,
      handleChange,
      setRatio,
      handleImageUpload,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      clearImage,
      addLora,
      removeLora,
      updateLora,
      addTriggerToPrompt
  } = useSidebar(params, setParams, presets, activePresetId);

  // Use the Host from local storage (or default) to fetch library, 
  // since AppSettings isn't passed down but we know it's stored.
  // Ideally AppSettings should be passed to Sidebar, but we can fallback or read localstorage
  const storedSettings = localStorage.getItem('comfy_settings');
  const host = storedSettings ? JSON.parse(storedSettings).host : DEFAULT_SETTINGS.host;
  
  const { library, updateLora: updateLoraMetadata } = useLoraLibrary(host);

  return (
    <div className="w-80 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-xl z-20 shrink-0">
      
      <SidebarHeader 
        onOpenWorkflows={onOpenWorkflows} 
        onOpenSettings={onOpenSettings} 
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        <WorkflowSelector 
            presets={presets} 
            activePresetId={activePresetId} 
            setActivePresetId={setActivePresetId} 
        />

        <ImageInput 
            inputImage={params.inputImage}
            denoise={params.denoise}
            isDragging={isDragging}
            handleImageUpload={handleImageUpload}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            clearImage={clearImage}
            handleChange={handleChange}
        />
        
        <ModelSelector 
            model={params.model}
            checkpoints={checkpoints}
            handleChange={handleChange}
        />

        <LoraSection 
            loras={params.loras}
            availableLoras={availableLoras}
            library={library}
            selectedLoraToAdd={selectedLoraToAdd}
            setSelectedLoraToAdd={setSelectedLoraToAdd}
            addLora={addLora}
            removeLora={removeLora}
            updateLora={updateLora}
            onUpdateMetadata={updateLoraMetadata}
            onAddTriggerToPrompt={addTriggerToPrompt}
            prompt={params.prompt}
        />

        <DimensionsControl 
            width={params.width}
            height={params.height}
            setRatio={setRatio}
            handleChange={handleChange}
        />

        <SamplingControls 
            steps={params.steps}
            cfg={params.cfg}
            sampler={params.sampler}
            scheduler={params.scheduler}
            seed={params.seed}
            handleChange={handleChange}
        />

        <UpscaleControl 
            supported={supportsUpscaling}
            upscaler={params.upscaler}
            upscaleMethod={params.upscaleMethod}
            upscaleFactor={params.upscaleFactor}
            handleChange={handleChange}
        />

      </div>
    </div>
  );
};

export default Sidebar;