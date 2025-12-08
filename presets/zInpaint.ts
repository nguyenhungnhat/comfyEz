import { WorkflowPreset } from "../types";

export const Z_INPAINT_WORKFLOW = {
  "10": {
    "inputs": {
      "noise_mask": true,
      "positive": [
        "12",
        0
      ],
      "negative": [
        "152",
        0
      ],
      "vae": [
        "56",
        0
      ],
      "pixels": [
        "41",
        0
      ],
      "mask": [
        "42",
        0
      ]
    },
    "class_type": "InpaintModelConditioning",
    "_meta": {
      "title": "InpaintModelConditioning"
    }
  },
  "12": {
    "inputs": {
      "text": "a woman smiling",
      "clip": [
        "54",
        0
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "16": {
    "inputs": {
      "seed": 5,
      "steps": 9,
      "cfg": 1,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 0.65,
      "model": [
        "17",
        0
      ],
      "positive": [
        "10",
        0
      ],
      "negative": [
        "10",
        1
      ],
      "latent_image": [
        "10",
        2
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  },
  "17": {
    "inputs": {
      "strength": 1,
      "model": [
        "153",
        0
      ]
    },
    "class_type": "DifferentialDiffusion",
    "_meta": {
      "title": "Differential Diffusion"
    }
  },
  "25": {
    "inputs": {
      "samples": [
        "16",
        0
      ],
      "vae": [
        "56",
        0
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "41": {
    "inputs": {
      "image": "example.png",
      "upload": "image"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "Load Image (Input)"
    }
  },
  "42": {
    "inputs": {
      "image": "mask.png",
      "upload": "image",
      "channel": "alpha"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "Load Image (Mask)"
    }
  },
  "152": {
    "inputs": {
      "conditioning": [
        "12",
        0
      ]
    },
    "class_type": "ConditioningZeroOut",
    "_meta": {
      "title": "ConditioningZeroOut"
    }
  },
  "153": {
    "inputs": {
      "shift": 3,
      "model": [
        "55",
        0
      ]
    },
    "class_type": "ModelSamplingAuraFlow",
    "_meta": {
      "title": "ModelSamplingAuraFlow"
    }
  },
  "54": {
    "inputs": {
       "clip_name": "Qwen3-4B.i1-Q5_K_S.gguf",
      "type": "lumina2",
      "device": "default"
    },
    "class_type": "CLIPLoaderGGUF",
    "_meta": {
      "title": "Load CLIP"
    }
  },
  "55": {
    "inputs": {
      "ckpt_name": "zImageTurboFp8Scaled.urNQ.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "Load Diffusion Model"
    }
  },
  "56": {
    "inputs": {
      "vae_name": "ae.safetensors"
    },
    "class_type": "VAELoader",
    "_meta": {
      "title": "Load VAE"
    }
  },
  "82": {
    "inputs": {
      "images": [
        "25",
        0
      ]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "Preview Image"
    }
  }
};

export const Z_INPAINT_PRESET: WorkflowPreset = {
    id: "z-turbo-inpaint",
    name: "Z Image Inpaint (GGUF)",
    workflow: Z_INPAINT_WORKFLOW,
    mapping: {
        promptNode: "12",
        negativeNode: "152",
        modelNode: "55",
        imageSizeNode: "", // Not used for sizing in this flow
        inputImageNode: "41",
        maskNode: "42",
        seedNode: "16",
        stepsNode: "16",
        cfgNode: "16",
        samplerNode: "16",
        schedulerNode: "16",
        previewNode: "82"
    },
    features: ['inpainting']
};