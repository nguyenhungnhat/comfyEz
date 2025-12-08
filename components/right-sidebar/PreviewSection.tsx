import React from 'react';
import { Copy } from 'lucide-react';

interface PreviewSectionProps {
  combinedPreview: string;
}

const PreviewSection: React.FC<PreviewSectionProps> = ({ combinedPreview }) => {
  return (
    <div className="p-3 bg-zinc-950/50 border-b border-zinc-800">
        <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase text-zinc-500 font-semibold">Prompt Addition Preview</span>
            <button 
                onClick={() => navigator.clipboard.writeText(combinedPreview)}
                className="text-zinc-500 hover:text-white"
                title="Copy to clipboard"
            >
                <Copy size={12} />
            </button>
        </div>
        <div className="text-xs text-zinc-400 italic min-h-[1.5em] break-words line-clamp-3 bg-zinc-900/30 p-2 rounded">
            {combinedPreview || "No variants selected..."}
        </div>
    </div>
  );
};

export default PreviewSection;