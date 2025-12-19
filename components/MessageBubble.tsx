
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, AlertCircle, RefreshCw, Palette, Volume2, VolumeX, Link as LinkIcon, Play, Pause, Loader2, Square, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { Message, Sender, ThemeMode } from '../types';

interface MessageBubbleProps {
  message: Message;
  onRetry?: (id: string) => void;
  onImageClick?: (url: string, prompt?: string) => void;
  onPlayAudio?: (id: string, text: string) => void;
  audioState?: { status: 'loading' | 'playing' } | null;
  themeMode?: ThemeMode;
}

const CustomAudioPlayer: React.FC<{ src: string; isUser: boolean }> = ({ src, isUser }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current?.paused) { audioRef.current.play(); setIsPlaying(true); } 
    else { audioRef.current?.pause(); setIsPlaying(false); }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      const lastVolume = volume > 0 ? volume : 0.5;
      setVolume(lastVolume);
      if (audioRef.current) audioRef.current.volume = lastVolume;
      setIsMuted(false);
    } else {
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-[1.5rem] min-w-[260px] glass-panel transition-all ${isUser ? 'bg-white/20' : ''}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white shrink-0">
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col justify-center gap-1.5">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 transition-all duration-300" style={{ width: `${(currentTime/duration)*100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-white/60 font-medium">
            <span>{Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2, '0')}</span>
            <span>{Math.floor(duration/60)}:{Math.floor(duration%60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 pb-1 border-t border-white/5 pt-2 group">
        <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors">
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={handleVolumeChange}
          className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-400"
        />
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry, onImageClick, onPlayAudio, audioState, themeMode }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const isUser = message.sender === Sender.USER;
  const isError = message.isError;
  const hasImage = !!message.image;
  const hasAttachments = message.attachments && message.attachments.length > 0;

  const bubbleClasses = isUser
    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-[2rem] rounded-tr-sm shadow-xl shadow-indigo-900/20"
    : isError
      ? "bg-red-500/20 border-red-500/30 text-white border rounded-[2rem] rounded-tl-sm backdrop-blur-ios saturate-150"
      : "glass-panel text-white rounded-[2rem] rounded-tl-sm ios-shadow saturate-150";

  const getCleanErrorMessage = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.error) {
        if (parsed.error.code === 403 || parsed.error.status === "PERMISSION_DENIED") {
          return "API Permission Denied. This usually means your API key needs billing enabled or permissions for this model are restricted.";
        }
        return parsed.error.message || raw;
      }
      return raw;
    } catch {
      if (raw.includes('403') || raw.includes('PERMISSION_DENIED')) {
          return "Access Denied. Please ensure your API key has the correct permissions.";
      }
      return raw;
    }
  };

  const handleFixAccess = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
    }
  };

  return (
    <div className={`flex w-full mb-8 animate-ios-pop ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[88%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        <div className={`flex-shrink-0 h-11 w-11 rounded-ios flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
          isUser 
            ? 'bg-indigo-500' 
            : isError 
              ? 'bg-red-500/40 border border-red-500/50' 
              : 'glass-panel text-indigo-400'
        }`}>
          {isUser ? <User size={22} className="text-white" /> : isError ? <AlertCircle size={22} className="text-white" /> : hasImage ? <Palette size={22} /> : <Bot size={22} />}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
          <div className={`px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed relative group ios-shadow ${bubbleClasses}`}>
            {hasAttachments && (
              <div className="flex flex-col gap-3 mb-3">
                {message.attachments!.map((att, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden border border-white/10 bg-black/10">
                    {att.type === 'image' ? (
                       <img src={att.uri} alt="attachment" className="max-h-64 w-full object-cover" />
                    ) : att.type === 'audio' ? (
                       <CustomAudioPlayer src={att.uri} isUser={isUser} />
                    ) : (
                      <div className="p-3 flex items-center gap-3">
                         <div className="p-2 bg-white/10 rounded-xl"><LinkIcon size={16} className="text-white/60" /></div>
                         <span className="text-sm font-medium text-white/90 truncate">{att.name || 'File'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isUser ? (
              <p className="whitespace-pre-wrap">{message.text}</p>
            ) : isError ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-red-100 font-bold uppercase tracking-widest text-[10px]">
                  <AlertCircle size={14} /> System Error
                </div>
                <p className="font-medium text-red-50">{getCleanErrorMessage(message.text)}</p>
                
                <div className="flex flex-wrap gap-2">
                  {(message.text.includes('403') || message.text.includes('PERMISSION_DENIED')) && (
                    <button 
                      onClick={handleFixAccess} 
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-red-600 hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                    >
                      <Key size={14} /> Fix Access
                    </button>
                  )}
                  {onRetry && (
                    <button onClick={() => onRetry(message.id)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
                      <RefreshCw size={14} /> Retry
                    </button>
                  )}
                </div>

                <div className="border-t border-white/10 pt-2">
                   <button 
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="flex items-center gap-1 text-[9px] font-bold text-white/40 hover:text-white/60 uppercase tracking-tighter"
                   >
                     {showTechnicalDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />} Technical Details
                   </button>
                   {showTechnicalDetails && (
                     <div className="mt-2 p-2 bg-black/30 rounded-lg overflow-x-auto">
                        <code className="text-[10px] font-mono text-red-200/60 block whitespace-pre-wrap">
                          {message.text}
                        </code>
                     </div>
                   )}
                </div>
              </div>
            ) : hasImage ? (
               <div className="space-y-3">
                 <div className="relative overflow-hidden rounded-[1.5rem] bg-black/20 border border-white/10 min-h-[220px] flex items-center justify-center group/img">
                    {message.image ? (
                       <img src={message.image} alt="Generated" className="w-full h-auto object-cover cursor-zoom-in transition-transform group-hover/img:scale-[1.02]" onClick={() => onImageClick && onImageClick(message.image!, message.relatedPrompt)} />
                    ) : (
                       <Loader2 className="animate-spin text-white/40" size={32} />
                    )}
                 </div>
                 {message.text && message.text !== "Generated image:" && (
                     <p className="text-sm text-white/80 italic font-medium">"{message.text}"</p>
                 )}
               </div>
            ) : (
              <div className="markdown-content prose prose-sm prose-invert max-w-none text-white/95">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                    code: ({ children, inline }: any) => <code className={`${inline ? 'px-1.5 py-0.5 rounded-lg bg-white/10 text-indigo-300' : 'block p-4 rounded-2xl bg-black/30 border border-white/5 text-xs font-mono mb-4'}`}>{children}</code>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                    li: ({ children }) => <li className="text-white/90">{children}</li>,
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-1">{children}</h2>
                  }}
                >
                  {message.text}
                </ReactMarkdown>
                {message.isStreaming && <span className="inline-block w-2.5 h-4.5 ml-1.5 align-middle bg-indigo-400 rounded-sm animate-pulse" />}
              </div>
            )}
            
            {!isUser && !isError && !hasImage && !message.isStreaming && onPlayAudio && (
              <button 
                onClick={() => onPlayAudio(message.id, message.text)} 
                className={`absolute -bottom-3 -right-3 p-2.5 rounded-full glass-panel shadow-lg transition-all hover:scale-110 active:scale-95 group/audio ${audioState?.status === 'playing' ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white'}`}
              >
                {audioState?.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : audioState?.status === 'playing' ? <Square size={16} fill="currentColor" /> : <Volume2 size={18} />}
              </button>
            )}
          </div>
          <span className="text-[10px] mt-2 px-3 font-bold uppercase tracking-widest text-white/40 opacity-80">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
