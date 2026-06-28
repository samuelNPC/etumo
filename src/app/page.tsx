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

  // Track Auth State
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
    <div className="relative flex-1 w-full bg-[#f8fafc] min-h-screen font-sans overflow-hidden">
      
      {/* --- COLORFUL BACKGROUND BLOBS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-300/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-300/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-orange-300/10 blur-[100px] pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-5 pt-16 md:pt-28 pb-20 flex flex-col items-start md:items-center justify-start text-left md:text-center gap-16">

        {/* --- TOP SECTION: VALUE PROPOSITION --- */}
        <div className="w-full flex flex-col items-start md:items-center animate-in slide-in-from-bottom-4 fade-in duration-700">
          
          <h1 className="text-[2.75rem] sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tighter leading-[1.15]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500">
              Research drafted, formatted, and finished in hours.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl font-medium leading-relaxed">
            The AI-powered workspace that takes university students from a blank page to a submission-ready document. Fully mapped to your faculty's exact guidelines.
          </p>

          {/* REDESIGNED SOCIAL PROOF (No longer looks like a button!) */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-12 cursor-default opacity-90">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Trusted across Uganda</span>
            <div className="flex gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-blue-100/50 text-blue-700 font-black text-xs tracking-wider border border-blue-200">MUST</span>
              <span className="px-3 py-1.5 rounded-lg bg-green-100/50 text-green-700 font-black text-xs tracking-wider border border-green-200">KIU</span>
              <span className="px-3 py-1.5 rounded-lg bg-purple-100/50 text-purple-700 font-black text-xs tracking-wider border border-purple-200">KAB</span>
            </div>
          </div>

          {/* REDESIGNED FEATURES (Replaced heavy black checkmarks with colorful numbered steps) */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch md:items-center justify-start md:justify-center gap-4 text-base font-bold text-slate-800">
            
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">1</div>
              <span className="text-sm">Topic Setup</span>
            </div>

            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black text-sm">2</div>
              <span className="text-sm">Chapter Structuring</span>
            </div>

            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm">3</div>
              <span className="text-sm">Format & Export</span>
            </div>

          </div>

        </div> 


        {/* --- BOTTOM SECTION: EXPLANATORY CARDS --- */}
        <div className="w-full max-w-2xl flex flex-col items-start md:items-center animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100 mt-4">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-8">
            Choose your workspace.
          </h2>

          <div className="w-full flex flex-col gap-5">
            
            {/* Card 1: Workspace / Get Started */}
            <button 
              onClick={() => handleActionClick("/workspace")}
              className="group relative w-full text-left p-6 sm:p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-400 to-blue-600 transition-all duration-300 group-hover:w-3"></div>
              <div className="pl-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="font-black text-xl text-slate-900 mb-2 group-hover:text-blue-600 transition-colors flex items-center gap-3">
                    Build Your Research 
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">Workspace</span>
                  </h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    Enter your approved topic. The Etomu Engine will draft, structure, and format all chapters to your university's exact specifications.
                  </p>
                </div>
                <div className="shrink-0 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 transition-transform transform group-hover:translate-x-2 group-hover:bg-blue-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Card 2: Originality Center */}
            <button 
              onClick={() => router.push("/originality")} 
              className="group relative w-full text-left p-6 sm:p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-teal-400 to-teal-600 transition-all duration-300 group-hover:w-3"></div>
              <div className="pl-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="font-black text-xl text-slate-900 mb-2 group-hover:text-teal-600 transition-colors flex items-center gap-3">
                    Bypass Turnitin 
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-md">Repair</span>
                  </h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    Upload your flagged text or raw Turnitin PDF. We reconstruct the syntax to drop Plagiarism and AI detection scores to zero.
                  </p>
                </div>
                <div className="shrink-0 w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 transition-transform transform group-hover:translate-x-2 group-hover:bg-teal-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Card 3: Data Collector */}
            <button 
              onClick={() => handleActionClick("/data-collector")}
              className="group relative w-full text-left p-6 sm:p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-orange-400 to-orange-600 transition-all duration-300 group-hover:w-3"></div>
              <div className="pl-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="font-black text-xl text-slate-900 mb-2 group-hover:text-orange-600 transition-colors flex items-center gap-3">
                    Digitize Fieldwork 
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-md">Data Collector</span>
                  </h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    Stop printing paper questionnaires. Upload your approved instrument to deploy a mobile-friendly link with live field analytics.
                  </p>
                </div>
                <div className="shrink-0 w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 transition-transform transform group-hover:translate-x-2 group-hover:bg-orange-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
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
