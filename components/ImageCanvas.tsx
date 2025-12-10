
import React, { useState, useEffect } from 'react';
import { GenerationParams, HistoryItem, AppSettings, QueueItem, CanvasImage } from '../types';
import HistoryModal from './HistoryModal';
import TopBar from './canvas/TopBar';
import CanvasView from './canvas/CanvasView';
import HistoryView from './canvas/HistoryView';
import PromptBar from './canvas/PromptBar';
import InpaintingEditor from './canvas/InpaintingEditor';

interface ImageCanvasProps {
  canvasImages: CanvasImage[];
  setCanvasImages: React.Dispatch<React.SetStateAction<CanvasImage[]>>;
  isProcessing: boolean;
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
  onGenerate: () => void;
  error?: string | null;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
  onSelectHistory: (item: HistoryItem) => void;
  settings: AppSettings;
  queue: QueueItem[];
  onRemoveFromQueue: (id: string) => void;
  onClearQueue: () => void;
  onReorderQueue: (d: number, h: number) => void;
  addToCurrent: boolean;
  setAddToCurrent: (v: boolean) => void;
  supportedFeatures?: string[];
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ 
  canvasImages,
  setCanvasImages,
  isProcessing, 
  params, 
  setParams,
  onGenerate, 
  error,
  history,
  setHistory,
  onRemoveHistory,
  onClearHistory,
  onSelectHistory,
  settings,
  queue,
  onRemoveFromQueue,
  onClearQueue,
  onReorderQueue,
  addToCurrent,
  setAddToCurrent,
  supportedFeatures = ['txt2img', 'img2img']
}) => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'history' | 'inpainting'>('canvas');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  const restoreHistoryItem = (item: HistoryItem) => {
      onSelectHistory(item);
      setActiveTab('canvas');
      setSelectedHistoryItem(null); 
  };

  const setMask = (mask: string) => {
      setParams(prev => ({ ...prev, maskImage: mask }));
  };

  const handleInpaint = (image: CanvasImage) => {
      setParams(prev => ({ ...prev, inputImage: image.url }));
      setActiveTab('inpainting');
  };

  // const showInpainting = supportedFeatures.includes('inpainting');
  const showInpainting = false;
  
  // If inpainting tab is active but no longer supported, switch to canvas
  useEffect(() => {
      if (activeTab === 'inpainting' && !showInpainting) {
          setActiveTab('canvas');
      }
  }, [showInpainting, activeTab]);

  return (
    <div className="flex-1 h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-zinc-950 relative flex flex-col overflow-hidden">
      
      {/* Modify TopBar to conditionally show tabs */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
         <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-full p-1 flex gap-1 pointer-events-auto shadow-xl">
             <button
                 onClick={() => setActiveTab('canvas')}
                 className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'canvas' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
             >
                 Canvas
             </button>
             {showInpainting && (
                 <button
                     onClick={() => setActiveTab('inpainting')}
                     className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'inpainting' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                 >
                     Inpainting
                 </button>
             )}
             <button
                 onClick={() => setActiveTab('history')}
                 className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                 id="history-tab-btn"
             >
                 History
             </button>
         </div>
      </div>

      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }} 
      />

      {/* Tab Content */}
      <div className="flex-1 w-full h-full relative">
        <CanvasView 
            isActive={activeTab === 'canvas'}
            images={canvasImages}
            setImages={setCanvasImages}
            isProcessing={isProcessing}
            error={error}
            addToCurrent={addToCurrent}
            onInpaint={handleInpaint}
        />

        <HistoryView 
            isActive={activeTab === 'history'}
            history={history}
            onDeleteHistory={onRemoveHistory}
            onClearHistory={onClearHistory}
            onSelect={restoreHistoryItem}
            onOpenModal={setSelectedHistoryItem}
        />

        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'inpainting' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             {showInpainting ? (
                <InpaintingEditor 
                    image={params.inputImage || ''}
                    setMask={setMask}
                />
             ) : null}
        </div>
      </div>

      <PromptBar 
          isActive={activeTab !== 'history'} // Show prompt bar on Canvas and Inpainting
          params={params}
          setParams={setParams}
          onGenerate={onGenerate}
          settings={settings}
          queue={queue}
          queueActions={{
              remove: onRemoveFromQueue,
              clear: onClearQueue,
              reorder: onReorderQueue
          }}
          addToCurrent={addToCurrent}
          setAddToCurrent={setAddToCurrent}
          onClearCanvas={() => setCanvasImages([])}
      />

      <HistoryModal 
        item={selectedHistoryItem}
        onClose={() => setSelectedHistoryItem(null)}
      />

    </div>
  );
};

export default ImageCanvas;
