
import { useState, useEffect } from 'react';
import { AppSettings, GenerationParams, Variant } from '../types';
import { generateVariants } from '../services/llmService';
import { VARIANT_ICONS } from '../constants';

export const PRESETS = [
    "Lighting Styles", "Camera Angles", "Artistic Styles", "Color Palettes", 
    "Textures", "Character Emotions", "Environments"
];

export const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for an image generation tool. 
Your task is to generate a JSON object containing variant categories based on the user's request.

Each variant should have:
- 'title': The name of the category (e.g., "Lighting", "Style").
- 'options': A list of options. Each option should be an object:
  {
    "name": "option keyword",
    "emoji": "emoji char (optional)",
    "description": "short description (max 2 lines, optional)"
  }
- 'icon': Choose ONE icon name from this list: [${VARIANT_ICONS.join(', ')}]. Default "Sparkles".

The structure must be strictly JSON:
{
  "variants": [
    { 
      "title": "Lighting", 
      "icon": "Sun",
      "options": [
         { "name": "Soft Light", "emoji": "☁️", "description": "Diffused, shadowless light" },
         { "name": "Hard Light", "emoji": "☀️", "description": "Sharp shadows and high contrast" }
      ] 
    }
  ]
}
Return ONLY the JSON string.`;

export const useRightSidebar = (
  settings: AppSettings, 
  params: GenerationParams, 
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>
) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedVariants, setCollapsedVariants] = useState<Set<string>>(new Set());
  const [isSingleMode, setIsSingleMode] = useState(true);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState(() => {
      return localStorage.getItem('comfy_variant_system_prompt') || DEFAULT_SYSTEM_PROMPT;
  });

  useEffect(() => {
      localStorage.setItem('comfy_variant_system_prompt', systemInstruction);
  }, [systemInstruction]);

  const handleGenerateVariants = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
        const newVariants = await generateVariants(
            settings.llm.host,
            settings.llm.apiKey,
            settings.llm.model,
            prompt,
            isSingleMode,
            systemInstruction
        );
        setParams(prev => ({
            ...prev,
            variants: [...newVariants, ...prev.variants]
        }));
        setShowSettings(false);
    } catch (e: any) {
        setError(e.message || "Failed to generate variants");
    } finally {
        setIsLoading(false);
    }
  };

  const removeVariant = (id: string) => {
    setParams(prev => ({
        ...prev,
        variants: prev.variants.filter(v => v.id !== id)
    }));
  };

  const toggleOption = (variantId: string, optionValue: string) => {
    setParams(prev => ({
        ...prev,
        variants: prev.variants.map(v => {
            if (v.id !== variantId) return v;
            const isSelected = v.selected.includes(optionValue);
            return {
                ...v,
                selected: isSelected 
                    ? v.selected.filter(o => o !== optionValue)
                    : [...v.selected, optionValue]
            };
        })
    }));
  };

  const updateCustomPrompt = (variantId: string, text: string) => {
     setParams(prev => ({
        ...prev,
        variants: prev.variants.map(v => v.id === variantId ? { ...v, customPrompt: text } : v)
     }));
  };

  const handleExport = () => {
      const dataStr = JSON.stringify(params.variants, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `variants-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const imported = JSON.parse(event.target?.result as string) as Variant[];
              if (Array.isArray(imported)) {
                  setParams(prev => ({
                      ...prev,
                      variants: [...imported, ...prev.variants]
                  }));
              }
          } catch (err) {
              console.error("Failed to parse variants", err);
              setError("Invalid JSON file");
          }
      };
      reader.readAsText(file);
  };

  const toggleCollapse = (id: string) => {
      const newSet = new Set(collapsedVariants);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setCollapsedVariants(newSet);
  };

  const combinedPreview = params.variants
      .filter(v => v.selected.length > 0 || v.customPrompt)
      .map(v => {
          const parts = [];
          if (v.selected.length > 0) {
              parts.push(`${v.title}: ${v.selected.join(', ')}`);
          }
          if (v.customPrompt) parts.push(v.customPrompt);
          return parts.join(', ');
      })
      .join(', ');

  return {
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
  };
};
