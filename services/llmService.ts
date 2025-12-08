

import { Variant } from "../types";
import { VARIANT_ICONS } from "../constants";
import OpenAI from 'openai';

export const fetchLLMModels = async (host: string, apiKey: string) => {
    const url = `${host.replace(/\/$/, '')}/models`;
    const headers: Record<string, string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error("Failed to fetch models");
        const data = await response.json();
        return data.data || [];
    } catch (e) {
        console.error("LLM fetch models error:", e);
        throw e;
    }
};

export const generateVariants = async (
    host: string, 
    apiKey: string, 
    model: string, 
    userPrompt: string,
    singleMode: boolean = false,
    customSystemPrompt?: string
): Promise<Variant[]> => {
    const url = `${host.replace(/\/$/, '')}/chat/completions`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    if (host.includes("openrouter.ai")) {
         headers['HTTP-Referer'] = window.location.origin;
         headers['X-Title'] = "ComfyEz";
    }

    const availableIcons = VARIANT_ICONS.join(', ');

    // Use custom system prompt if provided, otherwise default
    let systemPrompt = customSystemPrompt;
    
    if (!systemPrompt) {
        systemPrompt = `
        You are an AI assistant for an image generation tool. 
        Your task is to generate a JSON object containing distinct variant categories based on the user's request.
        
        Each variant should have:
        - 'title': The name of the variant category (e.g., "Lighting", "Style").
        - 'options': A list of options. Each option can be a simple string OR an object with fields:
            - 'name': The option text (lowercase).
            - 'emoji': A relevant emoji char (optional).
            - 'description': A short description max 2 lines (optional).
        - 'icon': Choose ONE icon name from this list that best fits the category: [${availableIcons}]. If none fit perfectly, default to "Sparkles".
        
        The structure must be strictly JSON:
        {
          "variants": [
            { 
                "title": "Variant Name", 
                "options": [
                    "opt1", 
                    { "name": "opt2", "emoji": "🔥", "description": "This is a description" }
                ], 
                "icon": "Sun" 
            }
          ]
        }
        Do not add markdown code blocks. Just return the JSON string.
        `;
    }

    // Append mode instruction to user message to keep system prompt clean/reusable
    const modeInstruction = singleMode 
        ? "Generate ONLY ONE distinct variant category." 
        : "Generate a list of distinct variant categories.";

    const body = {
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${userPrompt}\n\n${modeInstruction}` }
        ],
        temperature: 0.7
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`LLM Error: ${err}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("No content received from LLM");

        const cleanJson = content.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        if (!parsed.variants || !Array.isArray(parsed.variants)) {
            throw new Error("Invalid JSON structure from LLM");
        }

        return parsed.variants.map((v: any) => ({
            id: Math.random().toString(36).substring(7),
            title: v.title,
            options: v.options,
            selected: [],
            customPrompt: "",
            icon: v.icon || "Sparkles"
        }));

    } catch (e) {
        console.error("LLM Generation Error:", e);
        throw e;
    }
};

export const enhancePrompt = async (
    host: string,
    apiKey: string,
    model: string,
    prompt: string,
    intensity: 'Low' | 'Medium' | 'High'
): Promise<string> => {
    const url = `${host.replace(/\/$/, '')}/chat/completions`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    
    const intensityPrompt = {
        'Low': "Add subtle details to improve clarity and style. Keep it concise.",
        'Medium': "Add artistic descriptors, lighting, and texture details to enrich the scene.",
        'High': "Completely reimagine this as a masterpiece with intricate details, specific artistic styles, and complex lighting."
    };

    const systemPrompt = `You are a prompt engineer. ${intensityPrompt[intensity]} Return ONLY the enhanced prompt text, nothing else.`;

    const body = {
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ],
        temperature: 0.7
    };

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || prompt;
};

export const suggestPrompts = async (
    host: string,
    apiKey: string,
    model: string,
    prompt: string
): Promise<string[]> => {
    const url = `${host.replace(/\/$/, '')}/chat/completions`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    
    const systemPrompt = `Based on the user's concept, generate 3 distinct, creative, and high-quality image generation prompts. Return ONLY a JSON array of strings: ["prompt1", "prompt2", "prompt3"].`;

    const body = {
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt || "A creative masterpiece" }
        ],
        temperature: 0.8
    };

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    try {
        const cleanJson = content.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch {
        return [];
    }
};

export const modifyPrompt = async (
    host: string,
    apiKey: string,
    model: string,
    currentPrompt: string,
    instruction: string
): Promise<string> => {
    const url = `${host.replace(/\/$/, '')}/chat/completions`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    
    const systemPrompt = `You are an expert prompt engineer. Your task is to modify the user's image generation prompt based on their specific instruction. Preserve the original style and important elements unless asked to change them. Return ONLY the new prompt text.`;

    const body = {
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Current Prompt: "${currentPrompt}"\n\nInstruction: ${instruction}` }
        ],
        temperature: 0.7
    };

    try {
        const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!response.ok) throw new Error("LLM request failed");
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || currentPrompt;
    } catch (e) {
        console.error("Modify prompt error", e);
        throw e;
    }
};

export const DEFAULT_EXTRACT_CONSTRAINTS = `
STRICT OUTPUT RULES:
1. Provide ONLY the raw description text.
2. Do NOT use Markdown formatting (no bold, no italics, no headers, no code blocks).
3. Do NOT start with phrases like "Here is a description" or "The image shows".
4. Do NOT include any concluding remarks.
5. Simple text only. Multi-line is allowed.
`.trim();

export const extractPromptFromImage = async (
    host: string,
    apiKey: string,
    model: string,
    imageBase64: string,
    userInstruction: string = "",
    systemInstruction: string = "", // Can override default constraints
    temperature: number = 0.4, // Default changed to 0.4
    reasoning?: { enabled: boolean; effort: string }
): Promise<string> => {
    // Instantiate OpenAI Client
    const openai = new OpenAI({
        baseURL: host.replace(/\/$/, ''),
        apiKey: apiKey || 'dummy', // SDK requires key, even if not used by backend (e.g. local)
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
            'HTTP-Referer': window.location.origin,
            'X-Title': 'ComfyEz'
        }
    });

    const baseInstruction = userInstruction.trim() || "Describe this image in detail for an image generation prompt. Focus on visual elements, style, lighting, and composition.";
    
    // Use custom system instruction if provided, otherwise default strict rules
    const finalConstraints = systemInstruction || DEFAULT_EXTRACT_CONSTRAINTS;
    const finalUserContent = `${baseInstruction}\n\n${finalConstraints}`;

    const params: any = {
        model: model,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: finalUserContent },
                    { 
                        type: "image_url", 
                        image_url: { 
                            url: imageBase64 
                        } 
                    }
                ]
            }
        ],
    };

    if (reasoning?.enabled) {
        // Models like o1/o3-mini often don't support temperature
        params.reasoning = {
            effort: reasoning.effort || 'medium'
        };
    } else {
        params.temperature = temperature;
    }

    try {
        const response = await openai.chat.completions.create(params);
        
        const content = response.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("No content received from LLM");

        let clean = content.trim();
        // Post-processing cleanup for markdown/prefixes
        clean = clean.replace(/^```(?:markdown|txt)?\s*/i, '').replace(/\s*```$/, '');
        clean = clean.replace(/^(Here['’]s|Here is) (a|an|the) (detailed )?(description|prompt|breakdown).+?(:|\.)\s*/si, '');
        
        return clean;

    } catch (e: any) {
        console.error("Image Extraction Error:", e);
        // Better error message handling from OpenAI SDK
        throw new Error(`LLM Error: ${e.message || e}`);
    }
};