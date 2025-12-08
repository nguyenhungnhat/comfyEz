import { GenerationParams, AppSettings } from "./types";
import { DEFAULT_PRESETS } from "./presets/index";

export const DEFAULT_SETTINGS: AppSettings = {
  host: "http://127.0.0.1:8188",
  llm: {
    enabled: true,
    host: "https://openrouter.ai/api/v1",
    apiKey: "",
    model: "google/gemini-2.0-flash-lite-preview-02-05:free",
  }
};

export const DEFAULT_PARAMS: GenerationParams = {
  prompt: "A futuristic cityscape with neon lights, cyberpunk style, high detail",
  steps: 8,
  cfg: 1,
  sampler: "euler",
  scheduler: "simple",
  width: 768,
  height: 1024,
  upscaler: false,
  upscaleMethod: "lanczos",
  upscaleFactor: 2,
  seed: -1, // -1 means random
  model: "zImageTurboFp8Scaled.urNQ.safetensors",
  batchSize: 1,
  advancedMode: false,
  variants: [],
  loras: [],
  denoise: 1.0,
};

export const ASPECT_RATIOS = [
  { label: "1:1", width: 1024, height: 1024 },
  { label: "3:4", width: 768, height: 1024 },
  { label: "4:3", width: 1024, height: 768 },
  { label: "16:9", width: 1280, height: 720 },
  { label: "9:16", width: 720, height: 1280 },
];

export const SAMPLERS = [
  "euler", "euler_ancestral", "heun", "heunpp2", "dpm_2", "dpm_2_ancestral",
  "lms", "dpm_fast", "dpm_adaptive", "dpmpp_2s_ancestral", "dpmpp_sde",
  "dpmpp_sde_gpu", "dpmpp_2m", "dpmpp_2m_sde", "dpmpp_2m_sde_gpu",
  "dpmpp_3m_sde", "dpmpp_3m_sde_gpu", "ddpm", "lcm", "ddim", "uni_pc", "uni_pc_bh2"
];

export const SCHEDULERS = [
  "normal", "karras", "exponential", "sgm_uniform", "simple", "ddim_uniform"
];

export const UPSCALE_METHODS = [
  "nearest-exact", "bilinear", "area", "bicubic", "lanczos"
];

export const VARIANT_ICONS = [
  "Sparkles", "Zap", "Camera", "Palette", "Brush", "Layers", "Image", 
  "Sun", "Moon", "Cloud", "Star", "Heart", "Skull", "Ghost", "Anchor", 
  "Aperture", "Box", "Circle", "Triangle", "Hexagon", "Droplet", "Eye", 
  "Flame", "Flower", "Gift", "Globe", "Key", "Lock", "Map", "Music"
];

export { DEFAULT_PRESETS };