"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  // Track Auth State (Restored your original working logic)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle Button Clicks (Routing)
  const handleActionClick = (route: string) => {
    if (user) {
      router.push(route);
    } else {
      setPendingRoute(route);
      setShowAuthModal(true);
    }
  };

  // Handle Successful Login
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingRoute) {
      router.push(pendingRoute);
    } else {
      router.push("/workspace");
    }
  };

  return (
    <div className="relative flex-1 w-full bg-blue-50 overflow-hidden font-sans min-h-[85vh]">

      {/* --- ANIMATED BACKGROUND SYSTEM (Light Blue Palette) --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 8s infinite alternate ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
      `}} />

      {/* --- MOVING COLORS & GLASS EFFECT --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-300/50 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-sky-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-blue-400/30 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-6000" />

        <div className="absolute inset-0 backdrop-blur-[60px] bg-white/50" />
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-16 md:pt-28 pb-12 flex flex-col items-start md:items-center justify-start text-left md:text-center gap-16">

        {/* --- TOP SECTION: VALUE PROPOSITION --- */}
        <div className="w-full flex flex-col items-start md:items-center animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tighter text-[#0f172a] leading-[1.1]">
            Where research gets done.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 max-w-2xl font-medium leading-relaxed">
            An AI-powered workspace that helps students and writers move from idea to submission-ready documents faster.
          </p>

          {/* Social Proof / Trust Banner */}
          <div className="flex items-center gap-3 mb-10 bg-white/60 backdrop-blur-sm border border-gray-200 px-5 py-2.5 rounded-full shadow-sm">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700">JD</div>
              <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-green-700">SA</div>
              <div className="w-6 h-6 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-purple-700">MK</div>
            </div>
            <span className="text-sm font-bold text-gray-700">Trusted by students across Uganda</span>
          </div>

          {/* Features: Stacked on mobile, Row on desktop */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-start md:justify-center gap-5 md:gap-10 text-base font-bold text-gray-800">
            {["Topic Setup", "Chapter Structuring", "Format & Export"].map((feature, idx) => {
              return (
                <span key={idx} className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-sm shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {feature}
                </span>
              );
            })}
          </div>
        </div>

        {/* --- BOTTOM SECTION: EXPLANATORY CARDS --- */}
        <div className="w-full max-w-xl flex flex-col items-start md:items-center animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-8">
            How can we help you today?
          </h2>

          <div className="w-full flex flex-col gap-6">
            {/* Card 1: Workspace / Get Started */}
            <button 
              onClick={() => handleActionClick("/workspace")}
              className="group w-full text-left p-6 sm:p-8 bg-white/80 backdrop-blur-md border border-white/60 rounded-xl shadow-lg hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  Get Started <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md hidden sm:inline-block">Workspace</span>
                </h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Enter your research topic to automatically draft, structure, and format your chapters according to university guidelines.
                </p>
              </div>
              <div className="shrink-0 text-blue-500 transition-transform transform group-hover:translate-x-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Card 2: Originality Center */}
            <button 
              onClick={() => router.push("/originality")} 
              className="group w-full text-left p-6 sm:p-8 bg-white/80 backdrop-blur-md border border-white/60 rounded-xl shadow-lg hover:border-cyan-500 hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-cyan-600 transition-colors flex items-center gap-2">
                  Originality Center <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-md hidden sm:inline-block">Similarity Repair</span>
                </h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Upload your Turnitin report or flagged text to automatically bypass AI detection and fix similarity matches.
                </p>
              </div>
              <div className="shrink-0 text-cyan-500 transition-transform transform group-hover:translate-x-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Card 3: Data Collector */}
            <button 
              onClick={() => handleActionClick("/data-collector")}
              className="group w-full text-left p-6 sm:p-8 bg-white/80 backdrop-blur-md border border-white/60 rounded-xl shadow-lg hover:border-[#d97706] hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-[#d97706] transition-colors flex items-center gap-2">
                  Data Collector <span className="text-[10px] font-bold uppercase tracking-widest text-[#d97706] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md hidden sm:inline-block">Digitize Fieldwork</span>
                </h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Stop printing questionnaires. Upload your approved instrument to deploy a mobile collection link with live analytics.
                </p>
              </div>
              <div className="shrink-0 text-[#d97706] transition-transform transform group-hover:translate-x-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess} 
        initializing={false} 
      />
    </div>
  );
}
