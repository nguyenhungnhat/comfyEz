
import React from 'react';
import { Eraser, Brush, RotateCcw, Eye, EyeOff, Maximize, Hand, Undo, Redo, Download } from 'lucide-react';
import { InpaintingToolbarProps } from './types';

const InpaintingToolbar: React.FC<InpaintingToolbarProps> = ({
    brushSize, setBrushSize,
    feather, setFeather,
    isErasing, setIsErasing,
    showMask, setShowMask,
    isSpacePressed,
    canUndo, canRedo,
    onUndo, onRedo,
    onDownloadMask, onClearMask, onResetView
}) => {
    return (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-3 bg-zinc-900/90 backdrop-blur border border-zinc-700 p-3 rounded-2xl shadow-2xl transition-all w-full max-w-4xl animate-in slide-in-from-top-2">
             
             {/* Mode Indicator */}
             <div className="flex items-center gap-2 border-r border-zinc-700 pr-3 mr-1">
                 {isSpacePressed ? (
                     <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold uppercase animate-pulse px-2">
                        <Hand size={14} /> Pan Mode
                     </div>
                 ) : (
                     <div className="flex items-center gap-1 text-xs text-blue-400 font-bold uppercase px-2">
                        <Brush size={14} /> Draw
                     </div>
                 )}
             </div>
             
             {/* History */}
             <div className="flex items-center gap-1 border-r border-zinc-700 pr-3">
                 <button onClick={onUndo} disabled={!canUndo} className="p-2 rounded hover:bg-zinc-700 disabled:opacity-30 text-zinc-300" title="Undo (Ctrl+Z)">
                    <Undo size={16} />
                 </button>
                 <button onClick={onRedo} disabled={!canRedo} className="p-2 rounded hover:bg-zinc-700 disabled:opacity-30 text-zinc-300" title="Redo (Ctrl+Y)">
                    <Redo size={16} />
                 </button>
             </div>

             {/* Tools */}
             <div className="flex items-center gap-2 border-r border-zinc-700 pr-3">
                 <button 
                    onClick={() => setIsErasing(false)}
                    className={`p-2 rounded-lg hover:bg-zinc-700 transition-colors ${!isErasing ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/20' : 'text-zinc-400'}`}
                    title="Brush"
                 >
                     <Brush size={16} />
                 </button>
                 <button 
                    onClick={() => setIsErasing(true)}
                    className={`p-2 rounded-lg hover:bg-zinc-700 transition-colors ${isErasing ? 'bg-zinc-700 text-white shadow-inner' : 'text-zinc-400'}`}
                    title="Eraser"
                 >
                     <Eraser size={16} />
                 </button>
             </div>

             {/* Size */}
             <div className="flex flex-col w-32 px-2 border-r border-zinc-700">
                 <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase mb-1">
                     <span>Brush Size</span>
                     <span>{brushSize}px</span>
                 </div>
                 <input 
                    type="range" 
                    min="5" 
                    max="200" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                 />
             </div>

             {/* Feather */}
             <div className="flex flex-col w-32 px-2">
                 <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase mb-1">
                     <span>Feather</span>
                     <span>{feather}px</span>
                 </div>
                 <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={feather} 
                    onChange={(e) => setFeather(parseInt(e.target.value))}
                    className="h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                 />
             </div>

             {/* Actions */}
             <div className="border-l border-zinc-700 pl-3 flex gap-1">
                 <button 
                    onClick={() => setShowMask(!showMask)}
                    className={`p-2 rounded-lg hover:bg-zinc-700 transition-colors ${!showMask ? 'text-zinc-600' : 'text-yellow-400 hover:text-yellow-200'}`}
                    title="Toggle Mask Visibility"
                 >
                     {showMask ? <Eye size={16} /> : <EyeOff size={16} />}
                 </button>
                 <button 
                    onClick={onDownloadMask}
                    className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white"
                    title="Download Mask"
                 >
                     <Download size={16} />
                 </button>
                 <button 
                    onClick={onClearMask}
                    className="p-2 rounded-lg hover:bg-red-900/50 text-zinc-400 hover:text-red-400"
                    title="Clear Mask"
                 >
                     <RotateCcw size={16} />
                 </button>
                 <button 
                    onClick={onResetView}
                    className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white"
                    title="Fit View"
                 >
                     <Maximize size={16} />
                 </button>
             </div>
        </div>
    );
};

export default InpaintingToolbar;
