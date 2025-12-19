
import { Message, Theme, Language, ChatSession, SessionStatus } from "../types";
import { v4 as uuidv4 } from 'uuid';

const LEGACY_HISTORY_KEY = 'eduassist_chat_history_'; // Old key
const SESSIONS_KEY = 'eduassist_sessions_';
const MESSAGES_KEY = 'eduassist_messages_';
const THEME_KEY = 'eduassist_theme_preference';
const LANG_KEY = 'eduassist_language_preference';

// Helper to check for quota error
const isQuotaExceeded = (e: any) => {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' ||
     e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
};

export const storageService = {
  /**
   * Get all sessions for a user. Migrates legacy data if found.
   */
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
          status: s.status || 'active' // Default to active if missing
        }));
      }

      // Check for legacy single-history data and migrate it
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

          // Save legacy messages to new format
          localStorage.setItem(`${MESSAGES_KEY}${newSessionId}`, JSON.stringify(legacyMessages));
          
          // Add to sessions list
          sessions.unshift(newSession);
          localStorage.setItem(sessionsKey, JSON.stringify(sessions));
        }
        // Remove legacy key
        localStorage.removeItem(legacyKey);
      }

      // Sort by updatedAt desc
      return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (e) {
      console.error("Failed to load sessions", e);
      return [];
    }
  },

  /**
   * Load messages for a specific session
   */
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

  /**
   * Save messages for a specific session and update session metadata
   */
  saveSessionMessages: (userId: string, sessionId: string, messages: Message[], title?: string) => {
    try {
      // 1. Prepare Messages
      const msgKey = `${MESSAGES_KEY}${sessionId}`;
      const cleanMessages = messages.map(({ isStreaming, ...msg }) => msg);
      
      // 2. Try saving messages with quota handling
      try {
        localStorage.setItem(msgKey, JSON.stringify(cleanMessages));
      } catch (e) {
        if (isQuotaExceeded(e)) {
          console.warn("Storage quota exceeded. Attempting cleanup...");
          
          // Strategy A: Delete oldest sessions (LRU)
          const allSessions = storageService.getSessions(userId);
          const otherSessions = allSessions.filter(s => s.id !== sessionId);
          
          if (otherSessions.length > 0) {
            // Delete the oldest session (last in the list because getSessions sorts DESC)
            const oldestSession = otherSessions[otherSessions.length - 1];
            storageService.deleteSession(userId, oldestSession.id);
            console.log(`Deleted old session ${oldestSession.id} to free space.`);
            
            // Retry save recursively
            storageService.saveSessionMessages(userId, sessionId, messages, title);
            return;
          } 
          
          // Strategy B: If no other sessions to delete, strip large media from current session
          console.warn("No other sessions to delete. Stripping media from current session...");
          const strippedMessages = cleanMessages.map(msg => ({
            ...msg,
            // Keep the text, but remove heavy base64 data
            image: msg.image ? undefined : undefined, 
            attachments: msg.attachments ? msg.attachments.map(a => ({
              ...a,
              data: '', // Clear base64 data
              uri: ''   // Clear URI if it's data URI
            })) : undefined,
            text: msg.text + (msg.image || (msg.attachments && msg.attachments.length) ? "\n\n[Media removed to save space]" : "")
          }));

          try {
             localStorage.setItem(msgKey, JSON.stringify(strippedMessages));
          } catch (e2) {
             console.error("Critical: Could not save session even after stripping media.", e2);
             return; // Give up to prevent crash
          }
        } else {
          throw e; // Re-throw if not a quota error
        }
      }

      // 3. Update Session Metadata (Timestamp + Title)
      // We wrap this in try/catch too just in case the sessions list itself is huge
      try {
        const sessionsKey = `${SESSIONS_KEY}${userId}`;
        const savedSessions = localStorage.getItem(sessionsKey);
        let sessions: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];
        
        const existingIndex = sessions.findIndex(s => s.id === sessionId);
        const now = new Date();

        if (existingIndex >= 0) {
          sessions[existingIndex].updatedAt = now;
          if (title) sessions[existingIndex].title = title;
          // Status preserved
        } else {
          // New session
          sessions.unshift({
            id: sessionId,
            userId,
            title: title || "New Chat",
            createdAt: now,
            updatedAt: now,
            status: 'active'
          });
        }

        // Sort and Save
        sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        localStorage.setItem(sessionsKey, JSON.stringify(sessions));
      } catch (e) {
        console.error("Failed to save session metadata", e);
      }

    } catch (e) {
      console.error(`Failed to save session ${sessionId}`, e);
    }
  },

  /**
   * Update the status of a session (e.g., active -> archived)
   */
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

  /**
   * Delete a specific session
   */
  deleteSession: (userId: string, sessionId: string) => {
    try {
      // Remove messages
      localStorage.removeItem(`${MESSAGES_KEY}${sessionId}`);

      // Remove from list
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

  /**
   * Deletes all history for a user (Guest Logout)
   */
  clearAllHistory: (userId: string) => {
    try {
      const sessions = storageService.getSessions(userId);
      sessions.forEach(s => localStorage.removeItem(`${MESSAGES_KEY}${s.id}`));
      localStorage.removeItem(`${SESSIONS_KEY}${userId}`);
      localStorage.removeItem(`${LEGACY_HISTORY_KEY}${userId}`);
    } catch (e) {
      console.error("Failed to clear all history", e);
    }
  },

  loadTheme: (): Theme => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load theme", e);
    }
    return { mode: 'liquid', snowingEnabled: true };
  },

  saveTheme: (theme: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  },

  applyTheme: () => {
    try {
      const theme = storageService.loadTheme();
      const root = document.documentElement;
      
      // Mode logic (for Tailwind dark mode)
      if (theme.mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Default Liquid styles (Ocean Preset as baseline)
      if (theme.mode === 'liquid') {
        root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.15)');
        root.style.setProperty('--glass-text', '#ffffff');
      }
    } catch (e) {
      console.error("Failed to apply theme", e);
    }
  },

  loadLanguage: (): Language => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved) return saved as Language;

      // Auto-detect if no saved preference
      if (typeof navigator !== 'undefined' && navigator.language) {
         const langCode = navigator.language.split('-')[0].toLowerCase();
         // List of supported language codes from types
         const supported = ['en', 'es', 'fr', 'de', 'ja', 'hi', 'zh', 'mr', 'pa', 'te', 'ta', 'kn', 'bn', 'ar', 'pt', 'ru', 'it', 'ko', 'tr', 'sw', 'nl', 'th'];
         
         if (supported.includes(langCode)) {
             return langCode as Language;
         }
      }
    } catch (e) {
       console.error("Failed to load language", e);
    }
    return 'en';
  },

  saveLanguage: (lang: Language) => {
    localStorage.setItem(LANG_KEY, lang);
  }
};
