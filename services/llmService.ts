import OpenAI from 'openai';
import { Variant } from "../types";
import { VARIANT_ICONS } from "../constants";

// Helper to create OpenAI client
const createClient = (host: string, apiKey: string) => {
    return new OpenAI({
        baseURL: host.replace(/\/$/, ''),
        apiKey: apiKey || 'dummy', // SDK requires key, even if not used by backend (e.g. local)
        dangerouslyAllowBrowser: true,
    });
};

export const fetchLLMModels = async (host: string, apiKey: string) => {
    const client = createClient(host, apiKey);
    try {
        const list = await client.models.list();
        return list.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id
        }));
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
    const client = createClient(host, apiKey);
    const availableIcons = VARIANT_ICONS.join(', ');

    let systemPrompt = customSystemPrompt;
    if (!systemPrompt) {
        systemPrompt = `
        You are an AI assistant for an image generation tool. 
        Your task is to generate a JSON object containing distinct variant categories based on the user's request.
        
        Each variant should have:
        - 'title': The name of the variant category (e.g., "Lighting", "Style").
        - 'category': A high-level group name (e.g., "Visuals", "Tech").
        - 'options': A list of options. Each option can be a simple string OR an object with fields:
            - 'name': The option text (lowercase).
            - 'emoji': A relevant emoji char (optional).
            - 'description': A short description max 2 lines (optional).
        - 'icon': Choose ONE icon name from this list that best fits the category: [${availableIcons}]. If none fit perfectly, default to "Sparkles".
        
        The structure must be strictly JSON:
        {
          "variants": [
            { 
                "title": "Neon Lighting", 
                "category": "Lighting",
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

    const modeInstruction = singleMode 
        ? "Generate ONLY ONE distinct variant category." 
        : "Generate a list of distinct variant categories.";

    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `${userPrompt}\n\n${modeInstruction}` }
            ],
            temperature: 0.7
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No content received from LLM");

        const cleanJson = content.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        if (!parsed.variants || !Array.isArray(parsed.variants)) {
            throw new Error("Invalid JSON structure from LLM");
        }

        return parsed.variants.map((v: any) => ({
            id: Math.random().toString(36).substring(7),
            title: v.title,
            category: v.category || "General",
            options: v.options,
            selected: [], // Initially empty, user selects
            customPrompt: "",
            icon: v.icon || "Sparkles"
        }));

    } catch (e: any) {
        console.error("LLM Generation Error:", e);
        throw new Error(`LLM Error: ${e.message || e}`);
    }
};

export const DEFAULT_EXTRACT_VARIANTS_PROMPT = `
You are an expert prompt analyzer. Your task is to deconstruct the provided image generation prompt into structured variant categories.

Input Prompt: "Cyberpunk city with neon lights, rain, 8k resolution, cinematic lighting"

Desired Output Structure (JSON):
{
  "variants": [
    { 
      "title": "Cyberpunk Style",
      "category": "Style",
      "icon": "Zap",
      "options": [
          { "name": "cyberpunk", "emoji": "🏙️" }
      ],
      "selected": ["cyberpunk"]
    },
    { 
      "title": "Atmosphere",
      "category": "Environment",
      "icon": "Sun",
      "options": [
          { "name": "neon lights", "emoji": "💡" },
          { "name": "cinematic lighting", "emoji": "🎬" }
      ],
      "selected": ["neon lights", "cinematic lighting"]
    }
  ]
}

Rules:
1. Break down the prompt into logical categories.
2. 'title' should be the specific aspect (e.g. "Lighting").
3. 'category' should be a high-level grouping (e.g. "Visuals", "Subject", "Tech", "Style").
4. Extract the specific terms from the prompt as 'options'.
5. 'selected' array must contain the exact names of the options found in the prompt.
6. Choose an appropriate icon from: [${VARIANT_ICONS.join(', ')}].
7. If 'includeEmojis' is true in user instruction, add emojis.
`.trim();

export const extractVariantsFromPrompt = async (
    host: string,
    apiKey: string,
    model: string,
    prompt: string,
    config: {
        useEmojis: boolean,
        maxVariants: number, 
        extraOptionsCount: number,
        forceCategory?: string,
        systemInstruction: string
    }
): Promise<Variant[]> => {
    const client = createClient(host, apiKey);

    // Dynamic instructions based on config
    const countInstruction = `Limit output to a maximum of ${config.maxVariants} variant groups.`;
    
    const emojiInstruction = config.useEmojis 
        ? "Include relevant emojis for each option." 
        : "Do NOT include emojis.";

    const categoryInstruction = config.forceCategory && config.forceCategory !== 'Auto'
        ? `IMPORTANT: You must set the 'category' field for ALL variants to exactly "${config.forceCategory}". Do not invent new categories.`
        : "Group variants into logical high-level 'category' fields (e.g., Visuals, Subject).";

    const extraOptionsInstruction = config.extraOptionsCount > 0
        ? `For each variant, after extracting the user's terms, generate ${config.extraOptionsCount} ADDITIONAL creative, relevant, and diverse options that fit the same theme but are NOT in the original prompt. Add them to the 'options' array. Do NOT add them to the 'selected' array.`
        : "Do not add any extra options beyond what is found in the prompt.";

    const fullSystemPrompt = `
${config.systemInstruction}

ADDITIONAL INSTRUCTIONS:
- ${countInstruction}
- ${emojiInstruction}
- ${categoryInstruction}
- ${extraOptionsInstruction}

Return ONLY valid JSON.
    `.trim();

    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: fullSystemPrompt },
                { role: "user", content: `Analyze this prompt: "${prompt}"` }
            ],
            temperature: 0.7 // Slightly higher temp for creative extra options
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No content received");

        const cleanJson = content.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (!parsed.variants || !Array.isArray(parsed.variants)) {
            throw new Error("Invalid JSON structure");
        }

        return parsed.variants.map((v: any) => ({
            id: Math.random().toString(36).substring(7),
            title: v.title,
            category: config.forceCategory && config.forceCategory !== 'Auto' ? config.forceCategory : (v.category || "General"),
            options: v.options,
            // Pre-select the extracted terms so they are active immediately
            selected: v.selected || [], 
            customPrompt: "",
            icon: v.icon || "Sparkles"
        }));

    } catch (e: any) {
        console.error("Extract Variants Error:", e);
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
    const client = createClient(host, apiKey);
    
    const intensityPrompt = {
        'Low': "Add subtle details to improve clarity and style. Keep it concise.",
        'Medium': "Add artistic descriptors, lighting, and texture details to enrich the scene.",
        'High': "Completely reimagine this as a masterpiece with intricate details, specific artistic styles, and complex lighting."
    };

    const systemPrompt = `You are a prompt engineer. ${intensityPrompt[intensity]} Return ONLY the enhanced prompt text, nothing else.`;

    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        });
        return response.choices[0]?.message?.content?.trim() || prompt;
    } catch (e) {
        console.error("Enhance Prompt Error", e);
        return prompt;
    }
};

