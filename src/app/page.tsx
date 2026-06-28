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
    <div className="relative flex-1 w-full bg-white min-h-screen font-sans">

      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-16 md:pt-28 pb-12 flex flex-col items-start md:items-center justify-start text-left md:text-center gap-16">

        {/* --- TOP SECTION: VALUE PROPOSITION (Upgraded Hero) --- */}
        <div className="w-full flex flex-col items-start md:items-center animate-in slide-in-from-bottom-4 fade-in duration-700">
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black mb-6 tracking-tighter text-[#0f172a] leading-[1.05]">
            Where research gets done.
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl font-medium leading-relaxed">
            An AI-powered workspace that helps students and writers move from idea to submission-ready research reports faster.
          </p>

          {/* Features: Stacked on mobile, Row on desktop */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-start md:justify-center gap-5 md:gap-10 text-base font-bold text-gray-800">
            {[
              { text: "Topic Setup", color: "bg-blue-500" },
              { text: "Chapter Structuring", color: "bg-yellow-500" },
              { text: "Format & Export", color: "bg-red-500" }
            ].map((feature, idx) => {
              return (
                <span key={idx} className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-6 h-6 ${feature.color} text-white rounded-sm shadow-sm`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {feature.text}
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
              className="group w-full text-left p-6 sm:p-8 bg-white/80 backdrop-blur-md border border-black/20 rounded-xl shadow-lg hover:border-blue-600 hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl text-blue-600 mb-2 transition-colors flex items-center gap-2">
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
              className="group w-full text-left p-6 sm:p-8 bg-white/80 backdrop-blur-md border border-black/20 rounded-xl shadow-lg hover:border-cyan-600 hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl text-cyan-600 mb-2 transition-colors flex items-center gap-2">
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
              className="group w-full text-left p-6 sm:p-8 bg-white/80 backdrop-blur-md border border-black/20 rounded-xl shadow-lg hover:border-[#d97706] hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl text-[#d97706] mb-2 transition-colors flex items-center gap-2">
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
