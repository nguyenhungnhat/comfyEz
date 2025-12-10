
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, RotateCcw, Trash2, Loader2 } from 'lucide-react';
import { HistoryItem } from '../../types';

interface HistoryViewProps {
  isActive: boolean;
  history: HistoryItem[];
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
  onSelect: (item: HistoryItem) => void;
  onOpenModal: (item: HistoryItem) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ 
  isActive, 
  history, 
  onDeleteHistory, 
  onClearHistory,
  onSelect,
  onOpenModal
}) => {
  const [displayCount, setDisplayCount] = useState(20);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset pagination when switching tabs (optional, but good for consistent UX)
  useEffect(() => {
    if (!isActive) {
      // Optional: setDisplayCount(20); 
    }
  }, [isActive]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
           setDisplayCount(prev => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [history.length]);

  const visibleHistory = useMemo(() => history.slice(0, displayCount), [history, displayCount]);

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDeleteHistory(id);
  };

  const handleClearAll = () => {
      if (window.confirm("Are you sure you want to delete ALL history items? This action cannot be undone.")) {
          onClearHistory();
      }
  };

  return (
    <div className={`absolute inset-0 overflow-y-auto p-6 pt-20 transition-opacity duration-300 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
         
         {/* Header */}
         {history.length > 0 && (
             <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center border-b border-zinc-800 pb-4">
                 <div className="flex items-center gap-2">
                     <Clock className="text-zinc-500" size={20} />
                     <h2 className="text-lg font-bold text-zinc-300">Generation History</h2>
                     <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                         {history.length} items
                     </span>
                 </div>
                 <button 
                    onClick={handleClearAll}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-red-900/30 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-800 rounded text-xs font-medium transition-all"
                 >
                     <Trash2 size={14} /> Clear All
                 </button>
             </div>
         )}

         {history.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-zinc-500 pb-20">
                 <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                    <Clock size={32} className="opacity-30" />
                 </div>
                 <p className="text-lg font-medium text-zinc-400">No history yet</p>
                 <p className="text-sm opacity-50">Generated images will appear here.</p>
             </div>
         ) : (
             <div className="max-w-7xl mx-auto pb-10">
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                     {visibleHistory.map(item => (
                         <div 
                             key={item.id} 
                             onClick={() => onOpenModal(item)}
                             className="group relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-500 transition-all cursor-pointer shadow-sm hover:shadow-xl"
                         >
                             <img 
                                src={item.imageUrl} 
                                alt="History item" 
                                loading="lazy"
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity bg-zinc-950"
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-end p-3">
                                 <p className="text-[10px] text-zinc-400 font-mono mb-1">
                                     {new Date(item.timestamp).toLocaleDateString()}
                                 </p>
                                 <p className="text-xs text-white line-clamp-2 mb-3 bg-black/50 p-1.5 rounded backdrop-blur-sm border border-white/10">
                                     {item.params.prompt}
                                 </p>
                                 
                                 <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded flex items-center justify-center gap-1 font-medium shadow-lg"
                                        title="Restore Parameters"
                                     >
                                         <RotateCcw size={12} /> Load
                                     </button>
                                     <button 
                                        onClick={(e) => deleteHistoryItem(e, item.id)}
                                        className="p-1.5 bg-zinc-800 hover:bg-red-600/80 text-white rounded transition-colors border border-zinc-700 hover:border-red-500"
                                        title="Delete"
                                    >
                                         <Trash2 size={12} />
                                     </button>
                                 </div>
                             </div>
                             {/* Variant Indicator */}
                             {item.params.variants && item.params.variants.some(v => v.selected.length > 0) && (
                                 <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 ring-2 ring-black/50"></div>
                             )}
                         </div>
                     ))}
                 </div>
                 
                 {/* Sentinel for Infinite Scroll */}
                 {visibleHistory.length < history.length && (
                     <div ref={observerTarget} className="flex justify-center items-center py-8">
                         <div className="flex items-center gap-2 text-zinc-500 text-xs bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                             <Loader2 size={14} className="animate-spin" /> Loading more...
                         </div>
                     </div>
                 )}
             </div>
         )}
    </div>
  );
};

export default HistoryView;
