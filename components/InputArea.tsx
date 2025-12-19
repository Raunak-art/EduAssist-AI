
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Loader2, Palette, Paperclip, X, File as FileIcon, Upload, Mic, Square, MessageSquare, Wand2, ImageIcon, Layout, Globe, MapPin } from 'lucide-react';
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
  voiceMessageLabel?: string;
  recordingLabel?: string;
  t?: any;
  themeMode?: ThemeMode;
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
  voiceMessageLabel = "Voice Message",
  recordingLabel = "Recording...",
  t = {} as any,
  themeMode,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const [showTools, setShowTools] = useState(false);

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

  const canSend = (input.trim() || attachments.length > 0) && !isLoading && 
    ((mode === 'image-edit') ? attachments.length > 0 : true);

  const handleSend = () => {
    if (canSend) {
      onSend(input, attachments);
      setInput('');
      setAttachments([]);
      setShowTools(false);
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

  const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:3', '3:4', '16:9', '9:16'];

  const modeBtnClass = (active: boolean) => `flex flex-col items-center justify-center p-3 rounded-[1.75rem] transition-all border ${active ? 'bg-indigo-500/30 border-white/20 text-white shadow-lg' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white'}`;

  return (
    <>
      {showAttachModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-ios-pop" onClick={() => setShowAttachModal(false)}>
          <div className="w-full max-w-sm glass-panel p-8 rounded-[2.5rem] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white text-xl">Upload</h3>
              <button onClick={() => setShowAttachModal(false)} className="p-2 bg-white/10 rounded-full text-white"><X size={20}/></button>
            </div>
            <div className="aspect-square glass-panel rounded-[2rem] border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => fileInputRef.current?.click()}>
              <div className="p-5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/30">
                <Upload size={32} className="text-white" />
              </div>
              <span className="text-white font-semibold">Select Files</span>
              <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files) { processFiles(Array.from(e.target.files)); setShowAttachModal(false); } }} className="hidden" multiple />
            </div>
          </div>
        </div>
      )}

      {showTools && <div className="fixed inset-0 z-[25]" onClick={() => setShowTools(false)}></div>}

      <div className="fixed bottom-0 left-0 w-full z-30 px-4 pb-6 sm:pb-8 pointer-events-none">
        <div className="max-w-4xl mx-auto relative pointer-events-auto">
          {showTools && (
            <div className="absolute bottom-full mb-4 left-0 w-full sm:w-96 glass-panel p-6 rounded-[2.5rem] ios-shadow animate-ios-pop z-40 space-y-6">
               <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Free Creative Studio</h4>
                 <button onClick={() => setShowTools(false)} className="p-1 bg-white/10 rounded-full text-white/60"><X size={14}/></button>
               </div>
               
               <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setMode('text')} className={modeBtnClass(mode === 'text')}>
                    <div className={`p-2 rounded-xl mb-2 ${mode === 'text' ? 'bg-indigo-500 shadow-lg' : 'bg-white/10'}`}><MessageSquare size={18} /></div>
                    <span className="text-[11px] font-bold">Assistant</span>
                  </button>
                  <button onClick={() => setMode('image-gen')} className={modeBtnClass(mode === 'image-gen')}>
                    <div className={`p-2 rounded-xl mb-2 ${mode === 'image-gen' ? 'bg-pink-500 shadow-lg' : 'bg-white/10'}`}><ImageIcon size={18} /></div>
                    <span className="text-[11px] font-bold">Free Generator</span>
                  </button>
                  <button onClick={() => setMode('image-edit')} className={modeBtnClass(mode === 'image-edit')}>
                    <div className={`p-2 rounded-xl mb-2 ${mode === 'image-edit' ? 'bg-amber-500 shadow-lg' : 'bg-white/10'}`}><Wand2 size={18} /></div>
                    <span className="text-[11px] font-bold">Editor</span>
                  </button>
               </div>

               {mode === 'image-gen' && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="h-px bg-white/10" />
                   <div>
                     <div className="flex items-center gap-2 mb-3 text-white/40"><Layout size={12}/> <span className="text-[10px] font-bold uppercase tracking-widest">Image Aspect Ratio</span></div>
                     <div className="grid grid-cols-5 gap-1.5">
                       {ASPECT_RATIOS.map(r => (
                          <button key={r} onClick={() => setChatSettings(p => ({ ...p, imageAspectRatio: r }))} className={`py-2 rounded-xl text-[9px] font-bold border transition-all ${chatSettings.imageAspectRatio === r ? 'bg-indigo-500 text-white border-indigo-400' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>{r}</button>
                       ))}
                     </div>
                   </div>
                 </div>
               )}

               <div className="h-px bg-white/10" />
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setChatSettings(p => ({ ...p, enableSearch: !p.enableSearch }))} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-[11px] font-bold ${chatSettings.enableSearch ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}><Globe size={16}/> Web Search</button>
                  <button onClick={() => setChatSettings(p => ({ ...p, enableMaps: !p.enableMaps }))} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-[11px] font-bold ${chatSettings.enableMaps ? 'bg-green-500/20 border-green-500 text-green-200' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}><MapPin size={16}/> Maps</button>
               </div>
            </div>
          )}

          <div className="glass-panel rounded-ios p-3 sm:p-4 flex items-end gap-3 ios-shadow">
            <button onClick={() => setShowAttachModal(true)} className="p-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-full transition-colors flex-shrink-0"><Paperclip size={20}/></button>
            <button onClick={() => setShowTools(!showTools)} className={`p-3 rounded-full transition-all flex-shrink-0 ${showTools ? 'bg-indigo-500 text-white scale-110 shadow-lg' : 'bg-white/5 hover:bg-white/10 text-white/80'}`}><Palette size={20}/></button>
            
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {attachments.map((att, i) => (
                    <div key={i} className="relative w-12 h-12 rounded-2xl overflow-hidden glass-panel flex-shrink-0 border-white/20">
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
                placeholder={mode === 'image-gen' ? "Describe the image you want..." : placeholder}
                disabled={isLoading || isRecording}
                className="bg-transparent border-none focus:ring-0 resize-none py-2.5 text-base text-white placeholder:text-white/40 outline-none leading-relaxed w-full"
                style={{ minHeight: '44px' }}
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {hasMicrophone && mode === 'text' && (
                <button onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 hover:bg-white/10 text-white/80'}`}>
                  {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20}/>}
                </button>
              )}
              <button onClick={handleSend} disabled={!canSend} className={`p-3 rounded-full shadow-xl transition-all active:scale-90 flex items-center justify-center ${isLoading || !canSend ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/30'}`}>
                {isLoading ? <Loader2 size={22} className="animate-spin" /> : mode === 'image-gen' ? <ImageIcon size={22}/> : <SendHorizontal size={22}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
