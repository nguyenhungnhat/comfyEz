
import React, { useRef, useEffect, useState } from 'react';
import { useInpaintingHistory } from './inpainting/hooks/useInpaintingHistory';
import { useInpaintingCanvas } from './inpainting/hooks/useInpaintingCanvas';
import { useDrawing } from './inpainting/hooks/useDrawing';
import InpaintingToolbar from './inpainting/InpaintingToolbar';

interface InpaintingEditorProps {
  image: string;
  setMask: (maskDataUrl: string) => void;
}

const InpaintingEditor: React.FC<InpaintingEditorProps> = ({ image, setMask }) => {
  // Canvases
  const visualCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null); 
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  
  // Settings
  const [brushSize, setBrushSize] = useState(40);
  const [feather, setFeather] = useState(0);
  
  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [showMask, setShowMask] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Pan State
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Hook for History
  const { history, historyStep, saveHistory, performUndo, performRedo } = useInpaintingHistory(
      visualCanvasRef, 
      maskCanvasRef, 
      setMask
  );

  // Hook for Canvas Init & Viewport
  const { scale, setScale, position, setPosition, resetView } = useInpaintingCanvas(
      image,
      visualCanvasRef,
      maskCanvasRef,
      containerRef,
      saveHistory
  );

  // Hook for Drawing Logic
  const { drawStroke, getCoordinates } = useDrawing(
      visualCanvasRef,
      maskCanvasRef,
      brushSize,
      feather,
      isErasing
  );

  // --- Event Listeners ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
        
        // Undo/Redo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) performRedo();
            else performUndo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            performRedo();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [performUndo, performRedo]);

  // --- Mouse Interactions ---

  const handleMouseDown = (e: React.MouseEvent) => {
      if (isSpacePressed || e.button === 1) {
          setIsPanning(true);
          setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
          return;
      }
      
      // Save state BEFORE starting a new stroke for Undo
      saveHistory();

      setIsDrawing(true);
      const { x, y } = getCoordinates(e.clientX, e.clientY);
      drawStroke(x, y, true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      // Update custom cursor
      setCursorPos({ x: e.clientX, y: e.clientY });

      if (isPanning) {
          setPosition({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y
          });
          return;
      }

      if (!isDrawing) return;
      const { x, y } = getCoordinates(e.clientX, e.clientY);
      drawStroke(x, y);
  };

  const handleMouseUp = () => {
      setIsPanning(false);
      if (isDrawing) {
        setIsDrawing(false);
        const mCanvas = maskCanvasRef.current;
        if (mCanvas) {
            setMask(mCanvas.toDataURL('image/png'));
        }
      }
  };

  const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.max(0.1, Math.min(10, scale + delta));
      setScale(newScale);
  };

  const clearCanvas = () => {
      saveHistory(); // Save before clearing
      const vCtx = visualCanvasRef.current?.getContext('2d');
      const mCtx = maskCanvasRef.current?.getContext('2d');
      if (vCtx && mCtx) {
          const w = visualCanvasRef.current!.width;
          const h = visualCanvasRef.current!.height;
          vCtx.clearRect(0, 0, w, h);
          mCtx.clearRect(0, 0, w, h);
          setMask(maskCanvasRef.current!.toDataURL('image/png'));
          
          // Save the empty state as a new history step
          saveHistory();
      }
  };

  const downloadMask = () => {
      const mCanvas = maskCanvasRef.current;
      if (!mCanvas) return;
      const link = document.createElement('a');
      link.download = `mask_${Date.now()}.png`;
      link.href = mCanvas.toDataURL('image/png');
      link.click();
  };

  if (!image) {
      return (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 select-none">
              <p>No image selected for inpainting.</p>
              <p className="text-xs">Upload an image in the sidebar.</p>
          </div>
      );
  }

  const cursorSize = brushSize * scale;

  return (
    <div className="relative w-full h-full bg-zinc-950 flex flex-col overflow-hidden">
        
        {/* Custom Brush Cursor */}
        {isHovering && !isPanning && !isSpacePressed && (
            <div 
                ref={cursorRef}
                className="fixed pointer-events-none rounded-full z-[100] border-2 border-yellow-400 bg-yellow-400/10 backdrop-blur-[1px]"
                style={{
                    width: cursorSize,
                    height: cursorSize,
                    left: cursorPos.x,
                    top: cursorPos.y,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: feather > 0 ? `0 0 ${feather * scale}px rgba(250, 204, 21, 0.5)` : 'none'
                }}
            />
        )}

        <InpaintingToolbar 
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            feather={feather}
            setFeather={setFeather}
            isErasing={isErasing}
            setIsErasing={setIsErasing}
            showMask={showMask}
            setShowMask={setShowMask}
            isSpacePressed={isSpacePressed}
            canUndo={historyStep > 0}
            canRedo={historyStep < history.length - 1}
            onUndo={performUndo}
            onRedo={performRedo}
            onDownloadMask={downloadMask}
            onClearMask={clearCanvas}
            onResetView={() => resetView()}
        />

        {/* Viewport */}
        <div 
            ref={containerRef}
            className={`flex-1 w-full h-full relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] ${isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-none'}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => { handleMouseUp(); setIsHovering(false); }}
        >
             {/* Instructions Overlay */}
             <div className="absolute top-4 right-4 pointer-events-none text-[10px] text-zinc-500 flex flex-col items-end gap-1 select-none z-10">
                 <span>Space + Drag to Pan</span>
                 <span>Scroll to Zoom</span>
                 <span>Ctrl + Z to Undo</span>
             </div>

             {/* Canvas Container */}
             <div 
                className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none"
             >
                <div
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'center center',
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                    }}
                    className="relative shadow-2xl pointer-events-auto"
                >
                    <img src={image} alt="Reference" className="max-w-none pointer-events-none select-none" />
                    
                    {/* Visual Canvas (What the user sees: Lemon Pattern) */}
                    <canvas
                        ref={visualCanvasRef}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${showMask ? 'opacity-100' : 'opacity-0'}`}
                        style={{ mixBlendMode: 'normal' }}
                    />

                    {/* Mask Canvas (What the AI sees: Solid Black - Hidden) */}
                    <canvas
                        ref={maskCanvasRef}
                        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                    />
                    
                    {/* Dark Overlay for better visibility of pattern */}
                    {showMask && (
                        <div className="absolute inset-0 bg-black/40 pointer-events-none mix-blend-multiply" />
                    )}
                </div>
             </div>
        </div>
    </div>
  );
};

export default InpaintingEditor;
