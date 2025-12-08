import { WorkflowPreset } from "../types";

export const Z_TURBO_WORKFLOW = {
  "40": {
    "inputs": {
      "vae_name": "ae.safetensors"
    },
    "class_type": "VAELoader",
    "_meta": {
      "title": "Load VAE"
    }
  },
  "41": {
    "inputs": {
      "width": 768,
      "height": 1024,
      "batch_size": 1
    },
    "class_type": "EmptySD3LatentImage",
    "_meta": {
      "title": "EmptySD3LatentImage"
    }
  },
  "44": {
    "inputs": {
      "seed": 557444737361937,
      "steps": 8,
      "cfg": 1,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 1,
      "model": [
        "47",
        0
      ],
      "positive": [
        "45",
        0
      ],
      "negative": [
        "60",
        0
      ],
      "latent_image": [
        "41",
        0
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  },
  "45": {
    "inputs": {
      "text": "Hello",
      "clip": [
        "49",
        0
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "47": {
    "inputs": {
      "shift": 3,
      "model": [
        "48",
        0
      ]
    },
    "class_type": "ModelSamplingAuraFlow",
    "_meta": {
      "title": "ModelSamplingAuraFlow"
    }
  },
  "48": {
    "inputs": {
      "ckpt_name": "zImageTurboFp8Scaled.urNQ.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "Load Checkpoint"
    }
  },
  "49": {
    "inputs": {
      "clip_name": "Qwen3-4B.i1-Q5_K_S.gguf",
      "type": "lumina2",
      "device": "default"
    },
    "class_type": "CLIPLoaderGGUF",
    "_meta": {
      "title": "CLIPLoader (GGUF)"
    }
  },
  "52": {
    "inputs": {
      "upscale_method": "lanczos",
      "scale_by": 2,
      "image": [
        "55",
        0
      ]
    },
    "class_type": "ImageScaleBy",
    "_meta": {
      "title": "Upscale Image By"
    }
  },
  "53": {
    "inputs": {
      "images": [
        "52",
        0
      ]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "Preview Image"
    }
  },
  "55": {
    "inputs": {
      "samples": [
        "44",
        0
      ],
      "vae": [
        "40",
        0
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "56": {
    "inputs": {
      "images": [
        "55",
        0
      ]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "Preview Image"
    }
  },
  "60": {
    "inputs": {
      "conditioning": [
        "45",
        0
      ]
    },
    "class_type": "ConditioningZeroOut",
    "_meta": {
      "title": "ConditioningZeroOut"
    }
  }
};

export const Z_TURBO_PRESET: WorkflowPreset = {
    id: "z-turbo-gguf",
    name: "Z Image Turbo (GGUF)",
    description: "High-speed generation workflow using the Z-Image Turbo model. This setup leverages GGUF quantization for improved memory efficiency without sacrificing too much quality. Ideal for rapid prototyping and lower VRAM cards.",
    requirements: [
        "ComfyUI-GGUF",
        "ComfyUI-AuraFlow"
    ],
    workflow: Z_TURBO_WORKFLOW,
    mapping: {
        promptNode: "45",
        negativeNode: "60",
        modelNode: "48",
        imageSizeNode: "41",
        seedNode: "44",
        stepsNode: "44",
        cfgNode: "44",
        samplerNode: "44",
        schedulerNode: "44",
        previewNode: "56",
        upscaleNode: "52",
        upscalePreviewNode: "53"
    },
    features: ['txt2img', 'img2img']
};