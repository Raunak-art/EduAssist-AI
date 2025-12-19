import React from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  Zap, 
  Image as ImageIcon, 
  Search, 
  Globe, 
  Github, 
  Cpu, 
  Layout, 
  MessageSquare, 
  Layers, 
  Code, 
  Activity, 
  BarChart3, 
  Mic, 
  MapPin, 
  Bot,
  Terminal,
  ChevronDown,
  Sparkles,
  BookOpen,
  History,
  ShieldCheck
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onTryNow: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onTryNow }) => {
  return (
    <div className="flex flex-col w-full">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white rounded flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight">EduAssist AI</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#intelligence" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Intelligence</a>
            <a href="#developers" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Developers</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-medium text-white/70 hover:text-white px-2 transition-colors">Sign in</button>
            <button onClick={onGetStarted} className="bg-white text-black text-sm font-bold px-4 py-1.5 rounded-full hover:bg-slate-200 transition-all shadow-lg">Sign up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tight leading-[1.1]">
            Get answers. <br />
            Find inspiration. <br />
            <span className="text-white/40">Be more productive.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed font-normal">
            EduAssist AI is your intelligent campus companion. Built with state-of-the-art reasoning models, it's the smartest way to code, write, and study.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={onTryNow} className="px-8 py-3.5 bg-white text-black font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-lg">
              Start now <ArrowRight size={20} />
            </button>
            <button onClick={onGetStarted} className="px-8 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 transition-all text-lg">
              Learn more
            </button>
          </div>
        </div>
        
        {/* Hero Visual */}
        <div className="mt-20 w-full max-w-6xl mx-auto aspect-video rounded-[2.5rem] glass-panel border-white/10 overflow-hidden relative group">
           <img src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-20 transition-transform duration-1000 group-hover:scale-105" alt="AI Context" />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="p-6 glass-panel rounded-3xl max-w-md w-full animate-float">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Sparkles size={16} /></div>
                   <div className="h-2 w-32 bg-white/10 rounded-full"></div>
                 </div>
                 <div className="space-y-2">
                   <div className="h-2 w-full bg-white/5 rounded-full"></div>
                   <div className="h-2 w-4/5 bg-white/5 rounded-full"></div>
                   <div className="h-2 w-3/5 bg-white/5 rounded-full"></div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-semibold mb-16 text-center">Intelligent features for modern learners.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Search />}
              title="Knowledge Grounding"
              desc="Verify facts with real-time web access. EduAssist cross-references multiple sources to ensure your research is accurate and up-to-date."
            />
            <FeatureCard 
              icon={<ImageIcon />}
              title="Creative Studio"
              desc="Visualize complex concepts instantly. From biological diagrams to architectural sketches, our visual engine turns text into high-fidelity educational art."
            />
            <FeatureCard 
              icon={<Mic />}
              title="Voice Native"
              desc="Engage in low-latency verbal discussions. Perfect for language learning, pronunciation practice, or hands-free study sessions."
            />
            <FeatureCard 
              icon={<BookOpen />}
              title="Study Context"
              desc="Upload textbooks or lecture notes for deep analysis. Ask specific questions about your curriculum and get context-aware explanations."
            />
            <FeatureCard 
              icon={<ShieldCheck />}
              title="Private by Design"
              desc="Your academic data belongs to you. We use end-to-end encryption and local storage to ensure your queries and notes remain private."
            />
            <FeatureCard 
              icon={<History />}
              title="Smart Branching"
              desc="Explore different lines of thought without losing your place. Fork any conversation into a new thread to test multiple theories or approaches."
            />
          </div>
        </div>
      </section>

      {/* Explore Models */}
      <section id="intelligence" className="py-32 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
               <h2 className="text-5xl font-semibold">Explore our intelligence suite in one place.</h2>
               <p className="text-xl text-white/50 font-normal leading-relaxed">
                 Access a unified AI playground to test your prompts across all our modalities. Experiment with text, image, audio, and video models to find the perfect fit for your learning style.
               </p>
               <ul className="space-y-4">
                 <li className="flex items-center gap-4 text-white/80 font-medium">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                   EduAssist Pro for complex reasoning and STEM
                 </li>
                 <li className="flex items-center gap-4 text-white/80 font-medium">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                   Artisan Engine for creative and visual learning
                 </li>
                 <li className="flex items-center gap-4 text-white/80 font-medium">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                   Audio-Link for real-time speech interaction
                 </li>
               </ul>
            </div>
            <div className="glass-panel p-1 rounded-[3rem] border-white/10 shadow-3xl">
               <div className="bg-[#0c0c0c] p-8 rounded-[2.8rem] border border-white/5">
                  <div className="flex gap-4 mb-8">
                    <div className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-white/50">Featured</div>
                    <div className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-white/50">Intelligence</div>
                  </div>
                  <div className="space-y-6">
                    <ModelItem icon={<Bot className="text-indigo-400" />} name="EduAssist Pro" desc="Our most intelligent reasoning model." />
                    <ModelItem icon={<ImageIcon className="text-amber-400" />} name="Artisan V3" desc="State-of-the-art educational visuals." />
                    <ModelItem icon={<Layout className="text-emerald-400" />} name="Vision" desc="Next-gen cinematic video output." />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Section */}
      <section id="developers" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-semibold">Build directly with the SDK.</h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            From quickstart guides to deep-dive references, access all the documentation you need to ship your own intelligent features.
          </p>
          <div className="pt-10">
            <div className="glass-panel p-2 rounded-3xl inline-block max-w-3xl w-full text-left font-mono text-sm bg-black border-white/10 shadow-2xl">
               <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 mb-4">
                  <span className="text-white/30">Python</span>
                  <span className="text-indigo-400 border-b-2 border-indigo-400 pb-4 -mb-4">Javascript</span>
               </div>
               <div className="px-6 pb-6 pt-6">
                 <code className="text-white/80">
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
      <footer className="py-20 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white rounded flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold">EduAssist AI</span>
          </div>
          <div className="flex gap-8 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Download</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-xs text-white/20 font-medium">© 2025 The Lexicon International School. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 hover:border-white/10 transition-all group hover:bg-white/[0.04]">
    <div className="p-3 bg-white/5 rounded-2xl w-fit mb-8 group-hover:bg-white/10 transition-colors">
      {React.cloneElement(icon as React.ReactElement, { size: 24, className: "text-indigo-400" } as any)}
    </div>
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <p className="text-white/40 leading-relaxed font-medium">{desc}</p>
  </div>
);

const ModelItem: React.FC<{ icon: React.ReactNode, name: string, desc: string }> = ({ icon, name, desc }) => (
  <div className="flex items-center gap-5 group cursor-pointer p-2 rounded-2xl hover:bg-white/5 transition-colors">
    <div className="p-3 bg-white/5 rounded-xl">
      {React.cloneElement(icon as React.ReactElement, { size: 24 } as any)}
    </div>
    <div>
      <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{name}</h4>
      <p className="text-xs text-white/40 font-medium">{desc}</p>
    </div>
  </div>
);