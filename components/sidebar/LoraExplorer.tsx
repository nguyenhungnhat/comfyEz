
import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Star, Edit2, Grid, Upload, FolderOpen } from 'lucide-react';
import { Lora } from '../../types';

interface LoraExplorerProps {
    isOpen: boolean;
    onClose: () => void;
    library: Lora[];
    activeLoras: Lora[];
    onToggleActive: (loraName: string) => void;
    onUpdateMetadata: (name: string, updates: Partial<Lora>) => void;
    onAddTrigger: (trigger: string) => void;
}

const LoraExplorer: React.FC<LoraExplorerProps> = ({
    isOpen,
    onClose,
    library,
    activeLoras,
    onToggleActive,
    onUpdateMetadata,
    onAddTrigger
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draggedLora, setDraggedLora] = useState<string | null>(null);
    
    // Edit Form State
    const [editTrigger, setEditTrigger] = useState("");
    const [editCategory, setEditCategory] = useState("");

    // Derive Categories
    const categories = useMemo(() => {
        const cats = new Set<string>(["All", "Favorites"]);
        library.forEach(l => {
            if (l.category && l.category !== "Uncategorized") cats.add(l.category);
        });
        cats.add("Uncategorized");
        return Array.from(cats);
    }, [library]);

    // Filter Logic
    const filteredLoras = useMemo(() => {
        return library.filter(l => {
            const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesCategory = true;
            if (selectedCategory === "Favorites") matchesCategory = !!l.isFavorite;
            else if (selectedCategory === "Uncategorized") matchesCategory = !l.category || l.category === "Uncategorized";
            else if (selectedCategory !== "All") matchesCategory = l.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [library, searchTerm, selectedCategory]);

    const startEditing = (lora: Lora) => {
        setEditingId(lora.name);
        setEditTrigger(lora.triggerKey || "");
        setEditCategory(lora.category === "Uncategorized" ? "" : lora.category || "");
    };

    const saveEditing = (loraName: string) => {
        onUpdateMetadata(loraName, {
            triggerKey: editTrigger,
            category: editCategory || "Uncategorized"
        });
        setEditingId(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, loraName: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    onUpdateMetadata(loraName, { previewImage: ev.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Drag and Drop Logic ---
    const handleDragStart = (e: React.DragEvent, loraName: string) => {
        setDraggedLora(loraName);
        e.dataTransfer.setData("text/plain", loraName);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
    };

    const handleDropOnCategory = (e: React.DragEvent, category: string) => {
        e.preventDefault();
        const loraName = e.dataTransfer.getData("text/plain");
        if (loraName && category !== "All" && category !== "Favorites") {
            onUpdateMetadata(loraName, { category: category });
        }
    };

    // Use Portal to break out of sidebar overflow
    return createPortal(
        <div 
            className={`fixed left-80 top-0 bottom-0 bg-zinc-950 border-r border-zinc-800 shadow-2xl z-[80] transition-all duration-300 flex flex-col ${
                isOpen ? 'w-[420px] translate-x-0 opacity-100' : 'w-0 -translate-x-10 opacity-0 pointer-events-none'
            }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex flex-col gap-3 bg-zinc-900 shrink-0">
                <div className="flex justify-between items-center">
                     <h3 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                        Library <span className="text-zinc-600 text-xs font-normal">({filteredLoras.length})</span>
                     </h3>
                     <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white">
                         <X size={16} />
                     </button>
                </div>
                
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search models..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Categories Bar (Top) */}
            <div className="w-full bg-zinc-950 border-b border-zinc-800 flex items-center overflow-x-auto scrollbar-hide shrink-0 p-2 gap-1.5 no-scrollbar">
                {categories.map(cat => (
                    <div
                        key={cat}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnCategory(e, cat)}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap border shrink-0 ${
                            selectedCategory === cat 
                            ? 'bg-zinc-800 border-zinc-600 text-blue-300 shadow-sm' 
                            : 'border-transparent bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 hover:border-zinc-800'
                        }`}
                    >
                        {cat === "Favorites" && <Star size={10} className={selectedCategory === cat ? "text-yellow-400 fill-yellow-400" : ""} />}
                        <span className="font-medium">{cat}</span>
                    </div>
                ))}
            </div>

            {/* LoRA Grid */}
            <div className="flex-1 overflow-y-auto p-3 bg-zinc-900/50 min-w-0">
                <div className="grid grid-cols-2 gap-3">
                    {filteredLoras.map(lora => {
                        const isActive = activeLoras.some(l => l.name === lora.name);
                        const isEditing = editingId === lora.name;
                        const isDragging = draggedLora === lora.name;

                        if (isEditing) {
                            return (
                                <div key={lora.name} className="col-span-2 bg-zinc-900 border border-blue-500/30 rounded-lg p-3 space-y-3 shadow-lg">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800">
                                        <Edit2 size={14} className="text-blue-400" />
                                        <span className="text-xs font-bold text-zinc-300 truncate">{lora.name}</span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Trigger Key</label>
                                        <input 
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
                                            value={editTrigger}
                                            onChange={e => setEditTrigger(e.target.value)}
                                            placeholder="e.g. <lora:mysketch:1>"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Category</label>
                                        <input 
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
                                            value={editCategory}
                                            onChange={e => setEditCategory(e.target.value)}
                                            placeholder="Type to create new..."
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => saveEditing(lora.name)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded py-1.5 text-xs">Save</button>
                                        <button onClick={() => setEditingId(null)} className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded py-1.5 text-xs">Cancel</button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={lora.name}
                                draggable
                                onDragStart={(e) => handleDragStart(e, lora.name)}
                                className={`group relative bg-zinc-950 border rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:shadow-xl hover:border-zinc-600 ${
                                    isActive ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-zinc-800'
                                } ${isDragging ? 'opacity-50' : ''}`}
                            >
                                {/* Preview */}
                                <div className="aspect-square relative bg-zinc-900 group-hover:opacity-90 transition-opacity">
                                    {lora.previewImage ? (
                                        <img src={lora.previewImage} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 p-4 text-center">
                                            <Grid size={24} className="mb-2" />
                                        </div>
                                    )}
                                    
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                        <div className="flex justify-end gap-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onUpdateMetadata(lora.name, { isFavorite: !lora.isFavorite }); }}
                                                className={`p-1.5 rounded-full backdrop-blur ${lora.isFavorite ? 'bg-yellow-500/20 text-yellow-400' : 'bg-black/40 text-zinc-400 hover:text-white'}`}
                                            >
                                                <Star size={12} fill={lora.isFavorite ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); startEditing(lora); }}
                                                className="p-1.5 rounded-full bg-black/40 backdrop-blur text-zinc-400 hover:text-white"
                                                title="Edit Metadata"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>

                                        <label className="cursor-pointer self-center bg-black/50 hover:bg-black/70 text-white text-[9px] px-2 py-1 rounded-full backdrop-blur border border-white/10 flex items-center gap-1 transition-all">
                                            <Upload size={10} /> Change Img
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, lora.name)} />
                                        </label>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-2.5 flex flex-col gap-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="text-[10px] font-medium text-zinc-300 line-clamp-2 leading-tight" title={lora.name}>
                                            {lora.name.replace(/\.(safetensors|pt)$/i, '')}
                                        </h4>
                                        <button 
                                            onClick={() => onToggleActive(lora.name)}
                                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                                isActive ? 'bg-blue-600 border-blue-500 text-white' : 'border-zinc-600 hover:border-zinc-400'
                                            }`}
                                        >
                                            {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50">
                                            <span className="text-[9px] text-zinc-600 truncate max-w-[60px]">{lora.category || "Uncat."}</span>
                                            {lora.triggerKey && (
                                                <button 
                                                onClick={() => onAddTrigger(lora.triggerKey!)}
                                                className="text-[9px] font-mono text-blue-400 bg-blue-900/10 px-1 rounded hover:bg-blue-900/30 transition-colors truncate max-w-[70px]"
                                                title={`Inject: ${lora.triggerKey}`}
                                                >
                                                    {lora.triggerKey}
                                                </button>
                                            )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {filteredLoras.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
                        <Grid size={32} className="mb-2 opacity-20" />
                        <p className="text-xs">No models found</p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default LoraExplorer;
