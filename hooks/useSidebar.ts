
import { useState, useMemo } from 'react';
import { GenerationParams, WorkflowPreset } from '../types';

export const useSidebar = (
    params: GenerationParams,
    setParams: React.Dispatch<React.SetStateAction<GenerationParams>>,
    presets: WorkflowPreset[],
    activePresetId: string
) => {
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

    const addLora = (name?: string) => {
        const targetName = name || selectedLoraToAdd;
        if (!targetName) return;
        if (params.loras.some(l => l.name === targetName)) return;

        const newLora = {
            id: Date.now().toString(),
            name: targetName,
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

    const addTriggerToPrompt = (trigger: string) => {
        setParams(prev => {
            const currentPrompt = prev.prompt || "";
            // Check if trigger exists (simple check, could be improved with regex for exact word boundaries)
            if (currentPrompt.includes(trigger)) {
                // Remove it
                const newPrompt = currentPrompt
                    .replace(trigger, '')
                    .replace(/,\s*,/g, ',') // cleanup double commas
                    .replace(/^,\s*/, '')   // cleanup start comma
                    .replace(/,\s*$/, '')   // cleanup end comma
                    .trim();
                return { ...prev, prompt: newPrompt };
            } else {
                // Add it
                const separator = currentPrompt.trim().length > 0 ? ", " : "";
                return {
                    ...prev,
                    prompt: `${currentPrompt.trim()}${separator}${trigger}`
                };
            }
        });
    };

    return {
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
    };
};
