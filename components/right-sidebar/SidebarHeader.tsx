import React, { useRef } from 'react';
import { Sparkles, Settings, Download, Upload } from 'lucide-react';

interface SidebarHeaderProps {
  onOpenSettings: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onOpenSettings, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
      onImport(e);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 text-xs">
            <Sparkles size={14} className="text-purple-400" />
            Advanced Variants
        </h2>
        <div className="flex gap-1">
            <button 
                onClick={onOpenSettings}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                title="Generator Settings"
            >
                <Settings size={14} />
            </button>
            <button onClick={onExport} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Export Variants">
                <Download size={14} />
            </button>
            <label className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer" title="Import Variants">
                <Upload size={14} />
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportClick} />
            </label>
        </div>
    </div>
  );
};

export default SidebarHeader;