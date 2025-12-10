import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Sparkles, Trash2, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { Variant, VariantOption } from '../../types';

interface VariantItemProps {
  variant: Variant;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onToggleOption: (option: string) => void;
  onUpdatePrompt: (val: string) => void;
  // Selection Mode Props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

const resolveOption = (opt: string | VariantOption) => {
    if (typeof opt === 'string') {
        return { name: opt, emoji: null, description: null };
    }
    return opt;
};

const VariantItem: React.FC<VariantItemProps> = ({
  variant,
  isCollapsed,
  onToggleCollapse,
  onRemove,
  onToggleOption,
  onUpdatePrompt,
  isSelectionMode,
  isSelected,
  onToggleSelection
}) => {
    
  const renderIcon = (iconName?: string) => {
      if (!iconName) return <Sparkles size={14} className="text-purple-400" />;
      const IconComponent = (LucideIcons as any)[iconName];
      return IconComponent ? <IconComponent size={14} className="text-purple-400" /> : <Sparkles size={14} className="text-purple-400" />;
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
      if (isSelectionMode && onToggleSelection) {
          onToggleSelection();
      } else {
          onToggleCollapse();
      }
  };

  return (
    <div className={`bg-zinc-950 border rounded-lg overflow-hidden shadow-sm transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-zinc-800'}`}>
        <div 
                className="sticky top-0 z-10 px-3 py-2 bg-zinc-800 border-b border-zinc-800 flex justify-between items-center cursor-pointer select-none group"
                onClick={handleHeaderClick}
        >
            <div className="flex items-center gap-2 overflow-hidden">
                {isSelectionMode ? (
                     <div className={`shrink-0 ${isSelected ? 'text-blue-400' : 'text-zinc-500'}`}>
                         {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                     </div>
                ) : (
                     isCollapsed ? <ChevronRight size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />
                )}
                
                <div className="flex items-center gap-1.5 overflow-hidden">
                    {renderIcon(variant.icon)}
                    <span className="font-semibold text-zinc-300 text-xs truncate group-hover:text-white transition-colors" title={variant.title}>{variant.title}</span>
                </div>
                {variant.selected.length > 0 && (
                    <span className="ml-1 text-[10px] bg-blue-900 text-blue-200 px-1.5 rounded-full">{variant.selected.length}</span>
                )}
            </div>
            {!isSelectionMode && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 p-1"
                    title="Remove Variant"
                >
                    <Trash2 size={12} />
                </button>
            )}
        </div>
        
        {!isCollapsed && !isSelectionMode && (
            <div className="p-2 animate-in slide-in-from-top-1 fade-in duration-200">
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {variant.options.map((opt, idx) => {
                        const { name, emoji, description } = resolveOption(opt);
                        const isSelected = variant.selected.includes(name);
                        return (
                            <button
                                key={idx}
                                onClick={() => onToggleOption(name)}
                                className={`px-2 py-1 text-[10px] rounded-full border transition-all flex items-center gap-1 max-w-full truncate ${
                                    isSelected
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-900/20'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                                }`}
                                title={description || name}
                            >
                                {emoji && <span className="opacity-90">{emoji}</span>}
                                <span className="truncate">{name}</span>
                            </button>
                        );
                    })}
                </div>
                <input
                    type="text"
                    value={variant.customPrompt}
                    onChange={(e) => onUpdatePrompt(e.target.value)}
                    placeholder="Add custom text..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1.5 text-[10px] text-zinc-300 focus:border-zinc-600 outline-none placeholder-zinc-700"
                />
            </div>
        )}
    </div>
  );
};

export default VariantItem;