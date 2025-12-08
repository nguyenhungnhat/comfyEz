

import React from 'react';
import { Clock, Paintbrush, Image as ImageIcon } from 'lucide-react';

interface TopBarProps {
  activeTab: 'canvas' | 'history' | 'inpainting';
  setActiveTab: (tab: 'canvas' | 'history' | 'inpainting') => void;
}

const TopBar: React.FC<TopBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-full p-1 flex gap-1 pointer-events-auto shadow-xl">
            <button
               onClick={() => setActiveTab('canvas')}
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                   activeTab === 'canvas' 
                   ? 'bg-zinc-800 text-white shadow-sm' 
                   : 'text-zinc-400 hover:text-zinc-200'
               }`}
            >
                <ImageIcon size={14} /> Canvas
            </button>
            <button
               onClick={() => setActiveTab('inpainting')}
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                   activeTab === 'inpainting' 
                   ? 'bg-zinc-800 text-white shadow-sm' 
                   : 'text-zinc-400 hover:text-zinc-200'
               }`}
            >
                <Paintbrush size={14} /> Inpainting
            </button>
            <button
               onClick={() => setActiveTab('history')}
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                   activeTab === 'history' 
                   ? 'bg-zinc-800 text-white shadow-sm' 
                   : 'text-zinc-400 hover:text-zinc-200'
               }`}
            >
                <Clock size={14} /> History
            </button>
        </div>
    </div>
  );
};

export default TopBar;