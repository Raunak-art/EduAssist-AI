
import { GoogleGenAI, Modality, Chat } from "@google/genai";
import { Message, Sender, ChatSettings, Attachment, AspectRatio } from "../types";
import { findRelevantKnowledge } from "./knowledgeBase";

/**
 * Creates a fresh instance of the AI client using the current environment key.
 */
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Checks if a paid access token has been selected.
 * Mandatory for high-fidelity models like gemini-3-pro-image-preview.
 */
const ensureAccessTokenSelected = async () => {
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

  if (settings.enableMaps) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          timeout: 5000,
          enableHighAccuracy: false
        });
      });
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        }
      };
    } catch (e) {
      console.warn("Location access denied or failed. Proceeding without specific coordinates.");
    }
  }

  if (settings.modelMode === 'thinking' && !hasImage && !settings.enableMaps) { 
     config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const tools: any[] = [];
  if (settings.enableSearch) tools.push({ googleSearch: {} });
  if (settings.enableMaps) tools.push({ googleMaps: {} });
  if (tools.length > 0) config.tools = tools;

  // Use only the last 6 messages for context as requested
  const sdkHistory = history
    .slice(-6) 
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

/**
 * Generates a short, context-aware identity name for the AI based on history.
 */
export const getChatIdentity = async (history: Message[]): Promise<string> => {
  const ai = getAiClient();
  const lastMessages = history.slice(-3).map(m => `${m.sender}: ${m.text}`).join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Based on the following conversation, give the AI a short 2-3 word "Persona Name" or "Current Identity" that describes its role right now (e.g., "Math Tutor", "Poetry Guide", "Science Lab", "Tech Assistant"). Output ONLY the 2-3 words.\n\n${lastMessages}`,
      config: {
        maxOutputTokens: 10,
        temperature: 0.5,
      }
    });
    return response.text?.trim() || "EduAssist AI";
  } catch (e) {
    return "EduAssist AI";
  }
};

// --- Image Generation ---

const SUPPORTED_ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];

export const generateImage = async (
  prompt: string, 
  aspectRatio: AspectRatio = '1:1'
): Promise<string> => {
  const ai = getAiClient();
  const model = 'gemini-2.5-flash-image';
  const validRatio = SUPPORTED_ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : '1:1';

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: validRatio as any
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`Generation blocked: ${candidate.finishReason}`);
    }

    const parts = candidate?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image was returned.");
  } catch (error: any) {
    const errorStr = JSON.stringify(error).toLowerCase();
    const isAccessError = errorStr.includes('403') || errorStr.includes('permission_denied') || errorStr.includes('not_found');
    
    if (isAccessError) {
      try {
        const proAi = await ensureAccessTokenSelected();
        const proResponse = await proAi.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: { 
            imageConfig: { 
              aspectRatio: validRatio as any, 
              imageSize: '1K' 
            } 
          }
        });
        
        const candidate = proResponse.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
        throw new Error("Pro model did not return image bytes.");
      } catch (proError: any) {
        const proErrorStr = JSON.stringify(proError);
        if (proErrorStr.includes("Requested entity was not found")) {
           // Reset key selection if entity missing
           if ((window as any).aistudio) (window as any).aistudio.openSelectKey();
           throw new Error("Project access required. Please select a valid paid API key.");
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
    throw new Error("Edit failed.");
  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    if (errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED')) {
      const proAi = await ensureAccessTokenSelected();
      const proResponse = await proAi.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ inlineData: { mimeType: attachment.mimeType, data: attachment.data } }, { text: prompt }] },
        config: { imageConfig: { imageSize: '1K' } }
      });
      for (const part of proResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    throw error;
  }
};

// --- Text To Speech ---

export const generateSpeech = async (text: string, language: string = 'en'): Promise<string> => {
  const ai = getAiClient();
  // Using Puck as it has a friendlier, more upbeat and expressive character
  const voices: Record<string, string> = { 
    'en': 'Puck', 
    'hi': 'Puck', 
    'es': 'Puck',
    'fr': 'Puck'
  };
  const voiceName = voices[language] || 'Puck';

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    // Added more descriptive emotional keywords to ensure a friendly delivery
    contents: [{ parts: [{ text: `Speak this clearly in a very friendly, cheerful, warm, and encouraging tone: ${text}` }] }],
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
