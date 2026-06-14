"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import AuthModal from "@/components/AuthModal";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<"custom" | "generate" | null>(null);
  const [bgLines, setBgLines] = useState<{ top: string; left: string; delay: string }[]>([]);

  // 1. Generate random positions for the background safely on the client to avoid hydration errors
  useEffect(() => {
    setBgLines(
      Array.from({ length: 30 }).map(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
      }))
    );
  }, []);

  // 2. Track Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 3. Handle Button Clicks (Intent Routing)
  const handleActionClick = (intent: "custom" | "generate") => {
    if (user) {
      // If logged in, push straight to the workspace with the intent parameter
      router.push(`/workspace?intent=${intent}`);
    } else {
      // If not logged in, save their intent and trigger the modal
      setPendingIntent(intent);
      setShowAuthModal(true);
    }
  };

  // 4. Handle Successful Login
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingIntent) {
      router.push(`/workspace?intent=${pendingIntent}`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-white overflow-hidden font-sans">
      
      {/* --- PURE CSS ANIMATED BACKGROUND SYSTEM --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        .flow-line {
          position: absolute;
          width: 200px;
          height: 200px;
          border: 2px solid rgba(0,0,0,0.05);
          border-radius: 50%;
          clip-path: path("M10 50 C 60 0, 140 200, 190 150");
          animation: float 12s infinite ease-in-out;
        }

        @keyframes float {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-20px) translateX(10px) rotate(10deg); }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        }
      `}} />

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {bgLines.map((style, i) => (
          <div
            key={i}
            className="flow-line"
            style={{
              top: style.top,
              left: style.left,
              animationDelay: style.delay,
              opacity: 0.1,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 max-w-5xl mx-auto p-4 sm:p-8 pt-12 sm:pt-24 flex flex-col md:flex-row gap-12 md:gap-8 items-start">
        
        {/* --- LEFT COLUMN: VALUE PROPOSITION --- */}
        <div className="flex-1 animate-in slide-in-from-left-4 fade-in duration-700">
          <span className="inline-block py-1.5 px-4 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-600 mb-6">
            The Evolution of Academic Research
          </span>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter text-gray-900 leading-[1.1]">
            Where research <br className="hidden sm:block" /> gets done.
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-md font-medium leading-relaxed">
            An AI-powered workspace that helps students and writers move from idea to submission-ready documents faster.
          </p>

          {/* Left-Aligned Value Bullets */}
          <div className="flex flex-col gap-4 text-sm font-semibold text-gray-700">
            <span className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </span>
              Topic Generation
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </span>
              Chapter Structuring
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </span>
              Format & Export
            </span>
          </div>
        </div>

        {/* --- RIGHT COLUMN: INTENT BUTTONS --- */}
        <div className="w-full md:w-[480px] shrink-0 animate-in slide-in-from-right-4 fade-in duration-700 delay-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Let's set up your workspace</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Button 1: Custom Topic Intent */}
            <button 
              onClick={() => handleActionClick("custom")}
              className="group w-full text-left p-6 sm:p-8 rounded-2xl transition-all duration-200 border-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-black hover:shadow-lg flex items-center justify-between"
            >
              <div className="pr-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1">I have a research topic</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Start structuring chapters and writing based on your approved idea.
                </p>
              </div>
              <div className="shrink-0 text-gray-300 group-hover:text-black transition-colors transform group-hover:translate-x-1">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>

            {/* Button 2: Generate Topic Intent */}
            <button 
              onClick={() => handleActionClick("generate")}
              className="group w-full text-left p-6 sm:p-8 rounded-2xl transition-all duration-200 border-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-[#4285F4] hover:shadow-lg flex items-center justify-between"
            >
              <div className="pr-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1">I need a topic idea</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Let our AI matrix suggest high-quality topics aligned with your course.
                </p>
              </div>
              <div className="shrink-0 text-gray-300 group-hover:text-[#4285F4] transition-colors transform group-hover:translate-x-1">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center md:text-left">
            <Link href="/originality" className="inline-flex items-center gap-1 text-sm font-bold text-[#d97706] hover:text-[#b45309] transition-colors">
              Need to fix Similarity first? 
              <span aria-hidden="true">&rarr;</span>
            </Link>
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
