
import { useState, useCallback, RefObject } from 'react';
import { HistoryStep } from './types';

export const useInpaintingHistory = (
    visualCanvasRef: RefObject<HTMLCanvasElement | null>,
    maskCanvasRef: RefObject<HTMLCanvasElement | null>,
    setMask: (mask: string) => void
) => {
    const [history, setHistory] = useState<HistoryStep[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const saveHistory = useCallback(() => {
        const vCanvas = visualCanvasRef.current;
        const mCanvas = maskCanvasRef.current;
        if (!vCanvas || !mCanvas) return;
    
        const vCtx = vCanvas.getContext('2d');
        const mCtx = mCanvas.getContext('2d');
        if (!vCtx || !mCtx) return;
    
        const newStep: HistoryStep = {
            visual: vCtx.getImageData(0, 0, vCanvas.width, vCanvas.height),
            mask: mCtx.getImageData(0, 0, mCanvas.width, mCanvas.height)
        };
    
        // If we are in the middle of history, discard future steps
        const newHistory = history.slice(0, historyStep + 1);
        
        // Limit history size to 30 steps to save memory
        if (newHistory.length > 30) newHistory.shift();
    
        setHistory([...newHistory, newStep]);
        setHistoryStep(newHistory.length); // Points to the new last index
    }, [history, historyStep, visualCanvasRef, maskCanvasRef]);

    const performUndo = useCallback(() => {
        if (historyStep <= 0) {
            // Clear if we go back to the start
            if (historyStep === 0) {
                 const vCanvas = visualCanvasRef.current;
                 const mCanvas = maskCanvasRef.current;
                 const vCtx = vCanvas?.getContext('2d');
                 const mCtx = mCanvas?.getContext('2d');
                 if(vCtx && mCtx && vCanvas && mCanvas) {
                     vCtx.clearRect(0, 0, vCanvas.width, vCanvas.height);
                     mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
                     setMask(''); // Clear actual mask
                     setHistoryStep(-1);
                 }
            }
            return;
        }
    
        const prevIndex = historyStep - 1;
        const step = history[prevIndex];
        if (!step) return;
    
        const vCanvas = visualCanvasRef.current;
        const mCanvas = maskCanvasRef.current;
        const vCtx = vCanvas?.getContext('2d');
        const mCtx = mCanvas?.getContext('2d');
    
        if (vCtx && mCtx) {
            vCtx.putImageData(step.visual, 0, 0);
            mCtx.putImageData(step.mask, 0, 0);
            setMask(mCanvas!.toDataURL('image/png'));
            setHistoryStep(prevIndex);
        }
    }, [history, historyStep, setMask, visualCanvasRef, maskCanvasRef]);
    
    const performRedo = useCallback(() => {
        if (historyStep >= history.length - 1) return;
    
        const nextIndex = historyStep + 1;
        const step = history[nextIndex];
        
        const vCanvas = visualCanvasRef.current;
        const mCanvas = maskCanvasRef.current;
        const vCtx = vCanvas?.getContext('2d');
        const mCtx = mCanvas?.getContext('2d');
    
        if (vCtx && mCtx && step) {
            vCtx.putImageData(step.visual, 0, 0);
            mCtx.putImageData(step.mask, 0, 0);
            setMask(mCanvas!.toDataURL('image/png'));
            setHistoryStep(nextIndex);
        }
    }, [history, historyStep, setMask, visualCanvasRef, maskCanvasRef]);

    return {
        history,
        historyStep,
        saveHistory,
        performUndo,
        performRedo
    };
};
