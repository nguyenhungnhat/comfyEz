
import { ComfyWorkflow } from "../types";

export const generateClientId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const queuePrompt = async (host: string, clientId: string, workflow: ComfyWorkflow) => {
  const url = `${host.replace(/\/$/, '')}/prompt`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      prompt: workflow,
    }),
  });

  if (!response.ok) {
    throw new Error(`ComfyUI Error: ${response.statusText}`);
  }

  return response.json();
};

export const getHistory = async (host: string, promptId: string) => {
  const url = `${host.replace(/\/$/, '')}/history/${promptId}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`History Fetch Error: ${response.statusText}`);
  }

  return response.json();
};

export const getImageUrl = (host: string, filename: string, subfolder: string, type: string) => {
  const params = new URLSearchParams({
    filename,
    subfolder,
    type,
  });
  return `${host.replace(/\/$/, '')}/view?${params.toString()}`;
};

export const uploadImage = async (host: string, file: File, retries = 3): Promise<any> => {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Reorder: Put text fields BEFORE file to help some multipart parsers (fixes aiohttp Reading after EOF)
  const formData = new FormData();
  formData.append('overwrite', 'true'); 
  formData.append('type', 'input');
  formData.append('image', file, safeName);

  try {
      const response = await fetch(`${host.replace(/\/$/, '')}/upload/image`, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type header manually, let browser set boundary
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Upload Failed: ${txt}`);
      }

      return await response.json();
  } catch (error) {
      if (retries > 0) {
          console.warn(`Upload failed, retrying... (${retries} left)`, error);
          await new Promise(r => setTimeout(r, 1000)); // Wait 1s
          return uploadImage(host, file, retries - 1);
      }
      throw error;
  }
};

export const getCheckpoints = async (host: string): Promise<string[]> => {
    const base = host.replace(/\/$/, '');
    try {
        // Try simple loader first
        const response = await fetch(`${base}/object_info/CheckpointLoaderSimple`);
        if (response.ok) {
            const data = await response.json();
            return data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
        }
        
        // Fallback to standard loader
        const fallback = await fetch(`${base}/object_info/CheckpointLoader`);
        if (fallback.ok) {
            const data = await fallback.json();
            return data?.CheckpointLoader?.input?.required?.ckpt_name?.[0] || [];
        }
    } catch (e) {
        console.error("Failed to fetch checkpoints", e);
    }
    return [];
};

export const getLoras = async (host: string): Promise<string[]> => {
    const base = host.replace(/\/$/, '');
    try {
        const response = await fetch(`${base}/object_info/LoraLoader`);
        if (response.ok) {
            const data = await response.json();
            return data?.LoraLoader?.input?.required?.lora_name?.[0] || [];
        }
    } catch (e) {
        console.error("Failed to fetch loras", e);
    }
    return [];
};
