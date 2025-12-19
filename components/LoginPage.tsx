
import React, { useState } from 'react';
import { Mail, Loader2, ArrowRight, Eye, EyeOff, User as UserIcon, Lock, GraduationCap } from 'lucide-react';
import { User, LoginMethod, Language } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { TRANSLATIONS } from '../services/translations';

interface LoginPageProps {
  onLogin: (user: User) => void;
  currentLanguage: Language;
}

const USERS_STORAGE_KEY = 'eduassist_registered_users';

// Moved outside to prevent re-creation on every render
const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen liquid-bg flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
     <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-none"></div>
     <div className="relative z-10 w-full max-w-md">
       {children}
     </div>
  </div>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, currentLanguage }) => {
  const [mode, setMode] = useState<'options' | 'login' | 'signup'>('options');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Use the global language for translations
  const t = TRANSLATIONS[currentLanguage === 'auto' ? 'en' : currentLanguage] || TRANSLATIONS['en'];

  const handleOAuthLogin = (provider: LoginMethod) => {
    setIsLoading(true);
    setError(null);
    
    setTimeout(() => {
        const timestamp = Date.now();
        let user: User;
        
        if (provider === 'google') {
            user = { 
                id: `usr_google_${timestamp}`, 
                name: 'Google User', 
                email: 'user@gmail.com', 
                method: 'google', 
                isGuest: false, 
                avatar: 'https://lh3.googleusercontent.com/a/default-user' 
            };
        } else if (provider === 'apple') {
            user = { 
                id: `usr_apple_${timestamp}`, 
                name: 'Apple User', 
                email: 'user@icloud.com', 
                method: 'apple', 
                isGuest: false 
            };
        } else {
            user = { id: `usr_guest_${timestamp}`, name: 'Guest Student', method: 'guest', isGuest: true };
        }
        
        onLogin(user);
        setIsLoading(false);
    }, 1500);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const users = storedUsers ? JSON.parse(storedUsers) : [];

        if (mode === 'signup') {
          if (users.find((u: any) => u.email === email)) {
            throw new Error("Account already exists with this email.");
          }
          
          const newUser = {
            id: uuidv4(),
            name: name || email.split('@')[0],
            email,
            password, 
            method: 'email',
            isGuest: false
          };
          
          users.push(newUser);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
          
          const { password: _, ...userProfile } = newUser;
          onLogin(userProfile as User);
        } else {
          const user = users.find((u: any) => u.email === email && u.password === password);
          if (!user) {
            throw new Error("Invalid email or password.");
          }
          
          const { password: _, ...userProfile } = user;
          onLogin(userProfile as User);
        }
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    }, 800);
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
        onLogin({ id: 'guest_session', name: 'Guest Student', method: 'guest', isGuest: true });
        setIsLoading(false);
    }, 800);
  };

  if (mode === 'options') {
    return (
      <Container>
          <div className="text-center mb-10">
            <div className="h-24 w-24 mx-auto mb-6 glass-panel rounded-3xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
               <GraduationCap className="text-white w-14 h-14" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-sm">{t.loginWelcomeTitle}</h1>
            <p className="text-slate-200">{t.loginSubtitle}</p>
          </div>

          <div className="glass-panel p-8 rounded-3xl shadow-xl space-y-4">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="w-full bg-white/90 hover:bg-white text-slate-800 font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="animate-spin text-slate-400" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>{t.continueGoogle}</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleOAuthLogin('apple')}
              disabled={isLoading}
              className="w-full bg-black/80 hover:bg-black text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 backdrop-blur-md border border-white/10"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                 <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
              </svg>
              <span>{t.continueApple}</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink-0 mx-4 text-slate-300 text-xs uppercase font-semibold">{t.or}</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            <button
              onClick={() => setMode('login')}
              disabled={isLoading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/30"
            >
              <Mail size={18} />
              <span>{t.signinEmail}</span>
            </button>

            <button
              onClick={() => handleGuestLogin()}
              disabled={isLoading}
              className="w-full mt-4 text-slate-300 hover:text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm group"
            >
              <span>{t.continueGuest}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="text-center mt-8">
             <p className="text-xs text-slate-300">
               {t.noAccount} <button onClick={() => setMode('signup')} className="text-white font-semibold hover:underline decoration-indigo-400">{t.signup}</button>
             </p>
          </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="glass-panel p-8 rounded-2xl shadow-xl w-full max-w-md">
         <button onClick={() => { setMode('options'); setError(null); }} className="text-sm text-slate-300 mb-6 hover:text-white flex items-center gap-1 transition-colors">
           <ArrowRight size={14} className="rotate-180" /> {t.backToOptions}
         </button>
         
         <div className="mb-6">
           <h2 className="text-2xl font-bold text-white">{mode === 'login' ? t.welcomeBack : t.createAccount}</h2>
           <p className="text-slate-300 text-sm mt-1">{mode === 'login' ? t.enterDetails : t.getStarted}</p>
         </div>

         {error && (
           <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 text-red-200 text-sm rounded-lg flex items-start gap-2">
             <div className="mt-0.5 min-w-[4px] h-[4px] rounded-full bg-red-400" />
             {error}
           </div>
         )}

         <form onSubmit={handleEmailAuth} className="space-y-4">
           {mode === 'signup' && (
             <div>
               <label className="block text-sm font-medium text-slate-200 mb-1">{t.fullName}</label>
               <div className="relative">
                 <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                 <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white placeholder:text-slate-500"
                    placeholder={t.namePlaceholder}
                 />
               </div>
             </div>
           )}
           
           <div>
             <label className="block text-sm font-medium text-slate-200 mb-1">{t.emailAddr}</label>
             <div className="relative">
               <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white placeholder:text-slate-500"
                  placeholder={t.emailPlaceholder}
               />
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-200 mb-1">{t.password}</label>
             <div className="relative">
               <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white placeholder:text-slate-500"
                  placeholder={t.passwordPlaceholder}
                  minLength={6}
               />
               <button 
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
               >
                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
           </div>

           <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-900/30"
           >
             {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? t.signin : t.createAccount)}
           </button>
         </form>

         <div className="mt-6 text-center text-sm text-slate-400">
           {mode === 'login' ? (
             <>
               {t.noAccount} <button onClick={() => { setMode('signup'); setError(null); }} className="text-white font-semibold hover:underline decoration-indigo-400">{t.signup}</button>
             </>
           ) : (
             <>
               {t.hasAccount} <button onClick={() => { setMode('login'); setError(null); }} className="text-white font-semibold hover:underline decoration-indigo-400">{t.signin}</button>
             </>
           )}
         </div>
      </div>
    </Container>
  );
};
