
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getChatResponse, editImage, generateSpeech, generateImage, decodeBase64, decodeAudioData } from '../services/gemini';
import { Message, Sender, User, Theme, ThemeMode, Language, ChatSession, Attachment, InputMode, ChatSettings, SessionStatus } from '../types';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { ImageModal } from './ImageModal';
import { Sidebar } from './Sidebar';
import { KnowledgeBaseModal } from './KnowledgeBaseModal';
import { Menu, Search, Sun, Moon, Droplets, Snowflake, Check, Languages, ChevronRight, ArrowLeft, X } from 'lucide-react';
import { storageService } from '../services/storage';
import { TRANSLATIONS, LANGUAGES } from '../services/translations';

interface ChatInterfaceProps {
  user: User;
  onLogout: () => void;
  appLanguage: Language;
  onLanguageChange: (lang: Language) => void;
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

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onLogout, appLanguage, onLanguageChange }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(() => storageService.loadTheme());
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'language'>('main');
  
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
    const onboardingKey = `eduassist_onboarded_${user.id}`;
    if (!localStorage.getItem(onboardingKey)) {
       localStorage.setItem(onboardingKey, 'true');
       const guideSessionId = uuidv4();
       const now = new Date();
       const cleanName = user.name.toLowerCase().includes('guest') ? '' : ` ${user.name}`;
       const guideMessages: Message[] = [
          { id: uuidv4(), text: (t.guideWelcome || "👋 Hi!").replace('{name}', cleanName), sender: Sender.BOT, timestamp: new Date(now.getTime() - 2000) },
          { id: uuidv4(), text: t.guideCapabilities || "I can help!", sender: Sender.BOT, timestamp: new Date(now.getTime() - 1500) },
          { id: uuidv4(), text: t.guideReady || "Ready?", sender: Sender.BOT, timestamp: now }
       ];
       setCurrentSessionId(guideSessionId);
       setMessages(guideMessages);
       storageService.saveSessionMessages(user.id, guideSessionId, guideMessages, t.guideSessionTitle || "Guide");
    } else if (userSessions.length > 0) {
       selectSession(userSessions[0].id);
    } else {
       startNewChat();
    }
  }, [user.id, t]); 

  useEffect(() => {
    const behavior = isStreamingRef.current ? 'auto' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, [messages, isLoading]);

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setMessages(storageService.loadSessionMessages(sessionId));
    setInputMode('text');
    setIsSearching(false);
    setSidebarOpen(false);
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    const cleanName = user.name.toLowerCase().includes('guest') ? '' : user.name;
    const welcomeText = (user.role === 'teacher' ? (t.welcomeTeacher || "Hello Teacher!") : t.welcome).replace('{name}', cleanName);
    setMessages([{ id: 'welcome-msg', text: welcomeText, sender: Sender.BOT, timestamp: new Date() }]);
    setInputMode('text');
    setIsSearching(false);
    setSidebarOpen(false);
  };

  const updateSessionStatus = (sessionId: string, status: SessionStatus) => {
    storageService.updateSessionStatus(user.id, sessionId, status);
    setSessions(storageService.getSessions(user.id));
    if (currentSessionId === sessionId && status !== 'active') startNewChat();
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
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
      if (inputMode === 'image-gen') {
        // Variation logic: Append random seeds and modifiers to prompt to ensure model generates fresh variations
        const variationModifiers = [
          "cinematic masterwork", "highly intricate details", "unique perspective", 
          "dramatic lighting", "vibrant color palette", "sharp artistic focus",
          "creative composition", "premium textures", "professional digital art style"
        ];
        const randomModifier = variationModifiers[Math.floor(Math.random() * variationModifiers.length)];
        const variationId = Math.floor(Math.random() * 100000);
        // Combine user text with variation logic
        const variationPrompt = `${text}, ${randomModifier} (variation #${variationId})`;
        
        const imageBase64 = await generateImage(variationPrompt, chatSettings.imageAspectRatio);
        setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, image: imageBase64, isStreaming: false, text: "Image generated.", relatedPrompt: text } : m));

      } else if (inputMode === 'image-edit' && attachments.length > 0) {
         const imageBase64 = await editImage(text, attachments[0]);
         setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, image: imageBase64, isStreaming: false, text: "Image edited." } : m));
      
      } else {
         const response = await getChatResponse(currentMessages, text, attachments, chatSettings, t.systemInstruction, (chunk) => {
             setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: chunk } : m));
         });
         setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: response.text, isStreaming: false, groundingMetadata: response.groundingMetadata } : m));
      }
    } catch (error: any) {
      setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: error.message || "Error occurred.", isError: true, isStreaming: false } : m));
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
      setTimeout(() => {
        setMessages(prev => { storageService.saveSessionMessages(user.id, sessionId, prev); return prev; });
      }, 100);
    }
  };

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

  const handleThemeChange = (mode: ThemeMode) => {
    const newTheme = { ...theme, mode };
    setTheme(newTheme);
    storageService.saveTheme(newTheme);
    storageService.applyTheme();
  };

  const toggleSnow = () => {
    const newTheme = { ...theme, snowingEnabled: !theme.snowingEnabled };
    setTheme(newTheme);
    storageService.saveTheme(newTheme);
  };

  const isDark = theme.mode === 'dark';
  const isLiquid = theme.mode === 'liquid';
  const displayedMessages = searchQuery ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase())) : messages;

  return (
    <div className={`${isDark ? 'dark' : ''} h-screen flex flex-col overflow-hidden relative`} dir={isRTL ? 'rtl' : 'ltr'}>
      {isLiquid && <div className="fixed inset-0 liquid-bg z-0 pointer-events-none"></div>}
      {theme.snowingEnabled && <Snowfall key="active-snowfall" />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} sessions={sessions} currentSessionId={currentSessionId} onNewChat={startNewChat} onSelectSession={selectSession} onDeleteSession={(id) => { storageService.deleteSession(user.id, id); setSessions(storageService.getSessions(user.id)); }} onArchiveSession={(id) => updateSessionStatus(id, 'archived')} onHideSession={(id) => updateSessionStatus(id, 'hidden')} onOpenSettings={() => { setSettingsView('main'); setShowSettings(true); }} onOpenKnowledgeBase={() => setShowKnowledgeBase(true)} onLogout={onLogout} user={user} t={t} themeMode={theme.mode} />
      <div className={`flex-1 flex flex-col h-full relative z-10 ${isLiquid ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-950'}`}>
        <header className={`flex-none backdrop-blur-md border-b sticky top-0 z-20 transition-colors ${isLiquid ? 'bg-white/5 border-white/10 text-white' : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'}`}>
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            {isSearching ? (<div className="flex-1 flex items-center gap-2"><Search size={16} className="text-slate-400" /><input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setIsSearching(false)} className="flex-1 bg-transparent border-none outline-none text-sm" placeholder={t.searchPlaceholder} /><button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-xs font-bold hover:underline">{t.cancel}</button></div>) : (<><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-lg hover:bg-white/10 transition-colors`}><Menu size={24} /></button><h1 className="font-bold truncate max-w-[180px]">{currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : (t.defaultChatTitle || "EduAssist AI")}</h1></div><button onClick={() => setIsSearching(true)} className={`p-2 rounded-lg hover:bg-white/10 transition-colors`}><Search size={20} /></button></>)}
          </div>
        </header>
        {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSettings(false)}>
            <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isLiquid ? 'glass-panel text-white' : 'bg-white dark:bg-slate-900'} overflow-hidden relative`} onClick={e => e.stopPropagation()}>
              {settingsView === 'main' ? (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-6"><h3 className="font-bold text-lg">{t.settings}</h3><button onClick={() => setShowSettings(false)} className="p-1 hover:bg-black/5 rounded-full"><X size={20} /></button></div>
                  <div className="space-y-6">
                    <div><label className="block text-xs font-semibold uppercase tracking-wider mb-3 opacity-60">{t.appearance}</label><div className="grid grid-cols-3 gap-2">{['light', 'dark', 'liquid'].map((m) => (<button key={m} onClick={() => handleThemeChange(m as ThemeMode)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${theme.mode === m ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>{m === 'light' ? <Sun size={20} /> : m === 'dark' ? <Moon size={20} /> : <Droplets size={20} />}<span className="text-[10px] mt-1 capitalize">{t[m] || m}</span></button>))}</div></div>
                    <div className="pt-2"><label className="block text-xs font-semibold uppercase tracking-wider mb-3 opacity-60">{t.language}</label><button onClick={() => setSettingsView('language')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all bg-white/5 hover:bg-white/10`}><div className="flex items-center gap-3"><Languages size={20} className="text-indigo-500" /><span className="text-sm font-medium">{LANGUAGES[appLanguage]}</span></div><ChevronRight size={18} className="opacity-40" /></button></div>
                    <div className="pt-4 border-t border-black/10 dark:border-white/10"><button onClick={(e) => { e.stopPropagation(); toggleSnow(); }} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${theme.snowingEnabled ? 'bg-indigo-600 text-white' : 'bg-black/5 dark:bg-white/5 text-slate-500'}`}><div className="flex items-center gap-3"><Snowflake size={20} className={theme.snowingEnabled ? 'animate-spin-slow' : ''} /><span className="text-sm font-semibold">Snowing Effect</span></div><div className={`w-10 h-6 rounded-full relative transition-colors ${theme.snowingEnabled ? 'bg-white/30' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${theme.snowingEnabled ? 'translate-x-5' : 'translate-x-1'}`} /></div></button></div>
                  </div>
                </div>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6"><button onClick={() => setSettingsView('main')} className="p-1 hover:bg-black/5 rounded-full"><ArrowLeft size={20} /></button><h3 className="font-bold text-lg">{t.language}</h3></div>
                  <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">{Object.entries(LANGUAGES).map(([key, label]) => (<button key={key} onClick={() => { onLanguageChange(key as Language); setSettingsView('main'); }} className={`flex items-center justify-between p-3 rounded-xl text-left text-sm transition-all ${appLanguage === key ? 'bg-indigo-600 text-white' : 'hover:bg-white/10'}`}><span>{label}</span>{appLanguage === key && <Check size={16} />}</button>))}</div>
                </div>
              )}
            </div>
          </div>
        )}
        {showKnowledgeBase && <KnowledgeBaseModal onClose={() => setShowKnowledgeBase(false)} onSelectQuestion={(q) => handleSendMessage(q)} t={t} />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-4xl mx-auto pb-32">
          {displayedMessages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              themeMode={theme.mode} 
              onPlayAudio={handlePlayAudio}
              onImageClick={(url, prompt) => setSelectedImage({ url, prompt })}
              audioState={
                audioLoadingId === msg.id ? { status: 'loading' } : 
                activeAudioId === msg.id ? { status: 'playing' } : 
                null
              }
            />
          ))}
          <div ref={messagesEndRef} className="h-1" />
        </main>
        <InputArea 
          onSend={handleSendMessage} 
          isLoading={isLoading} 
          placeholder={t.placeholder} 
          mode={inputMode} 
          setMode={setInputMode} 
          chatSettings={chatSettings} 
          setChatSettings={setChatSettings} 
          imageModePlaceholder={t.describeImage} 
          input={chatInput}
          setInput={setChatInput}
          t={t} 
          themeMode={theme.mode} 
        />
        {selectedImage && (
          <ImageModal 
            imageUrl={selectedImage.url} 
            prompt={selectedImage.prompt} 
            onClose={() => setSelectedImage(null)} 
            onRecreate={(prompt) => {
              setChatInput(prompt);
              setInputMode('image-gen');
            }} 
            language={appLanguage} 
          />
        )}
      </div>
    </div>
  );
};
