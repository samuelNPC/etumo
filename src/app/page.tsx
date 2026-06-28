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
    // Changed from blue to a clean, professional slate/white aesthetic
    <div className="relative flex-1 w-full bg-slate-50 min-h-screen font-sans">

      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-16 md:pt-28 pb-20 flex flex-col items-start md:items-center justify-start text-left md:text-center gap-20">

        {/* --- TOP SECTION: VALUE PROPOSITION --- */}
        <div className="w-full flex flex-col items-start md:items-center animate-in slide-in-from-bottom-4 fade-in duration-700">
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tighter text-slate-900 leading-[1.1]">
            Research drafted, formatted, and finished in hours.
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-10 max-w-2xl font-medium leading-relaxed">
            The AI-powered workspace that takes university students from a blank page to a submission-ready document. Fully mapped to your faculty's exact guidelines.
          </p>

          {/* Social Proof / Trust Banner */}
          <div className="flex items-center gap-3 mb-12 bg-white border border-gray-200 px-5 py-2.5 rounded-full shadow-sm w-fit md:mx-auto">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700 z-30">MUST</div>
              <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-green-700 z-20">KIU</div>
              <div className="w-6 h-6 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-purple-700 z-10">KAB</div>
            </div>
            <span className="text-sm font-bold text-gray-700">Trusted by students across Uganda</span>
          </div>

          {/* Features: Stacked on mobile, Row on desktop */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-start md:justify-center gap-5 md:gap-10 text-base font-bold text-slate-800">
            {["Topic Setup", "Chapter Structuring", "Format & Export"].map((feature, idx) => {
              return (
                <span key={idx} className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-slate-800 text-white rounded-sm shadow-sm">
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
        {/* ^^^ THIS WAS THE MISSING CLOSING DIV THAT BROKE YOUR BUILD! ^^^ */}


        {/* --- BOTTOM SECTION: EXPLANATORY CARDS --- */}
        <div className="w-full max-w-xl flex flex-col items-start md:items-center animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">
            Choose your workspace.
          </h2>

          <div className="w-full flex flex-col gap-6">
            
            {/* Card 1: Workspace / Get Started */}
            <button 
              onClick={() => handleActionClick("/workspace")}
              className="group w-full text-left p-6 sm:p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  Build Your Research <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md hidden sm:inline-block">Workspace</span>
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Enter your approved topic. The Etomu Engine will draft, structure, and format all chapters to your university's exact specifications.
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
              className="group w-full text-left p-6 sm:p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-teal-400 hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-teal-600 transition-colors flex items-center gap-2">
                  Bypass Turnitin <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md hidden sm:inline-block">Similarity Repair</span>
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Upload your flagged text or raw Turnitin PDF. We reconstruct the syntax to drop Plagiarism and AI detection scores to zero.
                </p>
              </div>
              <div className="shrink-0 text-teal-500 transition-transform transform group-hover:translate-x-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Card 3: Data Collector */}
            <button 
              onClick={() => handleActionClick("/data-collector")}
              className="group w-full text-left p-6 sm:p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-orange-400 hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-orange-600 transition-colors flex items-center gap-2">
                  Digitize Fieldwork <span className="text-[10px] font-bold uppercase tracking-widest text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md hidden sm:inline-block">Data Collector</span>
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Stop printing paper questionnaires. Upload your approved instrument to deploy a mobile-friendly link with live field analytics.
                </p>
              </div>
              <div className="shrink-0 text-orange-500 transition-transform transform group-hover:translate-x-2">
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
