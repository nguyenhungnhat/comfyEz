
export const createLemonPattern = (ctx: CanvasRenderingContext2D) => {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return null;

    // Lemon background (semi-transparent)
    pCtx.fillStyle = 'rgba(234, 179, 8, 0.3)'; // Yellow-500 low opacity
    pCtx.fillRect(0, 0, 16, 16);

    // Diagonal Lines
    pCtx.strokeStyle = 'rgba(253, 224, 71, 0.8)'; // Yellow-300 high opacity
    pCtx.lineWidth = 2;
    pCtx.beginPath();
    pCtx.moveTo(0, 16);
    pCtx.lineTo(16, 0);
    pCtx.stroke();

    return ctx.createPattern(pCanvas, 'repeat');
};
