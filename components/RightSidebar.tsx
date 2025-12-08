
import React from 'react';
import { AppSettings, GenerationParams } from '../types';
import { useRightSidebar, PRESETS, DEFAULT_SYSTEM_PROMPT } from '../hooks/useRightSidebar';

import SettingsOverlay from './right-sidebar/SettingsOverlay';
import SidebarHeader from './right-sidebar/SidebarHeader';
import PreviewSection from './right-sidebar/PreviewSection';
import GenerationSection from './right-sidebar/GenerationSection';
import VariantList from './right-sidebar/VariantList';

interface RightSidebarProps {
  settings: AppSettings;
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ settings, params, setParams }) => {
  const {
      prompt, setPrompt,
      isLoading,
      error,
      searchTerm, setSearchTerm,
      collapsedVariants,
      isSingleMode, setIsSingleMode,
      showSettings, setShowSettings,
      systemInstruction, setSystemInstruction,
      handleGenerateVariants,
      removeVariant,
      toggleOption,
      updateCustomPrompt,
      handleExport,
      handleImport,
      toggleCollapse,
      combinedPreview
  } = useRightSidebar(settings, params, setParams);

  return (
    <div className="w-80 h-full bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-xl z-20 shrink-0 text-sm relative">
        <SettingsOverlay 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            systemInstruction={systemInstruction}
            setSystemInstruction={setSystemInstruction}
            defaultInstruction={DEFAULT_SYSTEM_PROMPT}
        />

        <SidebarHeader 
            onOpenSettings={() => setShowSettings(true)}
            onExport={handleExport}
            onImport={handleImport}
        />

        <PreviewSection combinedPreview={combinedPreview} />

        <GenerationSection 
            prompt={prompt}
            setPrompt={setPrompt}
            isSingleMode={isSingleMode}
            setIsSingleMode={setIsSingleMode}
            isLoading={isLoading}
            error={error}
            onGenerate={handleGenerateVariants}
            disabled={isLoading || !prompt.trim() || !settings.llm.enabled}
            presets={PRESETS}
        />

        <VariantList 
            variants={params.variants}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            collapsedVariants={collapsedVariants}
            toggleCollapse={toggleCollapse}
            removeVariant={removeVariant}
            toggleOption={toggleOption}
            updateCustomPrompt={updateCustomPrompt}
        />
    </div>
  );
};

export default RightSidebar;
