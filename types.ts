

export interface LLMSettings {
  enabled: boolean;
  host: string;
  apiKey: string;
  model: string;
}

export interface AppSettings {
  host: string;
  llm: LLMSettings;
}

export interface VariantOption {
  name: string;
  emoji?: string;
  description?: string;
}

export interface Variant {
  id: string;
  title: string;
  options: (string | VariantOption)[];
  selected: string[];
  customPrompt: string;
  icon?: string;
}

export interface Lora {
  id: string;
  name: string;
  strength: number;
  enabled: boolean;
}

export interface ComfyNode {
  inputs: Record<string, any>;
  class_type: string;
  _meta?: {
    title: string;
  };
}

export type ComfyWorkflow = Record<string, ComfyNode>;

export interface NodeMapping {
  promptNode: string; // ID for positive prompt
  negativeNode: string; // ID for negative prompt
  modelNode: string; // ID for CheckpointLoader
  imageSizeNode: string; // ID for EmptyLatentImage (width/height)
  seedNode: string; // ID for Seed setting (usually KSampler)
  stepsNode: string; // ID for Steps setting
  cfgNode: string; // ID for CFG setting
  samplerNode: string; // ID for Sampler Name
  schedulerNode: string; // ID for Scheduler
  previewNode: string; // ID for Preview/Save Image (to track output)
  inputImageNode?: string; // ID for Input Image Loader (Inpainting/Img2Img)
  maskNode?: string; // ID for Mask Loader (Inpainting)
  upscaleNode?: string; // ID for ImageScaleBy
  upscalePreviewNode?: string; // ID for PreviewImage (upscaled)
}

export interface WorkflowPreset {
  id: string;
  name: string;
  description?: string;
  requirements?: string[];
  workflow: ComfyWorkflow;
  mapping: NodeMapping;
  features?: ('txt2img' | 'img2img' | 'inpainting')[];
}

export interface GenerationParams {
  prompt: string;
  steps: number;
  cfg: number;
  sampler: string;
  scheduler: string;
  width: number;
  height: number;
  upscaler: boolean;
  upscaleMethod?: string;
  upscaleFactor?: number;
  seed: number;
  model: string; // ComfyUI Checkpoint name
  batchSize: number;
  advancedMode: boolean;
  variants: Variant[];
  loras: Lora[];
  // Image to Image / Inpainting
  inputImage?: string; // Data URL
  maskImage?: string; // Data URL
  denoise: number;
  // Snapshot of workflow used for this generation
  workflow?: ComfyWorkflow;
  nodeMapping?: NodeMapping;
}

export interface HistoryItem {
  id: string;
  imageUrl: string;
  params: GenerationParams;
  timestamp: number;
}

export interface QueueItem {
  id: string;
  params: GenerationParams;
  timestamp: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  promptId?: string;
}

export interface CanvasImage {
  id: string;
  url: string;
  width: number;
  height: number;
  params?: GenerationParams;
}