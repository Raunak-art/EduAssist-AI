
import { GoogleGenAI, Modality, Chat } from "@google/genai";
import { Message, Sender, ChatSettings, Attachment, AspectRatio } from "../types";
import { findRelevantKnowledge } from "./knowledgeBase";

/**
 * Creates a fresh instance of the Gemini AI client using the current environment key.
 */
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Checks if a paid API key has been selected in AI Studio.
 * Mandatory for gemini-3-pro-image-preview and other advanced models.
 */
const ensureApiKeySelected = async () => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const aistudio = (window as any).aistudio;
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
    }
  }
  return getAiClient();
};

// --- Audio Decoding Helpers ---

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Main Chat Function ---

export const getChatResponse = async (
  history: Message[], 
  newMessage: string, 
  attachments: Attachment[], 
  settings: ChatSettings,
  systemInstruction: string,
  onChunk: (text: string) => void
): Promise<{ text: string; groundingMetadata?: any }> => {
  
  const ai = getAiClient();
  let modelName = 'gemini-3-flash-preview';
  
  const hasImage = attachments.some(a => a.type === 'image');
  
  if (hasImage || settings.modelMode === 'thinking') {
    modelName = 'gemini-3-pro-preview'; 
  } else if (settings.modelMode === 'fast') {
    modelName = 'gemini-flash-lite-latest';
  }

  if (settings.enableMaps) {
    modelName = 'gemini-2.5-flash';
  }
  
  const kbContext = findRelevantKnowledge(newMessage);
  let finalSystemInstruction = systemInstruction;
  if (kbContext) {
    finalSystemInstruction += `\n\n[System Note: Internal knowledge base context]\n\n${kbContext}`;
  }

  const config: any = {
    systemInstruction: finalSystemInstruction,
  };

  if (settings.modelMode === 'thinking' && !hasImage && !settings.enableMaps) { 
     config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const tools: any[] = [];
  if (settings.enableSearch) tools.push({ googleSearch: {} });
  if (settings.enableMaps) tools.push({ googleMaps: {} });
  if (tools.length > 0) config.tools = tools;

  const sdkHistory = history
    .filter(msg => !msg.isError && !msg.image)
    .map(msg => ({
      role: msg.sender === Sender.USER ? 'user' : 'model',
      parts: msg.attachments 
        ? [...(msg.text ? [{ text: msg.text }] : []), ...msg.attachments.map(a => ({ inlineData: { mimeType: a.mimeType, data: a.data } }))]
        : [{ text: msg.text }]
    }));

  const chat = ai.chats.create({
    model: modelName,
    config,
    history: sdkHistory,
  });

  const messageParts: any[] = [];
  if (newMessage) messageParts.push({ text: newMessage });
  attachments.forEach(att => {
    messageParts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
  });

  const result = await chat.sendMessageStream({ message: messageParts });
  
  let fullText = '';
  let groundingMetadata;

  for await (const chunk of result) {
    if (chunk.text) {
      fullText += chunk.text;
      onChunk(fullText);
    }
    if (chunk.candidates?.[0]?.groundingMetadata) {
      groundingMetadata = chunk.candidates[0].groundingMetadata;
    }
  }

  return { text: fullText, groundingMetadata };
};

// --- Image Generation ---

export const generateImage = async (
  prompt: string, 
  aspectRatio: AspectRatio = '1:1'
): Promise<string> => {
  const ai = getAiClient();
  const model = 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Generation completed but no image was returned. Try a more descriptive prompt.");
  } catch (error: any) {
    const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
    const isPermissionError = errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED');
    
    console.error("Image generation failed:", error);
    
    if (isPermissionError) {
      try {
        const proAi = await ensureApiKeySelected();
        const proResponse = await proAi.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: '1K' } }
        });
        for (const part of proResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      } catch (proError: any) {
        const proErrorStr = JSON.stringify(proError);
        if (proErrorStr.includes("Requested entity was not found") || proErrorStr.includes("403") || proErrorStr.includes("PERMISSION_DENIED")) {
          if (typeof window !== 'undefined' && (window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
            throw new Error("API Permission Denied. Please ensure you have selected an API key from a project with billing enabled to generate images.");
          }
        }
        throw proError;
      }
    }
    throw error;
  }
};

// --- Image Editing ---

export const editImage = async (prompt: string, attachment: Attachment): Promise<string> => {
  const ai = getAiClient();
  const model = 'gemini-2.5-flash-image';
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: attachment.mimeType, data: attachment.data } },
          { text: prompt }
        ]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Image edit failed.");
  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    const isPermissionError = errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED');
    
    if (isPermissionError) {
      try {
        const proAi = await ensureApiKeySelected();
        const proResponse = await proAi.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ inlineData: { mimeType: attachment.mimeType, data: attachment.data } }, { text: prompt }] },
          config: { imageConfig: { imageSize: '1K' } }
        });
        for (const part of proResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      } catch (proError: any) {
        if (JSON.stringify(proError).includes("Requested entity was not found") || JSON.stringify(proError).includes("403")) {
          if (typeof window !== 'undefined' && (window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
          }
        }
        throw proError;
      }
    }
    throw error;
  }
};

// --- Text To Speech ---

export const generateSpeech = async (text: string, language: string = 'en'): Promise<string> => {
  const ai = getAiClient();
  const voices: Record<string, string> = { 'en': 'Kore', 'hi': 'Zephyr', 'es': 'Puck' };
  const voiceName = voices[language] || 'Kore';

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");
  return base64Audio;
};
