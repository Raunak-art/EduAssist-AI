
import React, { useState } from 'react';
import { X, Search, ChevronRight, BookOpen } from 'lucide-react';
import { KNOWLEDGE_BASE, KnowledgeItem } from '../services/knowledgeBase';

interface KnowledgeBaseModalProps {
  onClose: () => void;
  onSelectQuestion: (question: string) => void;
  t: any;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ onClose, onSelectQuestion, t }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = KNOWLEDGE_BASE.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, KnowledgeItem[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <BookOpen size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.kbTitle || "Knowledge Base"}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{t.kbIntro || "Find answers to common questions"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
           <div className="relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder={t.kbPlaceholder || "Search questions..."} 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all"
               autoFocus
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.keys(groupedItems).length === 0 ? (
             <div className="text-center py-10 text-slate-500">
                <Search size={48} className="mx-auto mb-3 opacity-20" />
                <p>{t.noResults || "No matching questions found."}</p>
             </div>
          ) : (
            Object.keys(groupedItems).map(category => (
              <div key={category}>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">{category}</h3>
                <div className="space-y-2">
                  {groupedItems[category].map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group">
                       <div className="p-4">
                         <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                            {item.question}
                         </h4>
                         <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-3.5 border-l-2 border-slate-100 dark:border-slate-700">
                           {item.answer}
                         </p>
                         <div className="mt-3 pl-3.5 flex justify-end">
                            <button 
                              onClick={() => { onSelectQuestion(item.question); onClose(); }}
                              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                               {t.kbUseQuestion || "Ask this"} <ChevronRight size={12} />
                            </button>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
