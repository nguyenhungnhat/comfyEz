
import { RefObject, useCallback } from 'react';
import { createLemonPattern } from '../utils';

export const useDrawing = (
    visualCanvasRef: RefObject<HTMLCanvasElement | null>,
    maskCanvasRef: RefObject<HTMLCanvasElement | null>,
    brushSize: number,
    feather: number,
    isErasing: boolean
) => {
    const drawStroke = useCallback((x: number, y: number, isStart: boolean = false) => {
        const vCtx = visualCanvasRef.current?.getContext('2d');
        const mCtx = maskCanvasRef.current?.getContext('2d');
        
        if (!vCtx || !mCtx) return;

        const operation = isErasing ? 'destination-out' : 'source-over';
        vCtx.globalCompositeOperation = operation;
        mCtx.globalCompositeOperation = operation;

        // Visual Canvas Style (Lemon Hatch)
        if (!isErasing) {
           const pattern = createLemonPattern(vCtx);
           if (pattern) vCtx.strokeStyle = pattern;
           else vCtx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
        } else {
           vCtx.strokeStyle = 'rgba(0,0,0,1)';
        }

        // Mask Canvas Style (Solid Black)
        mCtx.strokeStyle = 'black';
        
        // Feathering
        if (!isErasing && feather > 0) {
            mCtx.shadowBlur = feather;
            mCtx.shadowColor = 'black';
        } else {
            mCtx.shadowBlur = 0;
            mCtx.shadowColor = 'transparent';
        }

        // Shared Properties
        [vCtx, mCtx].forEach(ctx => {
            ctx.lineWidth = brushSize;
            if (isStart) ctx.beginPath();
            ctx.lineTo(x, y);
            ctx.stroke();
            if (isStart) {
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
        });
    }, [visualCanvasRef, maskCanvasRef, brushSize, feather, isErasing]);

    const getCoordinates = useCallback((clientX: number, clientY: number) => {
        const canvas = visualCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
  
        return { x, y };
    }, [visualCanvasRef]);

    return { drawStroke, getCoordinates };
};
