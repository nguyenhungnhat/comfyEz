import React from 'react';
import { Image as ImageIcon, Plus, X } from 'lucide-react';
import { GenerationParams } from '../../types';

interface ImageInputProps {
    inputImage?: string;
    denoise: number;
    isDragging: boolean;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    clearImage: () => void;
    handleChange: (key: keyof GenerationParams, value: any) => void;
}

const ImageInput: React.FC<ImageInputProps> = ({
    inputImage,
    denoise,
    isDragging,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearImage,
    handleChange
}) => {
  return (
    <div className="space-y-3">
         <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon size={12} className="text-green-400"/> Image Input
        </label>
        
        {!inputImage ? (
            <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    isDragging 
                    ? 'bg-blue-900/20 border-blue-500' 
                    : 'border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-500'
                }`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Plus size={24} className={`mb-1 ${isDragging ? 'text-blue-400' : 'text-zinc-500'}`} />
                    <p className={`text-[10px] ${isDragging ? 'text-blue-300' : 'text-zinc-500'}`}>
                        {isDragging ? 'Drop Image Here' : 'Upload or Drag Image'}
                    </p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
        ) : (
            <div className="relative group rounded-lg overflow-hidden border border-zinc-700 bg-black">
                <img src={inputImage} alt="Input" className="w-full h-32 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                <button 
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        )}
        
        {/* Denoise Slider (Only show if image exists) */}
        {inputImage && (
            <div className="space-y-2 pt-1 animate-in slide-in-from-top-2">
                <div className="flex justify-between text-xs">
                    <span className="font-semibold text-zinc-400 uppercase">Denoising</span>
                    <span className="text-zinc-300">{denoise.toFixed(2)}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={denoise}
                    onChange={(e) => handleChange('denoise', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                 <p className="text-[10px] text-zinc-500">Lower = closer to original image</p>
            </div>
        )}
    </div>
  );
};

export default ImageInput;