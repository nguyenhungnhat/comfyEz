
import { useEffect, useState, RefObject } from 'react';

export const useInpaintingCanvas = (
    image: string,
    visualCanvasRef: RefObject<HTMLCanvasElement | null>,
    maskCanvasRef: RefObject<HTMLCanvasElement | null>,
    containerRef: RefObject<HTMLDivElement | null>,
    saveHistory: () => void
) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const resetView = (imgW?: number, imgH?: number) => {
        const container = containerRef.current;
        const canvas = visualCanvasRef.current;
        if (!container) return;
        
        const w = imgW || canvas?.width || 1024;
        const h = imgH || canvas?.height || 1024;
        
        const scaleX = (container.clientWidth - 100) / w;
        const scaleY = (container.clientHeight - 100) / h;
        const fitScale = Math.min(scaleX, scaleY, 1);

        setScale(fitScale);
        setPosition({ x: 0, y: 0 });
    };

    useEffect(() => {
        if (!image) return;

        const img = new Image();
        img.src = image;
        img.onload = () => {
            const width = img.width;
            const height = img.height;

            [visualCanvasRef.current, maskCanvasRef.current].forEach(canvas => {
                if (canvas) {
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.lineJoin = 'round';
                        ctx.lineCap = 'round';
                    }
                }
            });
            
            // Initial save
            saveHistory();
            resetView(width, height);
        };
    }, [image]);

    return { scale, setScale, position, setPosition, resetView };
};
