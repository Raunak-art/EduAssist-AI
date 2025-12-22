
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  Search, 
  Image as ImageIcon, 
  Mic, 
  Sparkles, 
  BookOpen, 
  History, 
  ShieldCheck, 
  Bot, 
  Layout, 
  Globe, 
  MapPin,
  MessageSquare,
  Zap,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onTryNow: () => void;
}

const LivePreview: React.FC = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { type: 'user', text: "Can you explain photosynthesis simply?" },
    { type: 'bot', text: "Photosynthesis is how plants turn sunlight into energy. Think of it like a solar panel for a leaf! 🌿☀️" },
    { type: 'user', text: "What are the main components needed?" },
    { type: 'bot', text: "1. Sunlight\n2. Water\n3. Carbon Dioxide\nThey combine to create Oxygen and Glucose!" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % (steps.length + 2));
    }, 3000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="w-full max-w-xl aspect-[2/1] bg-white/5 dark:bg-black/40 christmas:bg-white backdrop-blur-3xl rounded-[2rem] border border-white/10 christmas:border-sky-200 shadow-3xl p-6 flex flex-col gap-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
      
      {/* Header of Preview */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 christmas:text-sky-600">
            <Sparkles size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 dark:text-white/40 christmas:text-sky-800/60">EduAssist Preview</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/10 dark:bg-white/10 christmas:bg-sky-200" />
          <div className="w-2 h-2 rounded-full bg-white/10 dark:bg-white/10 christmas:bg-sky-200" />
          <div className="w-2 h-2 rounded-full bg-white/10 dark:bg-white/10 christmas:bg-sky-200" />
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 overflow-hidden">
        {steps.map((s, i) => (
          <div 
            key={i} 
            className={`flex flex-col gap-1 transition-all duration-700 ${i <= step ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className={`flex items-start gap-2 ${s.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`p-2 rounded-lg ${s.type === 'user' ? 'bg-indigo-500/20 text-indigo-300 christmas:bg-sky-500/10 christmas:text-sky-600' : 'bg-white/10 dark:bg-white/10 christmas:bg-sky-100 text-white/60 dark:text-white/60 christmas:text-sky-700'}`}>
                 {s.type === 'user' ? <MessageSquare size={12} /> : <Bot size={12} />}
               </div>
               <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-[13px] leading-relaxed font-medium ${s.type === 'user' ? 'bg-indigo-500 text-white christmas:bg-sky-600' : 'bg-white/5 dark:bg-white/5 christmas:bg-sky-50 text-white/80 dark:text-white/80 christmas:text-sky-950 border border-white/10 christmas:border-sky-200'}`}>
                 {s.text}
               </div>
            </div>
          </div>
        ))}
        {step >= steps.length && (
          <div className="flex items-center gap-2 animate-pulse pl-10">
            <div className="w-1.5 h-1.5 bg-white/20 dark:bg-white/20 christmas:bg-sky-300 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/20 dark:bg-white/20 christmas:bg-sky-300 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/20 dark:bg-white/20 christmas:bg-sky-300 rounded-full" />
          </div>
        )}
      </div>

      {/* Decorative Input Field */}
      <div className="absolute bottom-6 left-6 right-6 h-10 bg-white/5 dark:bg-black/20 christmas:bg-sky-50 border border-white/10 christmas:border-sky-200 rounded-xl px-4 flex items-center justify-between opacity-50">
        <span className="text-[10px] text-white/20 dark:text-white/20 christmas:text-sky-900/50 font-bold uppercase tracking-widest">Type a message...</span>
        <Zap size={14} className="text-white/20 dark:text-white/20 christmas:text-sky-400" />
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string, onClick?: () => void }> = ({ icon, title, desc, onClick }) => (
  <div 
    onClick={onClick}
    className="glass-panel p-10 rounded-[2.5rem] border-white/5 hover:border-white/20 dark:border-white/5 transition-all group hover:bg-white/[0.04] christmas:hover:bg-white cursor-pointer active:scale-[0.98]"
  >
    <div className="p-3.5 bg-white/5 dark:bg-white/5 christmas:bg-sky-100 rounded-2xl w-fit mb-8 group-hover:bg-indigo-500/10 transition-colors group-hover:scale-110 duration-500">
      {React.cloneElement(icon as React.ReactElement, { size: 24, className: "text-indigo-400 dark:text-indigo-400 christmas:text-sky-600" } as any)}
    </div>
    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white christmas:text-sky-950 group-hover:text-black dark:group-hover:text-white transition-colors">{title}</h3>
    <p className="text-slate-500 dark:text-white/40 christmas:text-sky-900 leading-relaxed font-medium text-sm">{desc}</p>
  </div>
);

const ModelItem: React.FC<{ icon: React.ReactNode, name: string, desc: string, onClick?: () => void }> = ({ icon, name, desc, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-center gap-5 group cursor-pointer p-3 rounded-[1.5rem] hover:bg-white/5 christmas:hover:bg-sky-50 transition-all active:scale-[0.98]"
  >
    <div className="p-3.5 bg-white/5 dark:bg-white/5 christmas:bg-sky-100 rounded-xl group-hover:bg-white/10 transition-colors">
      {React.cloneElement(icon as React.ReactElement, { size: 24 } as any)}
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-white dark:text-white christmas:text-sky-950 group-hover:text-indigo-300 christmas:group-hover:text-sky-600 transition-colors flex items-center gap-2">
        {name}
        <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </h4>
      <p className="text-[11px] text-white/30 dark:text-white/30 christmas:text-sky-900 font-bold uppercase tracking-widest mt-0.5">{desc}</p>
    </div>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onTryNow }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 christmas:border-sky-400/20 bg-black/40 christmas:bg-sky-500/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white christmas:text-white drop-shadow-md">EduAssist AI</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-sm font-medium text-white/50 dark:text-white/50 christmas:text-white/70 hover:text-white transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('intelligence')} 
              className="text-sm font-medium text-white/50 dark:text-white/50 christmas:text-white/70 hover:text-white transition-colors"
            >
              Intelligence
            </button>
            <button 
              onClick={() => scrollToSection('developers')} 
              className="text-sm font-medium text-white/50 dark:text-white/50 christmas:text-white/70 hover:text-white transition-colors"
            >
              Developers
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-medium text-white/70 dark:text-white/70 christmas:text-white/80 hover:text-white px-2 transition-colors">Sign in</button>
            <button onClick={onGetStarted} className="bg-white text-black text-sm font-bold px-4 py-1.5 rounded-full hover:bg-slate-200 transition-all shadow-lg active:scale-95">Sign up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 christmas:bg-white/20 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full -z-10" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 dark:bg-white/5 christmas:bg-white/30 border border-white/10 christmas:border-white/50 mb-2 animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 christmas:bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 christmas:bg-white"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 dark:text-white/50 christmas:text-white">Version 3.1 Now Live</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-semibold tracking-tight leading-[1.1] text-white dark:text-white christmas:text-white drop-shadow-md animate-in fade-in slide-in-from-top-8 duration-1000">
            Be more productive.
          </h1>
          
          <p className="text-xl md:text-2xl text-white/60 dark:text-white/60 christmas:text-white max-w-2xl mx-auto leading-relaxed font-normal animate-in fade-in slide-in-from-top-6 duration-1000 delay-150 drop-shadow">
            EduAssist AI is your intelligent campus companion. Built with state-of-the-art reasoning models, it's the smartest way to code, write, and study.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
            <button 
              onClick={onTryNow} 
              className="group relative px-8 py-3.5 bg-white text-black font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-lg shadow-2xl overflow-hidden active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              Start now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="px-8 py-3.5 bg-white/5 dark:bg-white/5 christmas:bg-white/20 border border-white/10 christmas:border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-all text-lg active:scale-95"
            >
              Learn more
            </button>
          </div>
        </div>
        
        {/* Animated Hero Visual Container */}
        <div className="mt-24 w-full max-w-5xl mx-auto aspect-[16/9] md:aspect-[21/9] rounded-[3rem] border border-white/10 christmas:border-sky-200 overflow-hidden relative group shadow-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 bg-[#050607] christmas:bg-sky-400">
           {/* Deep Background layer */}
           <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] dark:from-white/[0.02] christmas:from-white/10 to-transparent pointer-events-none" />
           <div className="absolute inset-0 opacity-20 dark:opacity-20 christmas:opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
           
           <div className="absolute inset-0 flex items-center justify-center p-8">
              <LivePreview />
           </div>
           
           {/* Decorative corner glows */}
           <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 dark:bg-indigo-500/20 christmas:bg-white/30 blur-[80px] rounded-full" />
           <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/10 christmas:bg-sky-100/20 blur-[80px] rounded-full" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 border-t border-white/5 christmas:border-sky-400/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white dark:text-white christmas:text-sky-950">Intelligent features for modern learners.</h2>
            <p className="text-white/40 dark:text-white/40 christmas:text-sky-900 max-w-xl mx-auto font-bold">Tools designed to accelerate your understanding and streamline your workflow.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Search />}
              title="Knowledge Grounding"
              desc="Verify facts with real-time web access. EduAssist cross-references multiple sources to ensure your research is accurate."
              onClick={onTryNow}
            />
            <FeatureCard 
              icon={<ImageIcon />}
              title="Creative Studio"
              desc="Visualize complex concepts instantly. From biological diagrams to architectural sketches, our visual engine turns text into art."
              onClick={onTryNow}
            />
            <FeatureCard 
              icon={<Mic />}
              title="Voice Native"
              desc="Engage in low-latency verbal discussions. Perfect for language learning, pronunciation practice, or hands-free study."
              onClick={onTryNow}
            />
            <FeatureCard 
              icon={<BookOpen />}
              title="Study Context"
              desc="Upload textbooks or lecture notes for deep analysis. Ask specific questions about your curriculum and get explanations."
              onClick={onTryNow}
            />
            <FeatureCard 
              icon={<ShieldCheck />}
              title="Private by Design"
              desc="Your academic data belongs to you. We use encryption and local storage to ensure your queries remain private."
              onClick={onTryNow}
            />
            <FeatureCard 
              icon={<History />}
              title="Smart Branching"
              desc="Explore different lines of thought without losing your place. Fork any conversation to test multiple theories."
              onClick={onTryNow}
            />
          </div>
        </div>
      </section>

      {/* Explore Models */}
      <section id="intelligence" className="py-32 px-6 bg-white/[0.01] border-y border-white/5 christmas:border-sky-400/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
               <h2 className="text-5xl font-semibold leading-tight text-white dark:text-white christmas:text-sky-950">Explore our intelligence suite in one place.</h2>
               <p className="text-xl text-white/50 dark:text-white/50 christmas:text-sky-900 font-bold leading-relaxed">
                 Access a unified AI playground to test your prompts across all our modalities. Find the perfect fit for your learning style.
               </p>
               <ul className="space-y-4">
                 <li className="flex items-center gap-4 text-white/80 dark:text-white/80 christmas:text-sky-900 font-bold group">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 christmas:bg-sky-600 group-hover:scale-150 transition-transform"></div>
                   EduAssist Pro for complex reasoning and STEM
                 </li>
                 <li className="flex items-center gap-4 text-white/80 dark:text-white/80 christmas:text-sky-900 font-bold group">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 christmas:bg-sky-600 group-hover:scale-150 transition-transform"></div>
                   Artisan Engine for creative and visual learning
                 </li>
                 <li className="flex items-center gap-4 text-white/80 dark:text-white/80 christmas:text-sky-900 font-bold group">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 christmas:bg-sky-600 group-hover:scale-150 transition-transform"></div>
                   Audio-Link for real-time speech interaction
                 </li>
               </ul>
            </div>
            <div className="glass-panel p-1 rounded-[3rem] border-white/10 dark:border-white/10 christmas:border-sky-200 shadow-3xl">
               <div className="bg-[#0c0c0c] dark:bg-[#0c0c0c] christmas:bg-white p-8 rounded-[2.8rem] border border-white/5 christmas:border-sky-100">
                  <div className="flex gap-4 mb-8">
                    <div className="px-3 py-1 bg-white/5 dark:bg-white/5 christmas:bg-sky-100 rounded-full text-[10px] font-black uppercase tracking-widest text-white/30 dark:text-white/30 christmas:text-sky-600">Intelligence Suite</div>
                  </div>
                  <div className="space-y-6">
                    <ModelItem 
                      icon={<Bot className="text-indigo-400 dark:text-indigo-400 christmas:text-sky-600" />} 
                      name="EduAssist Pro" 
                      desc="Our most intelligent reasoning model." 
                      onClick={onTryNow}
                    />
                    <ModelItem 
                      icon={<ImageIcon className="text-amber-400 dark:text-amber-400 christmas:text-sky-500" />} 
                      name="Artisan V3" 
                      desc="State-of-the-art educational visuals." 
                      onClick={onTryNow}
                    />
                    <ModelItem 
                      icon={<Layout className="text-emerald-400 dark:text-emerald-400 christmas:text-sky-400" />} 
                      name="Vision" 
                      desc="Next-gen cinematic video output." 
                      onClick={onTryNow}
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developers / SDK Section */}
      <section id="developers" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-semibold text-white dark:text-white christmas:text-sky-950">Build directly with the SDK.</h2>
          <p className="text-xl text-white/50 dark:text-white/50 christmas:text-sky-900 font-bold max-w-2xl mx-auto">
            From quickstart guides to deep-dive references, access everything you need to ship your own intelligent features.
          </p>
          <div className="pt-10">
            <div className="glass-panel p-2 rounded-3xl inline-block max-w-3xl w-full text-left font-mono text-sm bg-black dark:bg-black christmas:bg-[#032d3d] border-white/10 dark:border-white/10 shadow-2xl">
               <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex gap-4">
                    <span className="text-white/30 hover:text-white cursor-pointer transition-colors">Python</span>
                    <span className="text-indigo-400 border-b-2 border-indigo-400 pb-4 -mb-4">Javascript</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
                  </div>
               </div>
               <div className="px-6 pb-8 pt-8 overflow-x-auto">
                 <code className="text-[13px] leading-relaxed block whitespace-pre">
                   <p><span className="text-pink-400">import</span> {`{ EduAssistAI }`} <span className="text-pink-400">from</span> <span className="text-green-300">"@eduassist/core"</span>;</p>
                   <p><span className="text-pink-400">const</span> <span className="text-indigo-300">ai</span> = <span className="text-pink-400">new</span> <span className="text-yellow-300">EduAssistAI</span>({`{ key: process.env.TOKEN }`});</p>
                   <p>&nbsp;</p>
                   <p><span className="text-pink-400">const</span> <span className="text-indigo-300">response</span> = <span className="text-pink-400">await</span> <span className="text-indigo-300">ai.models.generate</span>({`{`}</p>
                   <p>&nbsp;&nbsp;model: <span className="text-green-300">'edu-assist-max'</span>,</p>
                   <p>&nbsp;&nbsp;prompt: <span className="text-green-300">'Explain quantum entanglement to a 10 year old'</span></p>
                   <p>{`});`}</p>
                 </code>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 dark:border-white/5 christmas:border-sky-400/20 bg-black/40 dark:bg-black/40 christmas:bg-sky-500/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="p-1.5 bg-white rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg text-white christmas:text-white drop-shadow">EduAssist AI</span>
          </div>
          <div className="flex gap-10 text-sm font-semibold text-white/40 dark:text-white/40 christmas:text-white/70">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-xs text-white/20 dark:text-white/20 christmas:text-white/40 font-black uppercase tracking-[0.2em]">© 2025 Lexicon International School</p>
        </div>
      </footer>
    </div>
  );
};
