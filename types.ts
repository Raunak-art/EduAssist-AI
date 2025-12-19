
export enum Sender {
  USER = 'user',
  BOT = 'bot',
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64 string
  uri: string; // Data URI for display
  name?: string;
  type: 'image' | 'video' | 'audio' | 'file';
}

export interface GroundingMetadata {
  groundingChunks?: {
    web?: { uri: string; title: string };
    maps?: { uri: string; title: string; placeId?: string };
  }[];
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
  image?: string;
  relatedPrompt?: string;
  attachments?: Attachment[];
  groundingMetadata?: GroundingMetadata;
  feedback?: 'positive' | 'negative';
}

export type SessionStatus = 'active' | 'archived' | 'hidden' | 'deleted';

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export type LoginMethod = 'google' | 'apple' | 'email' | 'phone' | 'guest';

export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isGuest: boolean;
  method: LoginMethod;
  role?: UserRole;
  grade?: string;
  section?: string;
  dob?: string;
}

export type ThemeMode = 'light' | 'dark' | 'custom' | 'liquid';

export interface Theme {
  mode: ThemeMode;
  customImage?: string; // Base64 Data URL
  snowingEnabled?: boolean; // Toggle for snowing effect
  galaxyEnabled?: boolean; // Toggle for galaxy/star effect
}

export type Language = 
  | 'auto'
  | 'en' | 'es' | 'fr' | 'de' | 'ja' | 'hi' | 'zh' 
  | 'mr' | 'pa' | 'te' | 'ta' | 'kn' | 'bn' 
  | 'ar' | 'pt' | 'ru' | 'it' | 'ko' | 'tr' | 'sw' | 'nl' | 'th';

export type InputMode = 'text' | 'image-edit' | 'image-gen';

export type ModelMode = 'fast' | 'balanced' | 'thinking';

// Updated to strictly follow supported Nexus (Gemini) image aspect ratios
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface ChatSettings {
  modelMode: ModelMode;
  enableSearch: boolean;
  enableMaps: boolean;
  enableImageEditing: boolean;
  enableAudioResponse: boolean;
  imageAspectRatio: AspectRatio;
}
