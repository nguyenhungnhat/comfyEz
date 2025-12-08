import React from 'react';
import { Search } from 'lucide-react';
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
}

const VariantList: React.FC<VariantListProps> = ({
  variants,
  searchTerm,
  setSearchTerm,
  collapsedVariants,
  toggleCollapse,
  removeVariant,
  toggleOption,
  updateCustomPrompt
}) => {
    
  const resolveOption = (opt: string | VariantOption) => {
      if (typeof opt === 'string') {
          return { name: opt, emoji: null, description: null };
      }
      return opt;
  };

  const filteredVariants = variants.filter(v => 
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.options.some(o => resolveOption(o).name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-2 border-b border-zinc-800">
            <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2 text-zinc-500" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search variants..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 pl-8 pr-2 text-xs focus:border-zinc-600 outline-none"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3 relative">
            {variants.length === 0 && (
                <div className="text-center text-zinc-600 text-xs py-8">
                    No variants yet. <br/> Use AI to generate options.
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
                />
            ))}
        </div>
    </div>
  );
};

export default VariantList;