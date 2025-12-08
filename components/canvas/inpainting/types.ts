
export interface HistoryStep {
  visual: ImageData;
  mask: ImageData;
}

export interface InpaintingToolbarProps {
  brushSize: number;
  setBrushSize: (size: number) => void;
  feather: number;
  setFeather: (feather: number) => void;
  isErasing: boolean;
  setIsErasing: (erasing: boolean) => void;
  showMask: boolean;
  setShowMask: (show: boolean) => void;
  isSpacePressed: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDownloadMask: () => void;
  onClearMask: () => void;
  onResetView: () => void;
}
