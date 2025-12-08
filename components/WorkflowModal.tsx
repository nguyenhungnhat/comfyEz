

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Upload, Download, Plus, Trash2, Edit2, Save, Copy, Info, AlertTriangle, FileJson, Archive, RotateCcw } from 'lucide-react';
import { WorkflowPreset, NodeMapping } from '../types';
import { DEFAULT_PRESETS } from '../constants';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: WorkflowPreset[];
  activePresetId: string;
  setActivePresetId: (id: string) => void;
  onAdd: (preset: WorkflowPreset) => void;
  onUpdate: (id: string, data: Partial<WorkflowPreset>) => void;
  onDelete: (id: string) => void;
  onOverwrite: (presets: WorkflowPreset[]) => void;
  onReset: () => void;
}

const MAPPING_FIELDS: (keyof NodeMapping)[] = [
    'promptNode', 'negativeNode', 'modelNode', 'imageSizeNode', 
    'seedNode', 'stepsNode', 'cfgNode', 'samplerNode', 'schedulerNode', 
    'previewNode', 'inputImageNode', 'maskNode', 'upscaleNode', 'upscalePreviewNode'
];

const DEFAULT_MAPPING: NodeMapping = {
    promptNode: "", negativeNode: "", modelNode: "", imageSizeNode: "",
    seedNode: "", stepsNode: "", cfgNode: "", samplerNode: "", schedulerNode: "",
    previewNode: ""
};

