

import React, { useState, useRef, useEffect } from 'react';
import { Download, Image as ImageIcon, AlertCircle, Maximize, X, Paintbrush } from 'lucide-react';
import { CanvasImage } from '../../types';
import { downloadImage } from '../../utils';

interface CanvasViewProps {
  isActive: boolean;
  images: CanvasImage[];
  setImages: React.Dispatch<React.SetStateAction<CanvasImage[]>>;
  isProcessing: boolean;
  error?: string | null;
  addToCurrent: boolean;
  onInpaint: (image: CanvasImage) => void;
}

const CanvasView: React.FC<CanvasViewProps> = ({ 
  isActive, 
  images, 
  setImages, 
  isProcessing, 
  error,
  addToCurrent,
  onInpaint
}) => {
  // Pan/Zoom State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom only on first load or manual trigger
  useEffect(() => {
      if (images.length > 0 && images.length <= 4 && scale === 1 && position.x === 0 && position.y === 0) {
          fitContent();
      }
  }, [images.length]);

  const fitContent = () => {
      setScale(0.8);
      setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (!isActive) return;
      e.stopPropagation(); 
      const zoomSensitivity = 0.001;
      const newScale = Math.max(0.1, Math.min(5, scale - e.deltaY * zoomSensitivity));
      setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!isActive) return;
      if (e.button === 0) { // Left click
          setIsDragging(true);
          setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          setPosition({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y
          });
      }
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  // Drag and Drop for Canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isActive) return;
    
    const files = Array.from(e.dataTransfer.files) as File[];
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (validFiles.length > 0) {
        const newImages = validFiles.map(f => ({
            id: Date.now() + Math.random().toString(),
            url: URL.createObjectURL(f),
            width: 512, 
            height: 512
        }));
        
        setImages(prev => addToCurrent ? [...prev, ...newImages] : newImages);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  return (
    <div 
        ref={containerRef}
        className={`absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing transition-opacity duration-300 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
    >
         
        {/* Error State */}
        {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 bg-red-900/50 border border-red-500/50 rounded-xl p-6 max-w-md text-center backdrop-blur-md shadow-2xl animate-in slide-in-from-top-4 pointer-events-auto">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-200 mb-2">Generation Failed</h3>
            <p className="text-red-300 text-sm">{error}</p>
        </div>
        )}

        {/* Empty State */}
        {images.length === 0 && !isProcessing && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-700 flex-col select-none pointer-events-none">
            <div className="w-24 h-24 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center mb-6">
            <ImageIcon size={48} className="opacity-50" />
            </div>
            <p className="text-lg font-medium text-zinc-500">Ready to create</p>
            <div className="text-xs text-zinc-600 mt-2">Drag & drop images here or generate</div>
        </div>
        )}

        {/* Loading Overlay */}
        {isProcessing && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-700 select-none pointer-events-auto shadow-xl">
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-blue-200 font-mono text-xs">
            Generating...
            </p>
        </div>
        )}

        {/* Multi-Image Content */}
        <div 
            className="absolute w-full h-full flex items-center justify-center pointer-events-none"
            style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
        >
            {/* Free Flow Flex Layout */}
            <div className="flex flex-wrap gap-10 p-20 items-center justify-center pointer-events-auto">
                {images.map((img) => (
                    <div key={img.id} className="relative group shadow-2xl rounded-sm bg-zinc-900 ring-1 ring-white/10 hover:ring-white/30 transition-all flex-shrink-0">
                         <img 
                            src={img.url} 
                            alt="Generated output" 
                            width={img.width}
                            height={img.height}
                            style={{ maxWidth: 'none', height: 'auto' }}
                            className="bg-zinc-900/50 select-none object-contain rounded-sm"
                            draggable={false}
                        />
                        {/* Hover Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); onInpaint(img); }}
                                className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded backdrop-blur-sm"
                                title="Move to Inpaint"
                            >
                                <Paintbrush size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); downloadImage(img.url); }}
                                className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded backdrop-blur-sm"
                                title="Download"
                            >
                                <Download size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter(p => p.id !== img.id)); }}
                                className="p-1.5 bg-black/60 hover:bg-red-900/80 text-white rounded backdrop-blur-sm"
                                title="Remove"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Reset View Button */}
        {images.length > 0 && (
            <button
                onClick={(e) => { e.stopPropagation(); fitContent(); }}
                className="absolute top-20 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur text-white rounded border border-white/10 z-20 pointer-events-auto"
                title="Reset View"
            >
                <Maximize size={16} />
            </button>
        )}
    </div>
  );
};

export default CanvasView;