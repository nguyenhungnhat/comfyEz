
import React from 'react';
import { X, GripVertical, Trash2, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { QueueItem } from '../types';

interface QueuePopoverProps {
  queue: QueueItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onClose: () => void;
}

const QueuePopover: React.FC<QueuePopoverProps> = ({ queue, onRemove, onClear, onReorder, onClose }) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    onReorder(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderStatusIcon = (status: QueueItem['status'], error?: string) => {
      switch (status) {
          case 'processing': return <Loader2 size={12} className="text-blue-400 animate-spin" />;
          case 'done': return <CheckCircle size={12} className="text-green-400" />;
          case 'error': return (
              <span title={error} className="flex items-center">
                  <AlertCircle size={12} className="text-red-400" />
              </span>
          );
          default: return <Clock size={12} className="text-zinc-500" />;
      }
  };

  return (
    <div className="absolute bottom-full right-0 mb-3 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col z-[60] animate-in slide-in-from-bottom-2">
      <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Queue ({queue.length})</h3>
        <div className="flex gap-2">
            <button 
                onClick={onClear} 
                className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 py-0.5 rounded transition-colors"
            >
                Clear All
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X size={14} />
            </button>
        </div>
      </div>
      
      <div className="max-h-60 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {queue.length === 0 ? (
            <div className="text-center py-6 text-zinc-600 text-xs flex flex-col items-center gap-2">
                <Clock size={24} className="opacity-20" />
                Queue is empty
            </div>
        ) : (
            queue.map((item, index) => (
                <div 
                    key={item.id}
                    draggable={item.status === 'pending'} // Only drag pending
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 bg-zinc-950 p-2.5 rounded border transition-all ${
                        item.status === 'processing' 
                        ? 'border-blue-500/30 bg-blue-900/10' 
                        : 'border-zinc-800 hover:border-zinc-600'
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                    {item.status === 'pending' ? (
                        <div className="cursor-grab text-zinc-600 hover:text-zinc-400 shrink-0">
                            <GripVertical size={12} />
                        </div>
                    ) : (
                        <div className="w-3 shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            {renderStatusIcon(item.status, item.error)}
                            <span className={`text-xs font-medium truncate ${item.status === 'processing' ? 'text-blue-200' : 'text-zinc-200'}`}>
                                {item.params.prompt}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                             <span className="bg-zinc-900 px-1.5 rounded border border-zinc-800">x{item.params.batchSize}</span>
                             <span>{item.params.width}x{item.params.height}</span>
                             {item.status === 'processing' && <span className="text-blue-400 animate-pulse">Generating...</span>}
                        </div>
                    </div>

                    <button 
                        onClick={() => onRemove(item.id)}
                        disabled={item.status === 'processing'}
                        className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 disabled:opacity-0 transition-all shrink-0"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default QueuePopover;