const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  onClose,
  presets,
  activePresetId,
  setActivePresetId,
  onAdd,
  onUpdate,
  onDelete,
  onOverwrite,
  onReset
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [mapping, setMapping] = useState<NodeMapping>(DEFAULT_PRESETS[0].mapping);
  const [description, setDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const importAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        const preset = presets.find(p => p.id === activePresetId) || presets[0];
        setJsonText(JSON.stringify(preset.workflow, null, 2));
        setMapping(preset.mapping);
        setDescription(preset.description || "");
        setRequirementsText((preset.requirements || []).join('\n'));
    }
  }, [isOpen, activePresetId, presets]);

  // Extract available nodes from the JSON text
  const availableNodes = useMemo(() => {
      try {
          const parsed = JSON.parse(jsonText);
          if (!parsed || typeof parsed !== 'object') return [];
          
          return Object.entries(parsed).map(([id, node]: [string, any]) => ({
              id,
              title: node._meta?.title || node.title || node.class_type || "Unknown Node",
              type: node.class_type
          })).sort((a, b) => {
              // Try to sort numerically if IDs are numbers, otherwise string sort
              const numA = parseInt(a.id);
              const numB = parseInt(b.id);
              return !isNaN(numA) && !isNaN(numB) ? numA - numB : a.id.localeCompare(b.id);
          });
      } catch (e) {
          return [];
      }
  }, [jsonText]);

  const handleJsonChange = (text: string) => {
      setJsonText(text);
      try {
          JSON.parse(text);
          setJsonError(null);
      } catch (e) {
          setJsonError("Invalid JSON");
      }
  };

  const saveCurrent = () => {
      if (jsonError) return;
      try {
          const parsed = JSON.parse(jsonText);
          onUpdate(activePresetId, {
              workflow: parsed,
              mapping: mapping,
              description: description,
              requirements: requirementsText.split('\n').filter(line => line.trim() !== '')
          });
      } catch (e) {
          setJsonError("Invalid JSON");
      }
  };

  const handleCreateNew = () => {
      const newPreset: WorkflowPreset = {
          id: Date.now().toString(),
          name: "New Workflow",
          workflow: {},
          mapping: { ...DEFAULT_MAPPING }
      };
      onAdd(newPreset);
  };

  const handleDuplicate = (e: React.MouseEvent, preset: WorkflowPreset) => {
      e.stopPropagation();
      const newPreset = { 
          ...preset, 
          id: Date.now().toString(), 
          name: `${preset.name} (Copy)` 
      };
      onAdd(newPreset);
  };

  const handleImportSingle = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const content = JSON.parse(ev.target?.result as string);
              let newPreset: WorkflowPreset;
              
              if (content.workflow && content.mapping) {
                  // It's a full preset export
                  newPreset = {
                      ...content,
                      id: Date.now().toString(),
                      name: content.name + " (Imported)"
                  };
              } else {
                  // It's a raw comfyui workflow json
                  newPreset = {
                      id: Date.now().toString(),
                      name: file.name.replace('.json', ''),
                      workflow: content,
                      mapping: { ...DEFAULT_MAPPING }
                  };
              }
              onAdd(newPreset);
              // clear input
              if (e.target) e.target.value = '';
          } catch (err) {
              alert("Failed to parse JSON file");
          }
      };
      reader.readAsText(file);
  };

  const handleExportActive = () => {
      const preset = presets.find(p => p.id === activePresetId);
      if (!preset) return;
      
      const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}-preset.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleExportAll = () => {
      const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comfyez-presets-all-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const content = JSON.parse(ev.target?.result as string);
              if (Array.isArray(content)) {
                  if (confirm("This will replace all current workflows. Are you sure?")) {
                      onOverwrite(content);
                  }
              } else {
                  alert("Invalid format. Expected an array of presets.");
              }
              if (e.target) e.target.value = '';
          } catch (err) {
              alert("Failed to parse JSON file");
          }
      };
      reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-6xl h-[85vh] flex shadow-2xl overflow-hidden">
        
        {/* Sidebar List */}
        <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-950">
            <div className="p-4 border-b border-zinc-800 flex flex-col gap-3">
                <h3 className="font-bold text-zinc-300">Workflows</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={handleCreateNew}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors"
                        title="New Workflow"
                    >
                        <Plus size={14} /> New
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors cursor-pointer" title="Import Single JSON">
                        <Upload size={14} /> Import
                        <input type="file" className="hidden" accept=".json" onChange={handleImportSingle} />
                    </label>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {presets.map(preset => (
                    <div 
                        key={preset.id}
                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            activePresetId === preset.id ? 'bg-blue-900/20 border border-blue-500/30' : 'hover:bg-zinc-900 border border-transparent'
                        }`}
                        onClick={() => setActivePresetId(preset.id)}
                    >
                        {editingId === preset.id ? (
                            <input 
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={() => { onUpdate(preset.id, { name: editName }); setEditingId(null); }}
                                onKeyDown={(e) => { if(e.key === 'Enter') { onUpdate(preset.id, { name: editName }); setEditingId(null); } }}
                                className="bg-zinc-800 text-xs px-1 py-0.5 rounded outline-none w-full"
                            />
                        ) : (
                            <span className={`text-sm truncate ${activePresetId === preset.id ? 'text-blue-200' : 'text-zinc-400'}`}>
                                {preset.name}
                            </span>
                        )}
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleDuplicate(e, preset)}
                                className="p-1 text-zinc-500 hover:text-white"
                                title="Duplicate"
                            >
                                <Copy size={12} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setEditingId(preset.id); setEditName(preset.name); }}
                                className="p-1 text-zinc-500 hover:text-white"
                                title="Rename"
                            >
                                <Edit2 size={12} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }}
                                className="p-1 text-zinc-500 hover:text-red-400"
                                title="Delete"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 border-t border-zinc-800 space-y-2">
                <button 
                    onClick={handleExportActive}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                >
                    <FileJson size={14} /> Export Active
                </button>
                 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/50">
                    <button 
                        onClick={handleExportAll}
                        className="flex items-center justify-center gap-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] transition-colors"
                        title="Download All Presets"
                    >
                        <Download size={12} /> Backup All
                    </button>
                    <label 
                        className="flex items-center justify-center gap-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] transition-colors cursor-pointer"
                        title="Restore All Presets"
                    >
                        <Archive size={12} /> Restore All
                        <input ref={importAllRef} type="file" className="hidden" accept=".json" onChange={handleImportAll} />
                    </label>
                 </div>

                 <button 
                    onClick={() => {
                        if (confirm("Are you sure you want to reset all workflows to defaults? Custom workflows will be lost.")) {
                            onReset();
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 rounded text-xs transition-colors"
                >
                    <RotateCcw size={14} /> Reset to Defaults
                </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                <div className="flex items-center gap-4">
                     <h2 className="text-lg font-bold text-white">Editor</h2>
                     {jsonError && <span className="text-xs text-red-500 bg-red-900/20 px-2 py-1 rounded border border-red-500/20">{jsonError}</span>}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={saveCurrent}
                        disabled={!!jsonError}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={14} /> Apply Changes
                    </button>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* JSON Editor */}
                <div className="flex-1 border-r border-zinc-800 flex flex-col min-w-0">
                    <div className="bg-zinc-950 p-2 border-b border-zinc-800 text-xs text-zinc-500 uppercase font-semibold tracking-wider">
                        Workflow JSON
                    </div>
                    <textarea 
                        value={jsonText}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        className="flex-1 w-full bg-zinc-950 text-zinc-300 font-mono text-xs p-4 resize-none focus:outline-none"
                        spellCheck={false}
                    />
                </div>

                {/* Configuration Column */}
                <div className="w-80 bg-zinc-900 flex flex-col overflow-y-auto border-l border-zinc-800 shrink-0">
                     
                     {/* Info Section */}
                     <div className="bg-zinc-950 p-2 border-b border-zinc-800 text-xs text-zinc-500 uppercase font-semibold tracking-wider flex items-center gap-2">
                        <Info size={12} /> Workflow Details
                    </div>
                    <div className="p-4 space-y-4 border-b border-zinc-800">
                        <div>
                            <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-300 focus:border-blue-500 outline-none resize-y min-h-[60px]"
                                placeholder="Describe what this workflow does..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1 flex items-center gap-1">
                                <AlertTriangle size={10} className="text-yellow-500" /> Requirements
                            </label>
                            <textarea
                                value={requirementsText}
                                onChange={e => setRequirementsText(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-300 focus:border-blue-500 outline-none resize-y min-h-[60px]"
                                placeholder="List required custom nodes (one per line)..."
                            />
                        </div>
                    </div>

                    {/* Mapping Section */}
                     <div className="bg-zinc-950 p-2 border-b border-zinc-800 text-xs text-zinc-500 uppercase font-semibold tracking-wider">
                        Node Mappings
                    </div>
                    <div className="p-4 space-y-4">
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Map specific parameters to the corresponding node in the workflow.
                        </p>
                        
                        {MAPPING_FIELDS.map((key) => {
                            const currentValue = (mapping as any)[key];
                            return (
                                <div key={key}>
                                    <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">
                                        {key.replace(/([A-Z])/g, ' $1').replace('Node', '').trim()}
                                    </label>
                                    <select 
                                        value={currentValue || ''} 
                                        onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs font-mono text-blue-300 focus:border-blue-500 outline-none"
                                    >
                                        <option value="" className="text-zinc-600">Select Node...</option>
                                        {availableNodes.map(node => (
                                            <option key={node.id} value={node.id}>
                                                {node.id} - {node.title}
                                            </option>
                                        ))}
                                        {currentValue && !availableNodes.find(n => n.id === currentValue) && (
                                            <option value={currentValue} disabled>
                                                {currentValue} (Missing)
                                            </option>
                                        )}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default WorkflowModal;