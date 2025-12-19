
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getChatResponse, editImage, generateSpeech, generateImage, decodeBase64, decodeAudioData } from '../services/gemini';
import { Message, Sender, User, Theme, ThemeMode, Language, ChatSession, Attachment, InputMode, ChatSettings, SessionStatus } from '../types';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { ImageModal } from './ImageModal';
import { Sidebar } from './Sidebar';
import { KnowledgeBaseModal } from './KnowledgeBaseModal';
import { Menu, Search, Sun, Moon, Droplets, Snowflake, Check, Languages, ChevronRight, ArrowLeft, X, Layout, Sparkles, Zap, Brain, Globe, MapPin, Star } from 'lucide-react';
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
  
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    modelMode: 'balanced',
    enableSearch: false,
    enableMaps: false,
    enableImageEditing: false,
    enableAudioResponse: false,
    imageAspectRatio: '1:1'
  });

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
    if (!currentSessionId) {
      const title = text.replace(/[*_~`#]/g, '').trim().split('\n')[0].substring(0, 60) || (t.defaultChatTitle || "Chat");
      storageService.saveSessionMessages(user.id, sessionId, currentMessages, title);
      setSessions(storageService.getSessions(user.id));
    }
    const botMessageId = uuidv4();
    setMessages(prev => [...prev, { id: botMessageId, text: '', sender: Sender.BOT, timestamp: new Date(), isStreaming: true }]);
    isStreamingRef.current = true;
    
    try {
      if (activeMode === 'image-gen') {
        const imageBase64 = await generateImage(text, chatSettings.imageAspectRatio);
        setMessages(prev => {
          const next = prev.map(m => m.id === botMessageId ? { ...m, image: imageBase64, isStreaming: false, text: text, relatedPrompt: text } : m);
          storageService.saveSessionMessages(user.id, sessionId, next);
          return next;
        });
      } else if (activeMode === 'image-edit' && attachments.length > 0) {
         const imageBase64 = await editImage(text, attachments[0]);
         setMessages(prev => {
          const next = prev.map(m => m.id === botMessageId ? { ...m, image: imageBase64, isStreaming: false, text: text } : m);
          storageService.saveSessionMessages(user.id, sessionId, next);
          return next;
         });
      } else {
         const response = await getChatResponse(currentMessages, text, attachments, chatSettings, t.systemInstruction, (chunk) => {
             setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: chunk } : m));
         });
         setMessages(prev => {
          const next = prev.map(m => m.id === botMessageId ? { ...m, text: response.text, isStreaming: false, groundingMetadata: response.groundingMetadata } : m);
          storageService.saveSessionMessages(user.id, sessionId, next);
          return next;
         });
      }
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
      source.connect(audioCtx.destination);
      source.onended = () => setActiveAudioId(null);
      
      setAudioLoadingId(null);
      setActiveAudioId(id);
      source.start();
    } catch (error) {
      console.error("Speech playback failed", error);
      setAudioLoadingId(null);
    }
  };

  const handleToggleSnow = () => {
    onThemeChange({ ...theme, snowingEnabled: !theme.snowingEnabled });
  };

  const handleToggleGalaxy = () => {
    onThemeChange({ ...theme, galaxyEnabled: !theme.galaxyEnabled });
  };

  const displayedMessages = searchQuery ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase())) : messages;

  return (
    <div className="h-screen flex flex-col overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {theme.snowingEnabled && <Snowfall />}
      
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
        <header className="flex-none border-b border-white/5 sticky top-0 z-20 bg-black/80 backdrop-blur-md text-white">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-white/5 transition-colors"><Menu size={24} /></button>
              <h1 className="font-bold truncate max-w-[180px] text-base">{currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : t.defaultChatTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSearching(true)} className="p-2 rounded-xl hover:bg-white/5 transition-colors"><Search size={20} /></button>
            </div>
          </div>
        </header>

        {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSettings(false)}>
            <div className="w-full max-w-xl rounded-[2rem] shadow-2xl p-8 glass-panel text-white border-white/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-2">{t.settings || "Settings"}</h3>
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                </div>
                
                <div className="space-y-10">
                  {/* General Section */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 px-1">{t.settingsGeneral || "General"}</h4>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                             <Languages size={18} className="text-white/40" />
                             <span className="text-sm font-semibold">{t.settingsLanguage || t.language || "Language"}</span>
                          </div>
                          <select 
                            value={appLanguage} 
                            onChange={(e) => onLanguageChange(e.target.value as Language)}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-white/20"
                          >
                             {Object.entries(LANGUAGES).map(([code, name]) => (
                               <option key={code} value={code} className="bg-black">{name}</option>
                             ))}
                          </select>
                       </div>
                    </div>
                  </section>

                  {/* Intelligence Section */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 px-1">{t.settingsIntelligence || "Intelligence"}</h4>
                    <div className="space-y-3">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                          <p className="text-xs font-bold text-white/40 flex items-center gap-2 mb-2"><Brain size={14} /> {t.settingsModeSelection || "Mode Selection"}</p>
                          <div className="grid grid-cols-3 gap-2">
                             {(['fast', 'balanced', 'thinking'] as const).map(m => (
                               <button 
                                 key={m}
                                 onClick={() => setChatSettings(p => ({ ...p, modelMode: m }))}
                                 className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${chatSettings.modelMode === m ? 'bg-white text-black border-white' : 'border-white/5 text-white/40 hover:text-white'}`}
                               >
                                 {m}
                               </button>
                             ))}
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                             <Globe size={18} className="text-white/40" />
                             <span className="text-sm font-semibold">{t.settingsSearchGrounding || "Search Grounding"}</span>
                          </div>
                          <button 
                            onClick={() => setChatSettings(p => ({ ...p, enableSearch: !p.enableSearch }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${chatSettings.enableSearch ? 'bg-indigo-500' : 'bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${chatSettings.enableSearch ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                             <MapPin size={18} className="text-white/40" />
                             <span className="text-sm font-semibold">{t.settingsLocationIntel || "Location Intelligence"}</span>
                          </div>
                          <button 
                            onClick={() => setChatSettings(p => ({ ...p, enableMaps: !p.enableMaps }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${chatSettings.enableMaps ? 'bg-emerald-500' : 'bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${chatSettings.enableMaps ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>
                    </div>
                  </section>

                  {/* Appearance Section */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 px-1">{t.appearance || "Appearance"}</h4>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                             <Star size={18} className="text-white/40" />
                             <span className="text-sm font-semibold">Galaxy Background</span>
                          </div>
                          <button 
                            onClick={handleToggleGalaxy}
                            className={`w-12 h-6 rounded-full transition-colors relative ${theme.galaxyEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme.galaxyEnabled ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                             <Snowflake size={18} className="text-white/40" />
                             <span className="text-sm font-semibold">{t.settingsSnowEffect || "Snow Effect"}</span>
                          </div>
                          <button 
                            onClick={handleToggleSnow}
                            className={`w-12 h-6 rounded-full transition-colors relative ${theme.snowingEnabled ? 'bg-blue-400' : 'bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme.snowingEnabled ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>
                    </div>
                  </section>

                  {/* Account Section */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 px-1">{t.settingsAccount || "Account"}</h4>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/60">
                             {user.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-bold">{user.name}</p>
                             <p className="text-[9px] font-black uppercase tracking-widest text-white/20">EduAssist Build v3.1</p>
                          </div>
                       </div>
                       <button onClick={onLogout} className="px-4 py-2 bg-red-500/10 text-red-400 font-bold text-xs rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all">{t.settingsSignOut || t.logout || "Sign Out"}</button>
                    </div>
                  </section>
                </div>

                <div className="mt-12 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">EduAssist AI — Production Build</p>
                </div>
            </div>
          </div>
        )}

        {showKnowledgeBase && <KnowledgeBaseModal onClose={() => setShowKnowledgeBase(false)} onSelectQuestion={(q) => handleSendMessage(q)} t={t} />}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-4xl mx-auto pb-48 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-700 py-20">
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-white">What are you working on?</h2>
              <p className="text-white/40 max-w-md font-medium">Ask EduAssist AI anything to get started.</p>
            </div>
          ) : (
            displayedMessages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onPlayAudio={handlePlayAudio}
                onEdit={(text) => setChatInput(text)}
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
