import React, { useState, useRef, useEffect } from 'react';
// Added Loader2 to the import list from lucide-react
import { SendHorizontal, Palette, Paperclip, X, File as FileIcon, Upload, Mic, Square, ImageIcon, BookOpen, Search, ChevronDown, Wand2, Sparkles, Layout, Loader2 } from 'lucide-react';
import { Attachment, InputMode, ChatSettings, AspectRatio } from '../types';

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
  const [showCreativeMenu, setShowCreativeMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const creativeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) setHasMicrophone(false);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (creativeMenuRef.current && !creativeMenuRef.current.contains(event.target as Node)) {
        setShowCreativeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      // Reset mode to text after sending if it was image-gen
      if (mode === 'image-gen') setMode('text');
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

  const aspectRatios: AspectRatio[] = ['1:1', '4:3', '16:9'];

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
            
            <div className="flex flex-col gap-2">
              {mode === 'image-gen' && (
                <div className="flex items-center gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Aspect Ratio:</span>
                  {aspectRatios.map(ratio => (
                    <button 
                      key={ratio}
                      onClick={() => setChatSettings(prev => ({ ...prev, imageAspectRatio: ratio }))}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${chatSettings.imageAspectRatio === ratio ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              )}
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={mode === 'image-gen' ? (t.describeImage || "Describe the image you want to generate...") : (t.placeholder || placeholder)}
                disabled={isLoading || isRecording}
                className={`bg-transparent border-none focus:ring-0 resize-none py-1 px-1 text-lg text-white placeholder:text-white/30 outline-none leading-relaxed w-full font-medium transition-colors ${mode === 'image-gen' ? 'text-indigo-200' : ''}`}
                style={{ minHeight: '32px' }}
              />
            </div>

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
                 <div className="relative" ref={creativeMenuRef}>
                   <button 
                    onClick={() => setShowCreativeMenu(!showCreativeMenu)} 
                    className={pillClass(mode === 'image-gen' || mode === 'image-edit')}
                   >
                     <Palette size={14} /> {t.menuCreative || "Creative Studio"} <ChevronDown size={12} className={`transition-transform duration-300 ${showCreativeMenu ? 'rotate-180' : ''}`} />
                   </button>
                   
                   {showCreativeMenu && (
                     <div className="absolute bottom-full left-0 mb-3 w-56 glass-panel rounded-2xl border border-white/10 shadow-2xl p-2 animate-ios-pop z-[60]">
                        <button 
                          onClick={() => { setMode('image-gen'); setShowCreativeMenu(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors ${mode === 'image-gen' ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                          <Sparkles size={16} /> {t.generateImages || "Free Generator"}
                        </button>
                        <button 
                          onClick={() => { setMode('image-edit'); setShowCreativeMenu(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors ${mode === 'image-edit' ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                          <Wand2 size={16} /> Image Editor
                        </button>
                        <div className="h-px bg-white/5 my-1 mx-2" />
                        <button 
                          onClick={() => { setMode('text'); setShowCreativeMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Layout size={16} /> Reset to Chat
                        </button>
                     </div>
                   )}
                 </div>
               </div>

               <div className="flex items-center gap-2 flex-shrink-0">
                 {hasMicrophone && mode === 'text' && !canSend && (
                    <button onClick={isRecording ? stopRecording : startRecording} className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${isRecording ? 'bg-red-500 border-red-400 text-white' : 'border-white/5 text-white/40 hover:text-white'}`}>
                      {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={14} />} {voiceMessageLabel}
                    </button>
                  )}
                  {canSend && (
                    <button onClick={handleSend} className={`p-2.5 rounded-full transition-all shadow-xl active:scale-90 flex items-center justify-center ${mode === 'image-gen' ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-white text-black hover:bg-slate-200'}`}>
                      {/* Fixed: Loader2 is now imported and correctly used here */}
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : <SendHorizontal size={20} />}
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