import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Loader2, Palette, Paperclip, X, File as FileIcon, Upload, Mic, Square, MessageSquare, Wand2, ImageIcon, Layout, Globe, MapPin, ChevronDown, BookOpen, Search } from 'lucide-react';
import { Attachment, InputMode, ChatSettings, ThemeMode, AspectRatio } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  placeholder: string;
  mode: InputMode;
  setMode: (mode: InputMode) => void;
  chatSettings: ChatSettings;
  setChatSettings: React.Dispatch<React.SetStateAction<ChatSettings>>;
  imageModePlaceholder: string;
  input: string;
  setInput: (val: string) => void;
  onOpenKnowledgeBase?: () => void;
  voiceMessageLabel?: string;
  t?: any;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isLoading, 
  placeholder,
  mode,
  setMode,
  chatSettings,
  setChatSettings,
  imageModePlaceholder,
  input,
  setInput,
  onOpenKnowledgeBase,
  voiceMessageLabel = "Voice Message",
  t = {} as any,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) setHasMicrophone(false);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 24), 140)}px`;
    }
  }, [input]);

  const canSend = (input.trim() || attachments.length > 0) && !isLoading;

  const handleSend = () => {
    if (canSend) {
      onSend(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const processFiles = async (files: File[]) => {
    const newAttachments: Attachment[] = [];
    for (const file of files) {
      const reader = new FileReader();
      const base64Uri = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newAttachments.push({
        mimeType: file.type,
        data: base64Uri.split(',')[1],
        uri: base64Uri,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file'
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = reader.result as string;
          onSend(voiceMessageLabel, [{ mimeType: audioBlob.type, data: b64.split(',')[1], uri: b64, name: voiceMessageLabel, type: 'audio' }]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("Mic denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  };

  const pillClass = (active: boolean) => `flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${active ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-white/40 hover:text-white hover:border-white/10'}`;

  return (
    <>
      {showAttachModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-ios-pop" onClick={() => setShowAttachModal(false)}>
          <div className="w-full max-w-sm glass-panel p-8 rounded-nexus shadow-2xl border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white text-xl">Upload</h3>
              <button onClick={() => setShowAttachModal(false)} className="p-2 bg-white/10 rounded-full text-white"><X size={20}/></button>
            </div>
            <div className="aspect-square glass-panel rounded-nexus border-dashed border-white/20 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => fileInputRef.current?.click()}>
              <div className="p-5 bg-white rounded-full shadow-lg">
                <Upload size={32} className="text-black" />
              </div>
              <span className="text-white font-semibold">Select Files</span>
              <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files) { processFiles(Array.from(e.target.files)); setShowAttachModal(false); } }} className="hidden" multiple />
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full z-30 px-4 pb-12 pointer-events-none">
        <div className="max-w-3xl mx-auto relative pointer-events-auto bg-[#1a1a1a] rounded-[2.2rem] p-4 shadow-2xl border border-white/5 nexus-input-bar">
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {attachments.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {attachments.map((att, i) => (
                  <div key={i} className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                    {att.type === 'image' ? <img src={att.uri} className="w-full h-full object-cover" /> : <FileIcon size={16} className="m-auto text-white/40" />}
                    <button onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg z-10"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={mode === 'image-gen' ? imageModePlaceholder : (t.placeholder || placeholder)}
              disabled={isLoading || isRecording}
              className="bg-transparent border-none focus:ring-0 resize-none py-1 px-1 text-lg text-white placeholder:text-white/30 outline-none leading-relaxed w-full font-medium"
              style={{ minHeight: '32px' }}
            />

            <div className="flex items-center justify-between gap-2 pt-1">
               <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                 <button onClick={() => setShowAttachModal(true)} className={pillClass(attachments.length > 0)}>
                   <Paperclip size={14} /> {t.inputAttach || "Attach"}
                 </button>
                 <button onClick={() => setChatSettings(p => ({ ...p, enableSearch: !p.enableSearch }))} className={pillClass(chatSettings.enableSearch)}>
                   <Search size={14} /> {t.inputSearch || "Search"}
                 </button>
                 <button onClick={onOpenKnowledgeBase} className={pillClass(false)}>
                   <BookOpen size={14} /> {t.inputStudy || "Study"}
                 </button>
                 <button onClick={() => setMode(mode === 'image-gen' ? 'text' : 'image-gen')} className={pillClass(mode === 'image-gen')}>
                   <ImageIcon size={14} /> {t.inputCreateImage || "Create image"}
                 </button>
               </div>

               <div className="flex items-center gap-2 flex-shrink-0">
                 {hasMicrophone && mode === 'text' && !canSend && (
                    <button onClick={isRecording ? stopRecording : startRecording} className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${isRecording ? 'bg-red-500 border-red-400 text-white' : 'border-white/5 text-white/40 hover:text-white'}`}>
                      {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={14} />} {voiceMessageLabel}
                    </button>
                  )}
                  {canSend && (
                    <button onClick={handleSend} className="p-2.5 bg-white text-black rounded-full hover:bg-slate-200 transition-all shadow-xl active:scale-90 flex items-center justify-center">
                      <SendHorizontal size={20} />
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto pt-3 text-center">
           <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.2em]">By messaging EduAssist AI, you agree to our Terms and Privacy Policy.</p>
        </div>
      </div>
    </>
  );
};