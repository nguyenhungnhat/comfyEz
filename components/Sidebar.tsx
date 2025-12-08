

import React, { useState, useMemo } from 'react';
import { Settings, RotateCcw, Box, Plus, Trash2, Zap, GitFork, Image as ImageIcon, X } from 'lucide-react';
import { GenerationParams, WorkflowPreset } from '../types';
import { SAMPLERS, SCHEDULERS, ASPECT_RATIOS, UPSCALE_METHODS } from '../constants';

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
  const [selectedLoraToAdd, setSelectedLoraToAdd] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const activePreset = useMemo(() => presets.find(p => p.id === activePresetId), [presets, activePresetId]);
  
  // Detect if current workflow supports upscaling (has ImageScaleBy node)
  const supportsUpscaling = useMemo(() => {
      if (!activePreset) return false;
      // Check mapping first
      if (activePreset.mapping.upscaleNode) return true;
      // Check nodes directly in case mapping is missing
      return Object.values(activePreset.workflow).some((node: any) => node.class_type === 'ImageScaleBy');
  }, [activePreset]);

  const handleChange = (key: keyof GenerationParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const setRatio = (width: number, height: number) => {
    setParams(prev => ({ ...prev, width, height }));
  };

  const processFile = (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result) {
              setParams(prev => ({ ...prev, inputImage: event.target!.result as string }));
          }
      };
      reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
          processFile(file);
      }
  };

  const clearImage = () => {
      setParams(prev => ({ ...prev, inputImage: undefined }));
  };

  const addLora = () => {
      if (!selectedLoraToAdd) return;
      if (params.loras.some(l => l.name === selectedLoraToAdd)) return;

      const newLora = {
          id: Date.now().toString(),
          name: selectedLoraToAdd,
          strength: 1.0,
          enabled: true
      };

      setParams(prev => ({
          ...prev,
          loras: [...prev.loras, newLora]
      }));
      setSelectedLoraToAdd('');
  };

  const removeLora = (id: string) => {
      setParams(prev => ({
          ...prev,
          loras: prev.loras.filter(l => l.id !== id)
      }));
  };

  const updateLora = (id: string, updates: Partial<typeof params.loras[0]>) => {
      setParams(prev => ({
          ...prev,
          loras: prev.loras.map(l => l.id === id ? { ...l, ...updates } : l)
      }));
  };

  return (
    <div className="w-80 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-xl z-20 shrink-0">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          ComfyEz
        </h1>
        <div className="flex gap-1">
             <button 
                onClick={onOpenWorkflows}
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                title="Workflow Editor"
            >
                <GitFork size={20} />
            </button>
            <button 
                onClick={onOpenSettings}
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                title="Settings"
            >
                <Settings size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Workflow Selection */}
        <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Workflow</label>
            <select
                value={activePresetId}
                onChange={(e) => setActivePresetId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs truncate focus:outline-none focus:border-blue-500"
            >
                {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>

        {/* Image to Image */}
        <div className="space-y-3">
             <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={12} className="text-green-400"/> Image Input
            </label>
            
            {!params.inputImage ? (
                <label 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        isDragging 
                        ? 'bg-blue-900/20 border-blue-500' 
                        : 'border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-500'
                    }`}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus size={24} className={`mb-1 ${isDragging ? 'text-blue-400' : 'text-zinc-500'}`} />
                        <p className={`text-[10px] ${isDragging ? 'text-blue-300' : 'text-zinc-500'}`}>
                            {isDragging ? 'Drop Image Here' : 'Upload or Drag Image'}
                        </p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
            ) : (
                <div className="relative group rounded-lg overflow-hidden border border-zinc-700 bg-black">
                    <img src={params.inputImage} alt="Input" className="w-full h-32 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                    <button 
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
            
            {/* Denoise Slider (Only show if image exists) */}
            {params.inputImage && (
                <div className="space-y-2 pt-1 animate-in slide-in-from-top-2">
                    <div className="flex justify-between text-xs">
                        <span className="font-semibold text-zinc-400 uppercase">Denoising</span>
                        <span className="text-zinc-300">{params.denoise.toFixed(2)}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={params.denoise}
                        onChange={(e) => handleChange('denoise', parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                     <p className="text-[10px] text-zinc-500">Lower = closer to original image</p>
                </div>
            )}
        </div>
        
        {/* Model Selection */}
        <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Checkpoint</label>
            <select
                value={params.model}
                onChange={(e) => handleChange('model', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs truncate focus:outline-none focus:border-blue-500"
            >
                {checkpoints.length === 0 && <option value={params.model}>{params.model}</option>}
                {checkpoints.map(ckpt => <option key={ckpt} value={ckpt}>{ckpt}</option>)}
            </select>
        </div>

        {/* LoRA Section */}
        <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Zap size={12} className="text-yellow-400"/> LoRAs
            </label>
            
            <div className="flex gap-2">
                <select 
                    value={selectedLoraToAdd}
                    onChange={(e) => setSelectedLoraToAdd(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs truncate focus:outline-none focus:border-blue-500"
                >
                    <option value="">Select LoRA...</option>
                    {availableLoras.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button 
                    onClick={addLora}
                    disabled={!selectedLoraToAdd}
                    className="p-2 bg-zinc-800 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-zinc-800 rounded-lg transition-colors text-white"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="space-y-2">
                {params.loras.map(lora => (
                    <div key={lora.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 space-y-2">
                        <div className="flex justify-between items-center gap-2">
                            <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={lora.enabled}
                                    onChange={(e) => updateLora(lora.id, { enabled: e.target.checked })}
                                    className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0"
                                />
                                <span className={`text-xs truncate ${lora.enabled ? 'text-zinc-200' : 'text-zinc-500'}`} title={lora.name}>
                                    {lora.name}
                                </span>
                            </label>
                            <button onClick={() => removeLora(lora.id)} className="text-zinc-500 hover:text-red-400">
                                <Trash2 size={12} />
                            </button>
                        </div>
                        {lora.enabled && (
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-[10px] text-zinc-500 w-8">{lora.strength.toFixed(1)}</span>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="2.0" 
                                    step="0.1" 
                                    value={lora.strength}
                                    onChange={(e) => updateLora(lora.id, { strength: parseFloat(e.target.value) })}
                                    className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-3">
           <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dimensions</label>
           
           {/* Aspect Ratio Presets */}
           <div className="grid grid-cols-3 gap-2">
             {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.label}
                  onClick={() => setRatio(ratio.width, ratio.height)}
                  className={`text-xs py-1.5 px-2 rounded border transition-all ${
                    params.width === ratio.width && params.height === ratio.height
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {ratio.label}
                </button>
             ))}
           </div>

           <div className="grid grid-cols-2 gap-2">
              <div>
                  <label className="text-xs text-zinc-500 block mb-1">Width</label>
                  <input 
                      type="number" 
                      value={params.width}
                      onChange={(e) => handleChange('width', parseInt(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-blue-500 outline-none"
                  />
              </div>
              <div>
                  <label className="text-xs text-zinc-500 block mb-1">Height</label>
                  <input 
                      type="number" 
                      value={params.height}
                      onChange={(e) => handleChange('height', parseInt(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-blue-500 outline-none"
                  />
              </div>
           </div>
        </div>

        {/* CFG & Steps */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-400 uppercase">Steps</span>
              <span className="text-zinc-300">{params.steps}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={params.steps}
              onChange={(e) => handleChange('steps', parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-400 uppercase">CFG Scale</span>
              <span className="text-zinc-300">{params.cfg}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={params.cfg}
              onChange={(e) => handleChange('cfg', parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Sampler & Scheduler */}
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sampler</label>
                <select
                    value={params.sampler}
                    onChange={(e) => handleChange('sampler', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                >
                    {SAMPLERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Scheduler</label>
                <select
                    value={params.scheduler}
                    onChange={(e) => handleChange('scheduler', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                >
                    {SCHEDULERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>
        
        {/* Seed */}
         <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Seed</span>
            <span className="text-[10px] text-zinc-500 normal-case">(-1 for random)</span>
          </label>
          <div className="flex gap-2">
             <input
                type="number"
                value={params.seed}
                onChange={(e) => handleChange('seed', parseInt(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button 
                onClick={() => handleChange('seed', -1)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                title="Randomize"
            >
                <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Upscaler Toggle (Only if workflow supports it) */}
        {supportsUpscaling && (
            <div className="space-y-2 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
                <div 
                    onClick={() => handleChange('upscaler', !params.upscaler)}
                    className={`cursor-pointer flex items-center justify-between transition-all`}
                >
                    <div className="flex items-center gap-2">
                        <Box size={18} className={params.upscaler ? 'text-blue-400' : 'text-zinc-500'} />
                        <span className={`text-sm font-medium ${params.upscaler ? 'text-blue-200' : 'text-zinc-400'}`}>
                            Upscaler
                        </span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${params.upscaler ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${params.upscaler ? 'left-4.5' : 'left-0.5'}`} style={{ left: params.upscaler ? '18px' : '2px'}} />
                    </div>
                </div>

                {params.upscaler && (
                    <div className="pt-2 animate-in slide-in-from-top-1 space-y-3">
                         {/* Method */}
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase font-semibold mb-1 block">Method</label>
                            <select
                                value={params.upscaleMethod || 'lanczos'}
                                onChange={(e) => handleChange('upscaleMethod', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                            >
                                {UPSCALE_METHODS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Factor */}
                        <div>
                             <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-semibold mb-1">
                                <span>Scale Factor</span>
                                <span>{params.upscaleFactor || 2}x</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="4"
                                step="0.5"
                                value={params.upscaleFactor || 2}
                                onChange={(e) => handleChange('upscaleFactor', parseFloat(e.target.value))}
                                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default Sidebar;