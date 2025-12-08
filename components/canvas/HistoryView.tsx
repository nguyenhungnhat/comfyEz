import React from 'react';
import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { HistoryItem } from '../../types';

interface HistoryViewProps {
  isActive: boolean;
  history: HistoryItem[];
  onDeleteHistory: (id: string) => void;
  onSelect: (item: HistoryItem) => void;
  onOpenModal: (item: HistoryItem) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ 
  isActive, 
  history, 
  onDeleteHistory, 
  onSelect,
  onOpenModal
}) => {
  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDeleteHistory(id);
  };

  return (
    <div className={`absolute inset-0 overflow-y-auto p-8 pt-24 transition-opacity duration-300 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
         {history.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                 <Clock size={48} className="mb-4 opacity-20" />
                 <p>No history yet</p>
             </div>
         ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {history.map(item => (
                     <div 
                         key={item.id} 
                         onClick={() => onOpenModal(item)}
                         className="group relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
                     >
                         <img 
                            src={item.imageUrl} 
                            alt="History item" 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                             <p className="text-[10px] text-zinc-400 font-mono mb-1">
                                 {new Date(item.timestamp).toLocaleDateString()}
                             </p>
                             <p className="text-xs text-white line-clamp-2 mb-3 bg-black/50 p-1 rounded backdrop-blur-sm">
                                 {item.params.prompt}
                             </p>
                             
                             <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded flex items-center justify-center gap-1"
                                    title="Restore Parameters"
                                 >
                                     <RotateCcw size={12} /> Load
                                 </button>
                                 <button 
                                    onClick={(e) => deleteHistoryItem(e, item.id)}
                                    className="p-1.5 bg-zinc-700 hover:bg-red-600 text-white rounded transition-colors"
                                    title="Delete"
                                 >
                                     <Trash2 size={12} />
                                 </button>
                             </div>
                         </div>
                         {/* Variant Indicator */}
                         {item.params.variants && item.params.variants.some(v => v.selected.length > 0) && (
                             <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"></div>
                         )}
                     </div>
                 ))}
             </div>
         )}
    </div>
  );
};

export default HistoryView;
