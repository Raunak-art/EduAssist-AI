
import React, { useState, useEffect, useMemo } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { GalaxyBackground } from './components/GalaxyBackground';
import { User, UserRole, Language, Theme } from './types';
import { GraduationCap, User as UserIcon, Calendar, BookOpen, Layers, Check, AlertCircle } from 'lucide-react';
import { TRANSLATIONS } from './services/translations';
import { storageService } from './services/storage';

const USER_STORAGE_KEY = 'eduassist_current_user';

const LiquidContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-in fade-in duration-300 relative overflow-hidden">
     <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-none"></div>
     <div className="relative z-10 w-full max-w-lg">
       {children}
     </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'auth' | 'chat'>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [language, setLanguage] = useState<Language>(() => storageService.loadLanguage());
  const [theme, setTheme] = useState<Theme>(() => storageService.loadTheme());
  
  const [onboardingStep, setOnboardingStep] = useState<'none' | 'role' | 'details'>('none');
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  
  const [tempRole, setTempRole] = useState<UserRole | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempDob, setTempDob] = useState('');
  const [tempGrade, setTempGrade] = useState('');
  const [tempSection, setTempSection] = useState('');

  useEffect(() => {
    const targetLang = language === 'auto' ? 'en' : language;
    document.documentElement.lang = targetLang;
    const isRTL = targetLang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.dir = isRTL ? 'rtl' : 'ltr';
  }, [language]);

  const t = useMemo(() => {
    const targetLang = language === 'auto' ? 'en' : language;
    return TRANSLATIONS[targetLang] || TRANSLATIONS['en'];
  }, [language]);

  const maxDobString = useMemo(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    storageService.applyTheme();
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (savedUser) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        setView('chat');
        
        if (parsedUser.isGuest) {
          setOnboardingStep('none');
        } else if (!parsedUser.role) {
          setOnboardingStep('role');
        } else if (!parsedUser.dob) {
          setOnboardingStep('details');
          setTempRole(parsedUser.role);
          setTempName(parsedUser.name);
        } else {
          setOnboardingStep('none');
        }
      } catch (e) {
        localStorage.removeItem(USER_STORAGE_KEY);
        setView('landing');
      }
    } else {
      setView('landing');
    }
    setIsLoadingAuth(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setTempName(user.name);
    setOnboardingError(null);
    setView('chat');
    
    if (user.isGuest) {
      setOnboardingStep('none');
    } else {
      if (!user.role) {
        setOnboardingStep('role');
      } else if (!user.dob) {
        setOnboardingStep('details');
        setTempRole(user.role);
      } else {
        setOnboardingStep('none');
      }
    }
    
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  };

  const handleRoleSelect = (role: UserRole) => {
    setTempRole(role);
    setOnboardingError(null);
    const updatedUser = { ...currentUser!, role };
    setCurrentUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setOnboardingStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError(null);
    if (!currentUser) return;
    
    const birthDate = new Date(tempDob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const minAge = tempRole === 'teacher' ? 22 : 8;
    
    if (age < minAge) {
      const errorMsg = tempRole === 'teacher' 
        ? (t.errorTeacherUnderage || "Teachers must be at least 22 years old.")
        : (t.errorUnderage || "You must be at least 8 years old.");
      setOnboardingError(errorMsg);
      return;
    }

    const updatedUser: User = { 
      ...currentUser, 
      name: tempName, 
      role: tempRole!, 
      dob: tempDob, 
      grade: tempRole === 'student' ? tempGrade : undefined, 
      section: tempRole === 'student' ? tempSection : undefined 
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setOnboardingStep('none');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    setOnboardingStep('none');
    setOnboardingError(null);
    setTempRole(null);
    setTempName('');
    setTempDob('');
    setTempGrade('');
    setTempSection('');
    setView('landing');
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    storageService.saveLanguage(newLang);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    storageService.saveTheme(newTheme);
    storageService.applyTheme();
  };

  if (isLoadingAuth) return <div className="h-screen w-screen flex items-center justify-center bg-black"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;

  return (
    <>
      {theme.galaxyEnabled && <GalaxyBackground />}
      
      {view === 'landing' && (
        <LandingPage 
          onGetStarted={() => setView('auth')} 
          onLogin={() => setView('auth')} 
          onTryNow={() => handleLogin({ id: 'guest_session', name: 'Guest Student', method: 'guest', isGuest: true })} 
        />
      )}

      {view === 'auth' && (
        <LoginPage 
          onLogin={handleLogin} 
          currentLanguage={language} 
          onBack={() => setView('landing')} 
        />
      )}

      {currentUser && view === 'chat' && onboardingStep === 'role' && (
        <LiquidContainer>
          <div className="glass-panel p-8 rounded-3xl shadow-xl text-center border-white/10">
            <div className="h-20 w-20 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center shadow-inner border border-white/10"><GraduationCap className="text-white w-10 h-10" /></div>
            <h2 className="text-2xl font-bold text-white mb-2">{t.selectRole}</h2>
            <p className="text-slate-300 mb-8">{t.enterInfo}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => handleRoleSelect('student')} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/20 hover:scale-105 transition-all group">
                <div className="h-14 w-14 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-500/40 transition-colors"><UserIcon className="text-white w-7 h-7" /></div>
                <span className="text-lg font-semibold text-white">{t.iAmStudent}</span>
              </button>
              <button onClick={() => handleRoleSelect('teacher')} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/20 hover:scale-105 transition-all group">
                <div className="h-14 w-14 bg-purple-500/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-500/40 transition-colors"><BookOpen className="text-white w-7 h-7" /></div>
                <span className="text-lg font-semibold text-white">{t.iAmTeacher}</span>
              </button>
            </div>
          </div>
        </LiquidContainer>
      )}

      {currentUser && view === 'chat' && onboardingStep === 'details' && (
        <LiquidContainer>
          <div className="glass-panel p-8 rounded-3xl shadow-xl border-white/10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">{t.completeProfile}</h2>
              <p className="text-slate-300 text-sm mt-1">{t.enterInfo}</p>
            </div>
            {onboardingError && <div className="mb-4 p-3 bg-red-900/40 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-100 text-sm animate-in slide-in-from-top-2 duration-300"><AlertCircle size={18} className="flex-shrink-0" /><span>{onboardingError}</span></div>}
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-200 mb-1">{t.fullName}</label><div className="relative"><UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /><input type="text" required value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder:text-slate-500" placeholder={t.namePlaceholder} /></div></div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t.dateOfBirth}</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input 
                    type="date" 
                    required 
                    value={tempDob} 
                    max={maxDobString} 
                    onChange={(e) => setTempDob(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder:text-slate-500 [color-scheme:dark]" 
                  />
                </div>
              </div>
              {tempRole === 'student' && <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-200 mb-1">{t.grade}</label><div className="relative"><Layers size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /><input type="text" required value={tempGrade} onChange={(e) => setTempGrade(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder:text-slate-500" placeholder={t.gradePlaceholder} /></div></div><div><label className="block text-sm font-medium text-slate-200 mb-1">{t.section}</label><div className="relative"><input type="text" required value={tempSection} onChange={(e) => setTempSection(e.target.value)} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder:text-slate-500" placeholder={t.sectionPlaceholder} /></div></div></div>}
              <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-900/30"><span>{t.continue}</span><Check size={18} /></button>
            </form>
          </div>
        </LiquidContainer>
      )}

      {currentUser && view === 'chat' && onboardingStep === 'none' && (
        <ChatInterface 
          key={`${currentUser.id}-${language}`} 
          user={currentUser} 
          onLogout={handleLogout} 
          appLanguage={language} 
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
      )}
    </>
  );
};

export default App;