export const prettifyPrompt = async (
    host: string,
    apiKey: string,
    model: string,
    prompt: string
): Promise<string> => {
    const client = createClient(host, apiKey);
    
    const systemPrompt = `You are a prompt formatter. Rewrite the user's prompt to be more structured and readable without changing the meaning.
Structure the output as follows:
1. Start with a short, descriptive paragraph summarizing the main subject.
2. Follow with a list of specific attributes in "Key: Value" format (e.g., Style: Cyberpunk, Lighting: Soft, Camera: 85mm).
Do NOT add new content. Output ONLY the formatted text.`;

    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.3
        });
        return response.choices[0]?.message?.content?.trim() || prompt;
    } catch (e) {
        console.error("Prettify Prompt Error", e);
        throw e;
    }
};

export const suggestPrompts = async (
    host: string,
    apiKey: string,
    model: string,
    prompt: string
): Promise<string[]> => {
    const client = createClient(host, apiKey);
    
    const systemPrompt = `Based on the user's concept, generate 3 distinct, creative, and high-quality image generation prompts. Return ONLY a JSON array of strings: ["prompt1", "prompt2", "prompt3"].`;

    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt || "A creative masterpiece" }
            ],
            temperature: 0.8
        });

        const content = response.choices[0]?.message?.content;
        if (!content) return [];

        const cleanJson = content.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Suggest Prompts Error", e);
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
    const client = createClient(host, apiKey);
    
    const systemPrompt = `You are an expert prompt engineer. Your task is to modify the user's image generation prompt based on their specific instruction. Preserve the original style and important elements unless asked to change them. Return ONLY the new prompt text.`;

    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Current Prompt: "${currentPrompt}"\n\nInstruction: ${instruction}` }
            ],
            temperature: 0.7
        });
        return response.choices[0]?.message?.content?.trim() || currentPrompt;
    } catch (e) {
        console.error("Modify Prompt Error", e);
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
    systemInstruction: string = "", 
    temperature: number = 0.4, 
    reasoning?: { enabled: boolean; effort: string }
): Promise<string> => {
    const client = createClient(host, apiKey);

    const baseInstruction = userInstruction.trim() || "Describe this image in detail for an image generation prompt. Focus on visual elements, style, lighting, and composition.";
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
        params.reasoning = {
            effort: reasoning.effort || 'medium'
        };
    } else {
        params.temperature = temperature;
    }

    try {
        const response = await client.chat.completions.create(params);
        
        const content = response.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("No content received from LLM");

        let clean = content.trim();
        clean = clean.replace(/^```(?:markdown|txt)?\s*/i, '').replace(/\s*```$/, '');
        clean = clean.replace(/^(Here['’]s|Here is) (a|an|the) (detailed )?(description|prompt|breakdown).+?(:|\.)\s*/si, '');
        
        return clean;

    } catch (e: any) {
        console.error("Image Extraction Error:", e);
        throw new Error(`LLM Error: ${e.message || e}`);
    }
};