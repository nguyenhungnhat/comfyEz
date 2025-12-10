import React, { useState, useMemo } from 'react';
import { Search, FolderEdit, CheckSquare, X, ChevronRight, Save, Plus } from 'lucide-react';
import { Variant, VariantOption } from '../../types';
import VariantItem from './VariantItem';

interface VariantListProps {
  variants: Variant[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  collapsedVariants: Set<string>;
  toggleCollapse: (id: string) => void;
  removeVariant: (id: string) => void;
  toggleOption: (variantId: string, option: string) => void;
  updateCustomPrompt: (variantId: string, text: string) => void;
  onUpdateCategory: (variantIds: string[], newCategory: string) => void;
}

const VariantList: React.FC<VariantListProps> = ({
  variants,
  searchTerm,
  setSearchTerm,
  collapsedVariants,
  toggleCollapse,
  removeVariant,
  toggleOption,
  updateCustomPrompt,
  onUpdateCategory
}) => {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isCategorizeMode, setIsCategorizeMode] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [newCategoryName, setNewCategoryName] = useState("");
  
  const resolveOption = (opt: string | VariantOption) => {
      if (typeof opt === 'string') {
          return { name: opt, emoji: null, description: null };
      }
      return opt;
  };

  // Derive Categories
  const categories = useMemo(() => {
      const cats = new Set<string>(["All"]);
      variants.forEach(v => {
          cats.add(v.category || "General");
      });
      return Array.from(cats).sort();
  }, [variants]);

  // Filter Variants
  const filteredVariants = variants.filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.options.some(o => resolveOption(o).name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTab = activeTab === "All" || (v.category || "General") === activeTab;
      
      return matchesSearch && matchesTab;
  });

  const handleSelectionToggle = (id: string) => {
      const newSet = new Set(selectedVariantIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedVariantIds(newSet);
  };

  const applyCategory = (categoryName: string) => {
      if (selectedVariantIds.size === 0 || !categoryName.trim()) return;
      onUpdateCategory(Array.from(selectedVariantIds), categoryName.trim());
      setIsCategorizeMode(false);
      setSelectedVariantIds(new Set());
      setNewCategoryName("");
      // Optionally switch to new tab if it exists
      if(categories.includes(categoryName.trim())) {
          setActiveTab(categoryName.trim());
      }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Controls: Search & Edit Mode */}
        <div className="p-2 border-b border-zinc-800 flex gap-2">
            <div className="relative flex-1">
                <Search size={12} className="absolute left-2.5 top-2 text-zinc-500" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 pl-8 pr-2 text-xs focus:border-zinc-600 outline-none"
                />
            </div>
            <button 
                onClick={() => { setIsCategorizeMode(!isCategorizeMode); setSelectedVariantIds(new Set()); }}
                className={`p-1.5 rounded border transition-colors ${
                    isCategorizeMode 
                    ? 'bg-blue-900/20 border-blue-500 text-blue-300' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title="Organize Categories"
            >
                <FolderEdit size={14} />
            </button>
        </div>

        {/* Categories Tab Bar */}
        {!isCategorizeMode && (
             <div className="w-full bg-zinc-950 border-b border-zinc-800 flex items-center overflow-x-auto scrollbar-hide shrink-0 px-2 py-1.5 gap-1.5">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full whitespace-nowrap border shrink-0 transition-colors ${
                            activeTab === cat 
                            ? 'bg-zinc-800 border-zinc-600 text-white' 
                            : 'border-transparent bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        )}

        {/* Bulk Categorize Bar */}
        {isCategorizeMode && (
            <div className="p-2 bg-blue-900/10 border-b border-blue-500/20 flex flex-col gap-2 animate-in slide-in-from-top-1">
                <div className="flex justify-between items-center text-[10px] text-blue-300">
                    <span className="font-bold">{selectedVariantIds.size} Selected</span>
                    <button onClick={() => { setIsCategorizeMode(false); setSelectedVariantIds(new Set()); }} className="hover:text-white"><X size={12} /></button>
                </div>
                
                {/* Quick Select Buttons */}
                {categories.filter(c => c !== "All").length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1">
                         {categories.filter(c => c !== "All").map(cat => (
                             <button
                                key={cat}
                                onClick={() => applyCategory(cat)}
                                disabled={selectedVariantIds.size === 0}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] rounded transition-colors disabled:opacity-50"
                             >
                                 {cat}
                             </button>
                         ))}
                    </div>
                )}

                {/* New Category Input */}
                <div className="flex gap-1">
                    <input 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyCategory(newCategoryName)}
                        placeholder="Create New Category..."
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                    />
                    <button 
                        onClick={() => applyCategory(newCategoryName)}
                        disabled={selectedVariantIds.size === 0 || !newCategoryName.trim()}
                        className="px-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs disabled:opacity-50"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 relative">
            {variants.length === 0 && (
                <div className="text-center text-zinc-600 text-xs py-8">
                    No variants yet. <br/> Use AI to generate options.
                </div>
            )}
            
            {filteredVariants.length === 0 && variants.length > 0 && (
                <div className="text-center text-zinc-600 text-xs py-8">
                    No variants found in this category.
                </div>
            )}
            
            {filteredVariants.map((variant) => (
                <VariantItem 
                    key={variant.id}
                    variant={variant}
                    isCollapsed={collapsedVariants.has(variant.id)}
                    onToggleCollapse={() => toggleCollapse(variant.id)}
                    onRemove={() => removeVariant(variant.id)}
                    onToggleOption={(opt) => toggleOption(variant.id, opt)}
                    onUpdatePrompt={(val) => updateCustomPrompt(variant.id, val)}
                    isSelectionMode={isCategorizeMode}
                    isSelected={selectedVariantIds.has(variant.id)}
                    onToggleSelection={() => handleSelectionToggle(variant.id)}
                />
            ))}
        </div>
    </div>
  );
};

export default VariantList;