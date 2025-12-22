
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getChatResponse, editImage, generateSpeech, generateImage, decodeBase64, decodeAudioData, getChatIdentity } from '../services/gemini';
import { Message, Sender, User, Theme, ThemeMode, Language, ChatSession, Attachment, InputMode, ChatSettings, SessionStatus } from '../types';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { ImageModal } from './ImageModal';
import { Sidebar } from './Sidebar';
import { KnowledgeBaseModal } from './KnowledgeBaseModal';
import { Menu, Search, Sun, Moon, Droplets, Snowflake, Check, Languages, ChevronRight, ArrowLeft, X, Layout, Sparkles, Zap, Brain, Globe, MapPin, Star, Sparkle, Gift, Wand2 } from 'lucide-react';
import { storageService } from '../services/storage';
import { TRANSLATIONS, LANGUAGES } from '../services/translations';

interface ChatInterfaceProps {
  user: User;
  onLogout: () => void;
  appLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const SantaHatRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let hats: { 
      x: number; 
      y: number; 
      size: number; 
      speed: number; 
      color: string; 
      angle: number; 
      swing: number 
    }[] = [];
    const count = 15; // Low count for subtlety

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      hats = [];
      for (let i = 0; i < count; i++) {
        hats.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 10 + 15,
          speed: Math.random() * 0.5 + 0.3,
          color: Math.random() > 0.5 ? '#ef4444' : '#22c55e', // Red or Green
          angle: Math.random() * Math.PI * 2,
          swing: Math.random() * 0.02 + 0.01
        });
      }
    };

    const drawHat = (x: number, y: number, size: number, color: string, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(angle) * 0.2);
      ctx.globalAlpha = 0.2; // Very subtle

      // Hat Body (Triangle)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-size / 2, size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.lineTo(0, -size / 2);
      ctx.closePath();
      ctx.fill();

      // White Trim (Base)
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.roundRect(-size / 2 - 2, size / 2 - 2, size + 4, 6, 4);
      ctx.fill();

      // Pom Pom
      ctx.beginPath();
      ctx.arc(0, -size / 2 - 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hats.forEach(h => {
        drawHat(h.x, h.y, h.size, h.color, h.angle);
        h.y += h.speed;
        h.angle += h.swing;
        h.x += Math.sin(h.angle * 0.5) * 0.5;

        if (h.y > canvas.height + h.size) {
          h.y = -h.size;
          h.x = Math.random() * canvas.width;
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    draw();

    const handleResize = () => init();
    window.addEventListener('resize', handleResize);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
};

const Snowfall: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; radius: number; speed: number; opacity: number }[] = [];
    const count = 70;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          speed: Math.random() * 1 + 0.5,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    };

    const draw = () => {
      if (document.visibilityState === 'hidden') {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      
      particles.forEach(p => {
        ctx.beginPath();
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        p.y += p.speed;
        p.x += Math.sin(p.y / 30) * 0.5;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    draw();

    const handleResize = () => init();
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onLogout, appLanguage, onLanguageChange, theme, onThemeChange }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  
  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem(`eduassist_settings_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    return {
      modelMode: 'balanced',
      enableSearch: false,
      enableMaps: false,
      enableImageEditing: false,
      enableAudioResponse: false,
      imageAspectRatio: '1:1',
      systemInstruction: ''
    };
  });

  useEffect(() => {
    localStorage.setItem(`eduassist_settings_${user.id}`, JSON.stringify(chatSettings));
  }, [chatSettings, user.id]);

  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [selectedImage, setSelectedImage] = useState<{ url: string; prompt?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  // Audio state
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);

  const t = useMemo(() => {
    const targetLang = appLanguage === 'auto' ? 'en' : appLanguage;
    return TRANSLATIONS[targetLang] || TRANSLATIONS['en'];
  }, [appLanguage]);

  const isRTL = appLanguage === 'ar';

  useEffect(() => {
    const userSessions = storageService.getSessions(user.id);
    setSessions(userSessions);
    if (userSessions.length > 0) {
      selectSession(userSessions[0].id);
    } else {
      startNewChat();
    }
  }, [user.id]); 

  useEffect(() => {
    const behavior = isStreamingRef.current ? 'auto' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, [messages, isLoading]);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    const loaded = storageService.loadSessionMessages(sessionId);
    setMessages(loaded);
    setInputMode('text');
    setIsSearching(false);
    setSidebarOpen(false);
  }, []);

  const startNewChat = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputMode('text');
    setIsSearching(false);
    setSidebarOpen(false);
  }, []);

  const updateSessionStatus = (sessionId: string, status: SessionStatus) => {
    storageService.updateSessionStatus(user.id, sessionId, status);
    setSessions(storageService.getSessions(user.id));
    if (currentSessionId === sessionId && status !== 'active') startNewChat();
  };

  const handleSendMessage = useCallback(async (text: string, attachments: Attachment[] = [], forcedMode?: InputMode) => {
    const activeMode = forcedMode || inputMode;
    const sessionId = currentSessionId || uuidv4();
    if (!currentSessionId) setCurrentSessionId(sessionId);
    const userMessage: Message = { id: uuidv4(), text, sender: Sender.USER, timestamp: new Date(), attachments };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setIsLoading(true);

    const botMessageId = uuidv4();
    setMessages(prev => [...prev, { id: botMessageId, text: '', sender: Sender.BOT, timestamp: new Date(), isStreaming: true }]);
    isStreamingRef.current = true;
    
    try {
      let finalBotText = '';
      let groundingMetadata;

      const instruction = chatSettings.systemInstruction?.trim() || t.systemInstruction;

      if (activeMode === 'image-gen') {
        const imageBase64 = await generateImage(text, chatSettings.imageAspectRatio);
        finalBotText = text;
        setMessages(prev => {
          const next = prev.map(m => m.id === botMessageId ? { ...m, image: imageBase64, isStreaming: false, text: text, relatedPrompt: text } : m);
          return next;
        });
      } else if (activeMode === 'image-edit' && attachments.length > 0) {
         const imageBase64 = await editImage(text, attachments[0]);
         finalBotText = text;
         setMessages(prev => {
          const next = prev.map(m => m.id === botMessageId ? { ...m, image: imageBase64, isStreaming: false, text: text } : m);
          return next;
         });
      } else {
         const response = await getChatResponse(currentMessages, text, attachments, chatSettings, instruction, (chunk) => {
             setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: chunk } : m));
         });
         finalBotText = response.text;
         groundingMetadata = response.groundingMetadata;
         setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: response.text, isStreaming: false, groundingMetadata: response.groundingMetadata } : m));
      }

      // Dynamic Naming Step: Update identity based on context
      const fullHistoryForIdentity = [...currentMessages, { id: botMessageId, text: finalBotText, sender: Sender.BOT, timestamp: new Date() } as Message];
      const newIdentity = await getChatIdentity(fullHistoryForIdentity);
      
      // Save everything to storage
      storageService.saveSessionMessages(user.id, sessionId, fullHistoryForIdentity, newIdentity);
      setSessions(storageService.getSessions(user.id));

    } catch (error: any) {
      setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: error.message || "Error occurred.", isError: true, isStreaming: false } : m));
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
    }
  }, [messages, currentSessionId, inputMode, chatSettings, user.id, t]);

  const handleDetailedFeedback = useCallback((msgId: string, feedbackText: string, shouldImprove: boolean) => {
    setMessages(prev => {
      const next: Message[] = prev.map(m => m.id === msgId ? { ...m, feedback: 'negative' as 'negative' } : m);
      if (currentSessionId) storageService.saveSessionMessages(user.id, currentSessionId, next);
      return next;
    });

    if (shouldImprove && feedbackText) {
      handleSendMessage(`Please improve your previous answer. I wasn't happy with it because: ${feedbackText}. Provide a corrected and more helpful response.`);
    }
  }, [currentSessionId, user.id, handleSendMessage]);

  const handleRecreate = useCallback((msgId: string) => {
    const index = messages.findIndex(m => m.id === msgId);
    if (index > 0 && messages[index - 1].sender === Sender.USER) {
      const prevUserMsg = messages[index - 1];
      const newMessages = messages.slice(0, index);
      setMessages(newMessages);
      handleSendMessage(prevUserMsg.text, prevUserMsg.attachments || []);
    }
  }, [messages, handleSendMessage]);

  const handleFeedback = useCallback((msgId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => {
      const next = prev.map(m => m.id === msgId ? { ...m, feedback } : m);
      if (currentSessionId) storageService.saveSessionMessages(user.id, currentSessionId, next);
      return next;
    });
  }, [currentSessionId, user.id]);

  const handleShare = useCallback(async (text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'EduAssist AI Response',
          text: text,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  }, []);

  const handleBranch = useCallback((msgId: string) => {
    const index = messages.findIndex(m => m.id === msgId);
    if (index >= 0) {
      const branchedHistory = messages.slice(0, index + 1);
      const newSessionId = uuidv4();
      const firstUserMsg = branchedHistory.find(m => m.sender === Sender.USER);
      const title = firstUserMsg ? `Branch: ${firstUserMsg.text.substring(0, 30)}...` : 'Branched Chat';
      
      storageService.saveSessionMessages(user.id, newSessionId, branchedHistory, title);
      setSessions(storageService.getSessions(user.id));
      selectSession(newSessionId);
    }
  }, [messages, user.id, selectSession]);

  const handlePlayAudio = async (id: string, text: string) => {
    if (activeAudioId === id) {
      setActiveAudioId(null);
      return;
    }

    try {
      setAudioLoadingId(id);
      const base64Audio = await generateSpeech(text, appLanguage);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decoded = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(decoded, audioCtx, 24000, 1);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create a gain node to make the voice output louder
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 3.0; // Boost volume significantly as requested
      
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      source.onended = () => setActiveAudioId(null);
      
      setAudioLoadingId(null);
      setActiveAudioId(id);
      source.start();
    } catch (error) {
      console.error("Speech playback failed", error);
      setAudioLoadingId(null);
    }
  };

  const handleToggleTheme = () => {
    onThemeChange({ ...theme, mode: theme.mode === 'dark' ? 'light' : 'dark', christmasEnabled: false });
  };

  const handleToggleSnow = () => {
    onThemeChange({ ...theme, snowingEnabled: !theme.snowingEnabled });
  };

  const handleToggleGalaxy = () => {
    onThemeChange({ ...theme, galaxyEnabled: !theme.galaxyEnabled });
  };

  const handleToggleChristmas = () => {
    onThemeChange({ 
      ...theme, 
      christmasEnabled: !theme.christmasEnabled,
      // Automatically enable snow for christmas mode
      snowingEnabled: !theme.christmasEnabled ? true : theme.snowingEnabled
    });
  };

  const currentTitle = useMemo(() => {
    if (!currentSessionId) return t.defaultChatTitle;
    const session = sessions.find(s => s.id === currentSessionId);
    return session?.title || t.defaultChatTitle;
  }, [currentSessionId, sessions, t.defaultChatTitle]);

  const displayedMessages = searchQuery ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase())) : messages;

  return (
    <div className="h-screen flex flex-col overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {theme.snowingEnabled && <Snowfall />}
      {theme.christmasEnabled && <SantaHatRain />}
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        sessions={sessions} 
        currentSessionId={currentSessionId} 
        onNewChat={startNewChat} 
        onSelectSession={selectSession} 
        onDeleteSession={(id) => { storageService.deleteSession(user.id, id); setSessions(storageService.getSessions(user.id)); }} 
        onArchiveSession={(id) => updateSessionStatus(id, 'archived')} 
        onHideSession={(id) => updateSessionStatus(id, 'hidden')} 
        onOpenSettings={() => setShowSettings(true)} 
        onOpenKnowledgeBase={() => setShowKnowledgeBase(true)} 
        onLogout={onLogout} 
        user={user} 
        t={t} 
        themeMode={theme.mode} 
      />
      
      <div className="flex-1 flex flex-col h-full relative z-10">
        <header className="flex-none border-b border-white/5 sticky top-0 z-20 bg-white/80 dark:bg-black/80 christmas:bg-emerald-950/80 backdrop-blur-md text-slate-900 dark:text-white christmas:text-amber-100 transition-colors duration-400">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 christmas:hover:bg-white/20 transition-colors"><Menu size={24} /></button>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold truncate max-w-[200px] text-base transition-all duration-500 animate-in slide-in-from-left-2 fade-in" key={currentTitle}>
                    {currentTitle}
                  </h1>
                  {currentSessionId && <Sparkle size={12} className="text-indigo-500 dark:text-indigo-400 christmas:text-amber-400 animate-pulse" />}
                </div>
                {currentSessionId && <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 christmas:text-red-300/50 leading-none">Context Active</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSearching(true)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 christmas:hover:bg-white/20 transition-colors"><Search size={20} /></button>
            </div>
          </div>
        </header>

        {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSettings(false)}>
            <div className="w-full max-w-xl rounded-[2rem] shadow-2xl p-8 glass-panel text-slate-900 dark:text-white christmas:text-amber-50 border-black/5 dark:border-white/10 christmas:border-red-500/40 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-2">{t.settings || "Settings"}</h3>
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                </div>
                
                <div className="space-y-10">
                  {/* Appearance Section */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 christmas:text-amber-200/40 mb-4 px-1">{t.appearance || "Appearance"}</h4>
                    <div className="space-y-4">
                       {/* Theme Selector */}
                       <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-3">
                             {theme.mode === 'dark' ? <Moon size={18} className="text-slate-400 dark:text-white/40" /> : <Sun size={18} className="text-slate-400 dark:text-white/40" />}
                             <span className="text-sm font-semibold">Dark Mode</span>
                          </div>
                          <button 
                            onClick={handleToggleTheme}
                            className={`w-12 h-6 rounded-full transition-colors relative ${theme.mode === 'dark' && !theme.christmasEnabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme.mode === 'dark' && !theme.christmasEnabled ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>

                       {/* Christmas Mode Toggle */}
                       <div className="flex items-center justify-between p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/30 ring-2 ring-emerald-500/20">
                          <div className="flex items-center gap-3">
                             <Gift size={18} className="text-red-500" />
                             <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Christmas Mode (Red & Green)</span>
                          </div>
                          <button 
                            onClick={handleToggleChristmas}
                            className={`w-12 h-6 rounded-full transition-colors relative ${theme.christmasEnabled ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-slate-200 dark:bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme.christmasEnabled ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-3">
                             <Star size={18} className="text-slate-400 dark:text-white/40" />
                             <span className="text-sm font-semibold">Galaxy Background</span>
                          </div>
                          <button 
                            onClick={handleToggleGalaxy}
                            className={`w-12 h-6 rounded-full transition-colors relative ${theme.galaxyEnabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme.galaxyEnabled ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-3">
                             <Snowflake size={18} className="text-slate-400 dark:text-white/40" />
                             <span className="text-sm font-semibold">{t.settingsSnowEffect || "Snow Effect"}</span>
                          </div>
                          <button 
                            onClick={handleToggleSnow}
                            className={`w-12 h-6 rounded-full transition-colors relative ${theme.snowingEnabled ? 'bg-blue-400' : 'bg-slate-200 dark:bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme.snowingEnabled ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>
                    </div>
                  </section>
                  
                  {/* Intelligence Section */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 mb-4 px-1">{t.settingsIntelligence || "Intelligence"}</h4>
                    <div className="space-y-4">
                       <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Brain size={18} className="text-slate-400 dark:text-white/40" />
                                <span className="text-sm font-semibold">System Instruction</span>
                             </div>
                             <button 
                               onClick={() => setChatSettings(prev => ({ ...prev, systemInstruction: '' }))}
                               className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest"
                             >
                               Reset to Default
                             </button>
                          </div>
                          <textarea 
                             value={chatSettings.systemInstruction}
                             onChange={(e) => setChatSettings(prev => ({ ...prev, systemInstruction: e.target.value }))}
                             placeholder="Set the AI's personality, behavior, and expert role..."
                             className="w-full h-32 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none text-slate-800 dark:text-white"
                          />
                          <p className="text-[10px] text-slate-400 dark:text-white/20 italic">
                             Leave empty to use the default EduAssist tutor personality.
                          </p>
                       </div>
                    </div>
                  </section>

                  {/* General Section */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 mb-4 px-1">{t.settingsGeneral || "General"}</h4>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-3">
                             <Languages size={18} className="text-slate-400 dark:text-white/40" />
                             <span className="text-sm font-semibold">{t.settingsLanguage || t.language || "Language"}</span>
                          </div>
                          <select 
                            value={appLanguage} 
                            onChange={(e) => onLanguageChange(e.target.value as Language)}
                            className="bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                          >
                             {Object.entries(LANGUAGES).map(([code, name]) => (
                               <option key={code} value={code} className="bg-white dark:bg-black text-slate-900 dark:text-white">{name}</option>
                             ))}
                          </select>
                       </div>
                    </div>
                  </section>
                </div>

                <div className="mt-12 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/10">EduAssist AI — Festive Build v3.2</p>
                </div>
            </div>
          </div>
        )}

        {showKnowledgeBase && <KnowledgeBaseModal onClose={() => setShowKnowledgeBase(false)} onSelectQuestion={(q) => handleSendMessage(q)} t={t} />}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-4xl mx-auto pb-48 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-700 py-20">
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-slate-900 dark:text-white christmas:text-amber-100">Merry Christmas! 🎄</h2>
              <p className="text-slate-400 dark:text-white/40 christmas:text-amber-100/60 max-w-md font-medium italic">"Ho ho ho! Ready to learn something jolly today?"</p>
            </div>
          ) : (
            displayedMessages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onPlayAudio={handlePlayAudio}
                onEdit={(text) => setChatInput(text)}
                onRetry={handleRecreate}
                onRecreate={handleRecreate}
                onFeedback={handleFeedback}
                onDetailedFeedback={handleDetailedFeedback}
                onShare={handleShare}
                onBranch={handleBranch}
                onImageClick={(url, prompt) => setSelectedImage({ url, prompt })}
                audioState={
                  audioLoadingId === msg.id ? { status: 'loading' } : 
                  activeAudioId === msg.id ? { status: 'playing' } : 
                  null
                }
                themeMode={theme.mode}
                t={t}
              />
            ))
          )}
          <div ref={messagesEndRef} className="h-1" />
        </main>

        <InputArea 
          onSend={handleSendMessage} 
          isLoading={isLoading} 
          placeholder="Ask anything" 
          mode={inputMode} 
          setMode={setInputMode} 
          chatSettings={chatSettings} 
          setChatSettings={setChatSettings} 
          imageModePlaceholder={t.describeImage} 
          onOpenKnowledgeBase={() => setShowKnowledgeBase(true)}
          input={chatInput}
          setInput={setChatInput}
          t={t} 
        />

        {selectedImage && (
          <ImageModal 
            imageUrl={selectedImage.url} 
            prompt={selectedImage.prompt} 
            onClose={() => setSelectedImage(null)} 
            onRecreate={(prompt) => {
              handleSendMessage(prompt, [], 'image-gen');
              setSelectedImage(null);
            }} 
            language={appLanguage} 
          />
        )}
      </div>
    </div>
  );
};
