
import { useState, useEffect } from 'react';
import { WorkflowPreset } from '../types';
import { DEFAULT_PRESETS } from '../constants';

export const useWorkflows = () => {
    const [presets, setPresets] = useState<WorkflowPreset[]>(() => {
        const saved = localStorage.getItem('comfy_presets');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved presets", e);
            }
        }
        return DEFAULT_PRESETS;
    });

    const [activePresetId, setActivePresetId] = useState<string>(() => {
        return localStorage.getItem('comfy_active_preset') || DEFAULT_PRESETS[0].id;
    });

    useEffect(() => {
        localStorage.setItem('comfy_presets', JSON.stringify(presets));
    }, [presets]);

    useEffect(() => {
        localStorage.setItem('comfy_active_preset', activePresetId);
    }, [activePresetId]);

    const activePreset = presets.find(p => p.id === activePresetId) || presets[0];

    const addPreset = (preset: WorkflowPreset) => {
        setPresets(prev => [...prev, preset]);
        setActivePresetId(preset.id);
    };

    const updatePreset = (id: string, updates: Partial<WorkflowPreset>) => {
        setPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deletePreset = (id: string) => {
        if (presets.length <= 1) return; // Prevent deleting last
        const newPresets = presets.filter(p => p.id !== id);
        setPresets(newPresets);
        if (activePresetId === id) {
            setActivePresetId(newPresets[0].id);
        }
    };

    const replacePresets = (newPresets: WorkflowPreset[]) => {
        setPresets(newPresets);
        if (newPresets.length > 0) {
            setActivePresetId(newPresets[0].id);
        }
    };

    const resetPresets = () => {
        setPresets(DEFAULT_PRESETS);
        setActivePresetId(DEFAULT_PRESETS[0].id);
    };

    return {
        presets,
        activePreset,
        activePresetId,
        setActivePresetId,
        addPreset,
        updatePreset,
        deletePreset,
        replacePresets,
        resetPresets
    };
};