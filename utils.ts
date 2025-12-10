

import { GenerationParams, ComfyWorkflow } from "./types";

export const constructWorkflow = (params: GenerationParams, uploadedImageName?: string, uploadedMaskName?: string): ComfyWorkflow => {
  // If no workflow is provided in params, we can't generate.
  if (!params.workflow || !params.nodeMapping) {
      throw new Error("No workflow snapshot provided in parameters.");
  }

  const { workflow: rawWorkflow, nodeMapping } = params;

  // 1. Construct Final Prompt with Variants
  let finalPrompt = "";

  if (params.advancedMode) {
    const variantParts = params.variants
      .filter((v) => v.selected.length > 0 || v.customPrompt)
      .map((v) => {
        const parts = [];
        if (v.selected.length > 0)
          parts.push(`${v.title}: ${v.selected.join(", ")}`);
        if (v.customPrompt) parts.push(v.customPrompt);
        return parts.join(", ");
      });

    const variantsString = variantParts.join(", ");
    if (variantsString) finalPrompt += `, ${variantsString}\n`;
  }
  finalPrompt += params.prompt;


  // 2. Clone Workflow
  const workflow: ComfyWorkflow = JSON.parse(JSON.stringify(rawWorkflow));
  
  // 3. Apply Dimensions & Batch
  if (nodeMapping.imageSizeNode && workflow[nodeMapping.imageSizeNode]) {
      const node = workflow[nodeMapping.imageSizeNode];
      if (node.class_type === "EmptyLatentImage" || node.class_type === "EmptySD3LatentImage") {
          node.inputs.width = params.width;
          node.inputs.height = params.height;
          node.inputs.batch_size = params.batchSize || 1;
      }
  }

  // 4. Apply KSampler Params (Seed, Steps, CFG, Sampler, Scheduler)
  const actualSeed = params.seed === -1 ? Math.floor(Math.random() * 100000000000000) : params.seed;
  
  // Seed
  if (workflow[nodeMapping.seedNode]) {
      const node = workflow[nodeMapping.seedNode];
      if ('noise_seed' in node.inputs) node.inputs.noise_seed = actualSeed;
      else if ('seed' in node.inputs) node.inputs.seed = actualSeed;
  }

  // Steps
  if (workflow[nodeMapping.stepsNode]) {
      workflow[nodeMapping.stepsNode].inputs.steps = params.steps;
  }

  // CFG
  if (workflow[nodeMapping.cfgNode]) {
      workflow[nodeMapping.cfgNode].inputs.cfg = params.cfg;
  }

  // Sampler
  if (workflow[nodeMapping.samplerNode]) {
     const node = workflow[nodeMapping.samplerNode];
     if ('sampler_name' in node.inputs) {
        node.inputs.sampler_name = params.sampler;
     }
     if ('scheduler' in node.inputs) {
        node.inputs.scheduler = params.scheduler;
     }
     // Standard Txt2Img usually has denoise=1. 
     if ('denoise' in node.inputs) {
         node.inputs.denoise = params.denoise;
     }
  }

  // Scheduler (if separate)
  if (workflow[nodeMapping.schedulerNode] && nodeMapping.schedulerNode !== nodeMapping.samplerNode) {
     const node = workflow[nodeMapping.schedulerNode];
     if ('scheduler' in node.inputs) node.inputs.scheduler = params.scheduler;
      if ('denoise' in node.inputs) {
         node.inputs.denoise = params.denoise;
     }
  }

  // 5. Apply Text & Model
  if (workflow[nodeMapping.promptNode]) workflow[nodeMapping.promptNode].inputs.text = finalPrompt;
  if (workflow[nodeMapping.modelNode]) {
     if (workflow[nodeMapping.modelNode].class_type === "CheckpointLoaderSimple" || workflow[nodeMapping.modelNode].class_type === "CheckpointLoader") {
         workflow[nodeMapping.modelNode].inputs.ckpt_name = params.model;
     }
  }

  // 6. Handling Image Input (Inpainting or Img2Img)
  
  // CASE A: Explicit Inpainting Workflow (via mapping)
  if (nodeMapping.inputImageNode && workflow[nodeMapping.inputImageNode] && uploadedImageName) {
      workflow[nodeMapping.inputImageNode].inputs.image = uploadedImageName;
      
      if (nodeMapping.maskNode && workflow[nodeMapping.maskNode] && uploadedMaskName) {
          workflow[nodeMapping.maskNode].inputs.image = uploadedMaskName;
      }
  }
  // CASE B: Standard Txt2Img -> Img2Img Injection
  else if (uploadedImageName && nodeMapping.imageSizeNode && !nodeMapping.inputImageNode) {
      
      // 6b. Find VAE Source
      let vaeSourceId: string | null = null;
      let vaeSourceOutputIndex = 0;

      if (workflow[nodeMapping.previewNode]) {
          const preview = workflow[nodeMapping.previewNode];
          const imageInput = preview.inputs.images; // [NodeID, Index]
          
          if (Array.isArray(imageInput)) {
              const decodeNodeId = imageInput[0];
              const decodeNode = workflow[decodeNodeId];
              
              if (decodeNode && decodeNode.inputs.vae) {
                  vaeSourceId = decodeNode.inputs.vae[0];
                  vaeSourceOutputIndex = decodeNode.inputs.vae[1];
              }
          }
      }

      // Fallback: Check if CheckpointLoader provides VAE (usually index 2)
      if (!vaeSourceId && nodeMapping.modelNode) {
           vaeSourceId = nodeMapping.modelNode;
           vaeSourceOutputIndex = 2; // Standard Checkpoint VAE index
      }

      if (vaeSourceId) {
          // Inject Nodes
          const loadImageId = "10001";
          const vaeEncodeId = "10002";
          const loadMaskId = "10003";
          const setNoiseMaskId = "10004";

          // Add Load Image
          workflow[loadImageId] = {
              class_type: "LoadImage",
              inputs: {
                  image: uploadedImageName
              },
              _meta: { title: "Input Image" }
          };

          // Add VAE Encode
          workflow[vaeEncodeId] = {
              class_type: "VAEEncode",
              inputs: {
                  pixels: [loadImageId, 0],
                  vae: [vaeSourceId, vaeSourceOutputIndex]
              },
              _meta: { title: "Encode Input" }
          };

          let finalLatentSourceId = vaeEncodeId;
          let finalLatentSourceIndex = 0;

          // Handle Inpainting (Mask) for Standard Workflow
          if (uploadedMaskName) {
              workflow[loadMaskId] = {
                  class_type: "LoadImage",
                  inputs: {
                      image: uploadedMaskName
                  },
                  _meta: { title: "Load Mask" }
              };
              
              // We use SetLatentNoiseMask which applies a mask to the latent
              // Index 1 of LoadImage is the MASK output (alpha channel)
              workflow[setNoiseMaskId] = {
                  class_type: "SetLatentNoiseMask",
                  inputs: {
                      samples: [vaeEncodeId, 0],
                      mask: [loadMaskId, 1] 
                  },
                  _meta: { title: "Apply Mask" }
              };
              
              finalLatentSourceId = setNoiseMaskId;
              finalLatentSourceIndex = 0;
          }

          // Replace Connections
          // Find all nodes that were using the EmptyLatentImage node (nodeMapping.imageSizeNode)
          // and switch them to finalLatentSourceId
          Object.values(workflow).forEach((node: any) => {
              if (node.inputs) {
                  Object.keys(node.inputs).forEach(key => {
                      const val = node.inputs[key];
                      if (Array.isArray(val) && val[0] === nodeMapping.imageSizeNode) {
                          node.inputs[key] = [finalLatentSourceId, finalLatentSourceIndex];
                      }
                  });
              }
          });

          // Remove EmptyLatentImage (Optional, keeps graph clean)
          delete workflow[nodeMapping.imageSizeNode];
      }
  }

  // 7. Apply LoRAs
  const activeLoras = params.loras.filter(l => l.enabled);
  if (activeLoras.length > 0 && nodeMapping.modelNode) {
      // 1. Determine Starting Points
      let currentModelId = nodeMapping.modelNode;
      let currentModelIndex = 0; // CheckpointLoader Model is usually 0
      
      let currentClipId: string | null = null;
      let currentClipIndex = 0;

      const promptNode = workflow[nodeMapping.promptNode];
      
      // Determine initial CLIP source from the prompt node
      if (promptNode && promptNode.inputs.clip && Array.isArray(promptNode.inputs.clip)) {
          currentClipId = promptNode.inputs.clip[0];
          currentClipIndex = promptNode.inputs.clip[1];
      }

      // We need both Model and CLIP chains to apply standard LoraLoader
      if (currentModelId && currentClipId) {
          
          const originalModelId = currentModelId;
          const originalModelIndex = currentModelIndex; 
          
          const originalClipId = currentClipId;
          const originalClipIndex = currentClipIndex;

          const loraNodeIds = new Set<string>();

          activeLoras.forEach((lora, index) => {
              const nodeId = (200 + index).toString(); 
              loraNodeIds.add(nodeId);
              
              workflow[nodeId] = {
                  class_type: "LoraLoader",
                  inputs: {
                      lora_name: lora.name,
                      strength_model: lora.strength,
                      strength_clip: lora.strength,
                      model: [currentModelId, currentModelIndex],
                      clip: [currentClipId, currentClipIndex]
                  },
                  _meta: {
                      title: `LoRA: ${lora.name}`
                  }
              };

              // Update cursors
              // LoraLoader outputs: 0 = Model, 1 = CLIP
              currentModelId = nodeId;
              currentModelIndex = 0;
              
              currentClipId = nodeId;
              currentClipIndex = 1;
          });

          // Re-route connections in the entire workflow
          Object.entries(workflow).forEach(([id, node]: [string, any]) => {
              // Skip the LoRA nodes we just added to avoid circular dependency (rewriting their own inputs)
              if (loraNodeIds.has(id)) return;

              if (node.inputs) {
                  Object.keys(node.inputs).forEach(key => {
                      const val = node.inputs[key];
                      if (Array.isArray(val) && val.length >= 2) {
                          // Replace Model Connections
                          if (val[0] === originalModelId && val[1] === originalModelIndex) {
                              node.inputs[key] = [currentModelId, currentModelIndex];
                          }
                          
                          // Replace CLIP Connections
                          if (val[0] === originalClipId && val[1] === originalClipIndex) {
                              node.inputs[key] = [currentClipId, currentClipIndex];
                          }
                      }
                  });
              }
          });
      }
  }

  // 8. Handle Upscaler
  const upscaleNodeId = nodeMapping.upscaleNode;
  const upscalePreviewId = nodeMapping.upscalePreviewNode;

  if (upscaleNodeId && workflow[upscaleNodeId]) {
      if (params.upscaler) {
           // Apply method if specified
           if (params.upscaleMethod) {
              workflow[upscaleNodeId].inputs.upscale_method = params.upscaleMethod;
           }
           // Apply scale factor
           if (params.upscaleFactor) {
              workflow[upscaleNodeId].inputs.scale_by = params.upscaleFactor;
           }
      } else {
          // If upscaler is disabled, remove the nodes from workflow
          // Safely check if they exist before deleting
          delete workflow[upscaleNodeId];
          if (upscalePreviewId && workflow[upscalePreviewId]) {
              delete workflow[upscalePreviewId];
          }
      }
  } else {
       // Fallback for legacy ID hardcoding if mapping missing (though mapping preferred)
       if (!params.upscaler) {
           if (workflow["52"] && workflow["52"].class_type === "ImageScaleBy") delete workflow["52"];
           if (workflow["53"] && workflow["53"].class_type === "PreviewImage") delete workflow["53"];
       }
  }

  return workflow;
};

export const downloadImage = async (url: string, filenamePrefix: string = 'comfy-gen') => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${filenamePrefix}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error("Download failed", e);
    }
};

export const loadJSONFile = (file: File, callback: (data: any) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const parsed = JSON.parse(event.target?.result as string);
            callback(parsed);
        } catch (err) {
            console.error("Failed to parse JSON", err);
        }
    };
    reader.readAsText(file);
};

// Helper to convert Data URL to Blob
export const dataURLtoFile = (dataurl: string, filename: string) => {
    try {
        const arr = dataurl.split(',');
        const match = arr[0].match(/:(.*?);/);
        if (!match) return null;
        const mime = match[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    } catch (e) {
        console.error("DataURL conversion failed", e);
        return null;
    }
};
