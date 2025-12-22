
import { Message, Theme, Language, ChatSession, SessionStatus } from "../types";
import { v4 as uuidv4 } from 'uuid';

const LEGACY_HISTORY_KEY = 'eduassist_chat_history_';
const SESSIONS_KEY = 'eduassist_sessions_';
const MESSAGES_KEY = 'eduassist_messages_';
const THEME_KEY = 'eduassist_theme_preference';
const LANG_KEY = 'eduassist_language_preference';

const isQuotaExceeded = (e: any) => {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' ||
     e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
};

export const storageService = {
  getSessions: (userId: string): ChatSession[] => {
    try {
      const sessionsKey = `${SESSIONS_KEY}${userId}`;
      const savedSessions = localStorage.getItem(sessionsKey);
      
      let sessions: ChatSession[] = [];
      if (savedSessions) {
        sessions = JSON.parse(savedSessions).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          status: s.status || 'active'
        }));
      }

      const legacyKey = `${LEGACY_HISTORY_KEY}${userId}`;
      const legacyData = localStorage.getItem(legacyKey);
      
      if (legacyData) {
        const legacyMessages = JSON.parse(legacyData);
        if (legacyMessages.length > 0) {
          const newSessionId = uuidv4();
          const timestamp = new Date();
          const newSession: ChatSession = {
            id: newSessionId,
            userId,
            title: "Previous Chat",
            createdAt: timestamp,
            updatedAt: timestamp,
            status: 'active'
          };
          localStorage.setItem(`${MESSAGES_KEY}${newSessionId}`, JSON.stringify(legacyMessages));
          sessions.unshift(newSession);
          localStorage.setItem(sessionsKey, JSON.stringify(sessions));
        }
        localStorage.removeItem(legacyKey);
      }

      return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (e) {
      console.error("Failed to load sessions", e);
      return [];
    }
  },

  loadSessionMessages: (sessionId: string): Message[] => {
    try {
      const key = `${MESSAGES_KEY}${sessionId}`;
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    } catch (e) {
      console.error(`Failed to load messages for session ${sessionId}`, e);
      return [];
    }
  },

  saveSessionMessages: (userId: string, sessionId: string, messages: Message[], title?: string) => {
    try {
      const msgKey = `${MESSAGES_KEY}${sessionId}`;
      const cleanMessages = messages.map(({ isStreaming, ...msg }) => msg);
      
      try {
        localStorage.setItem(msgKey, JSON.stringify(cleanMessages));
      } catch (e) {
        if (isQuotaExceeded(e)) {
          const allSessions = storageService.getSessions(userId);
          const otherSessions = allSessions.filter(s => s.id !== sessionId);
          if (otherSessions.length > 0) {
            const oldestSession = otherSessions[otherSessions.length - 1];
            storageService.deleteSession(userId, oldestSession.id);
            storageService.saveSessionMessages(userId, sessionId, messages, title);
            return;
          } 
          const strippedMessages = cleanMessages.map(msg => ({
            ...msg,
            image: undefined, 
            attachments: undefined,
            text: msg.text + (msg.image || (msg.attachments && msg.attachments.length) ? "\n\n[Media removed to save space]" : "")
          }));
          localStorage.setItem(msgKey, JSON.stringify(strippedMessages));
        } else {
          throw e;
        }
      }

      const sessionsKey = `${SESSIONS_KEY}${userId}`;
      const savedSessions = localStorage.getItem(sessionsKey);
      let sessions: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];
      const existingIndex = sessions.findIndex(s => s.id === sessionId);
      const now = new Date();

      if (existingIndex >= 0) {
        sessions[existingIndex].updatedAt = now;
        if (title) sessions[existingIndex].title = title;
      } else {
        sessions.unshift({
          id: sessionId,
          userId,
          title: title || "New Chat",
          createdAt: now,
          updatedAt: now,
          status: 'active'
        });
      }
      sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      localStorage.setItem(sessionsKey, JSON.stringify(sessions));
    } catch (e) {
      console.error(`Failed to save session ${sessionId}`, e);
    }
  },

  updateSessionStatus: (userId: string, sessionId: string, status: SessionStatus) => {
    try {
      const sessionsKey = `${SESSIONS_KEY}${userId}`;
      const savedSessions = localStorage.getItem(sessionsKey);
      if (savedSessions) {
        const sessions: ChatSession[] = JSON.parse(savedSessions);
        const index = sessions.findIndex(s => s.id === sessionId);
        if (index >= 0) {
          sessions[index].status = status;
          localStorage.setItem(sessionsKey, JSON.stringify(sessions));
        }
      }
    } catch (e) {
      console.error("Failed to update session status", e);
    }
  },

  deleteSession: (userId: string, sessionId: string) => {
    try {
      localStorage.removeItem(`${MESSAGES_KEY}${sessionId}`);
      const sessionsKey = `${SESSIONS_KEY}${userId}`;
      const savedSessions = localStorage.getItem(sessionsKey);
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions).filter((s: any) => s.id !== sessionId);
        localStorage.setItem(sessionsKey, JSON.stringify(sessions));
      }
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  },

  loadTheme: (): Theme => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Set Galaxy Mode as default
    return { 
      mode: 'dark', 
      snowingEnabled: false, 
      galaxyEnabled: true, 
      christmasEnabled: false 
    };
  },

  saveTheme: (theme: Theme) => {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  },

  applyTheme: () => {
    const theme = storageService.loadTheme();
    const root = document.documentElement;
    
    // Reset all
    root.classList.remove('dark', 'christmas');
    
    if (theme.christmasEnabled) {
      root.classList.add('christmas');
    } else if (theme.mode === 'dark') {
      root.classList.add('dark');
    }
  },

  loadLanguage: (): Language => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved) return saved as Language;
    return 'en';
  },

  saveLanguage: (lang: Language) => {
    localStorage.setItem(LANG_KEY, lang);
  }
};
