import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Trash2, X, Settings, LogOut, User as UserIcon, MoreVertical, Archive, EyeOff, GraduationCap, BookOpen } from 'lucide-react';
import { ChatSession, User, ThemeMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onArchiveSession: (id: string) => void;
  onHideSession: (id: string) => void;
  onOpenSettings: () => void;
  onOpenKnowledgeBase?: () => void;
  onLogout: () => void;
  user: User;
  t: any;
  themeMode?: ThemeMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onArchiveSession,
  onHideSession,
  onOpenSettings,
  onOpenKnowledgeBase,
  onLogout,
  user,
  t,
  themeMode,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const handleMenuAction = (action: 'delete' | 'archive' | 'hide', sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault(); setActiveMenuId(null);
    if (action === 'delete') onDeleteSession(sessionId);
    if (action === 'archive') onArchiveSession(sessionId);
    if (action === 'hide') onHideSession(sessionId);
  };

  const activeSessions = sessions.filter(s => s.status === 'active' || !s.status);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-in fade-in duration-300" onClick={onClose} />}

      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col glass-panel border-r-0 shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col gap-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-nexus bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                 <GraduationCap className="text-white w-7 h-7" />
              </div>
              <div>
                <span className="font-bold text-lg text-white block leading-none">EduAssist AI</span>
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1 block">The Lexicon School</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-full md:hidden"><X size={20} /></button>
          </div>

          <button
            onClick={() => { onNewChat(); if (window.innerWidth < 768) onClose(); }}
            className="w-full flex items-center gap-4 px-5 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-nexus transition-all shadow-xl shadow-indigo-500/20 active:scale-95 group font-bold"
          >
            <div className="p-1.5 bg-white/20 rounded-xl group-hover:scale-110 transition-transform"><Plus size={20} /></div>
            <span>{t.newChat || "New Chat"}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
          {activeSessions.length === 0 ? (
            <div className="text-center py-20 px-8 glass-panel rounded-nexus border-dashed">
               <p className="text-sm font-bold text-white/60">{t.sidebarNoHistory || "No History"}</p>
               <p className="text-[10px] mt-2 text-white/30 uppercase tracking-widest">{t.sidebarStartStudy || "Start a study session"}</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30">{t.sidebarHistory || "History"}</div>
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className={`
                    group relative flex items-center gap-4 px-4 py-4 rounded-nexus cursor-pointer transition-all active:scale-[0.98]
                    ${currentSessionId === session.id 
                      ? 'bg-white/10 border border-white/20 text-white shadow-lg'
                      : 'hover:bg-white/5 border border-transparent text-white/60'}
                  `}
                  onClick={() => { onSelectSession(session.id); if (window.innerWidth < 768) onClose(); }}
                >
                  <div className={`p-2 rounded-xl transition-colors ${currentSessionId === session.id ? 'bg-indigo-500' : 'bg-white/5'}`}>
                    <MessageSquare size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate leading-tight">{session.title}</h3>
                    <p className="text-[10px] opacity-40 font-medium mt-0.5">{session.updatedAt.toLocaleDateString()}</p>
                  </div>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === session.id ? null : session.id); }}
                    className={`p-1.5 rounded-lg hover:bg-white/10 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity ${activeMenuId === session.id ? 'opacity-100 bg-white/10' : ''}`}
                  >
                    <MoreVertical size={14} />
                  </button>

                  {activeMenuId === session.id && (
                    <div ref={menuRef} className="absolute right-0 top-full mt-2 w-44 glass-panel p-2 rounded-xl ios-shadow z-50 animate-ios-pop">
                      <button onClick={(e) => handleMenuAction('archive', session.id, e)} className="w-full flex items-center gap-3 px-3 py-3 text-xs font-bold text-white hover:bg-white/10 rounded-xl"><Archive size={14}/> {t.menuArchive || "Archive"}</button>
                      <button onClick={(e) => handleMenuAction('hide', session.id, e)} className="w-full flex items-center gap-3 px-3 py-3 text-xs font-bold text-white hover:bg-white/10 rounded-xl"><EyeOff size={14}/> {t.menuHide || "Hide"}</button>
                      <div className="h-px bg-white/10 my-1 mx-2" />
                      <button onClick={(e) => handleMenuAction('delete', session.id, e)} className="w-full flex items-center gap-3 px-3 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl"><Trash2 size={14}/> {t.menuDelete || "Delete"}</button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10">
           <div className="glass-panel p-4 rounded-nexus space-y-4">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white border border-white/20 shadow-inner">
                 <UserIcon size={18} />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-white truncate">{user.name}</p>
                 <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Nexus-Tier Account</span>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-2">
               <button onClick={onOpenSettings} className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                 <Settings size={18} className="text-white/60 group-hover:text-white transition-colors" />
                 <span className="text-[10px] font-bold text-white/60 uppercase group-hover:text-white">{t.settings || "Settings"}</span>
               </button>
               <button onClick={onOpenKnowledgeBase} className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                 <BookOpen size={18} className="text-white/60 group-hover:text-white transition-colors" />
                 <span className="text-[10px] font-bold text-white/60 uppercase group-hover:text-white">{t.kbTitle || "KB"}</span>
               </button>
             </div>
             
             <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 py-3 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20">
               <LogOut size={16} /> {t.logout || "Logout"}
             </button>
           </div>
        </div>
      </div>
    </>
  );
};