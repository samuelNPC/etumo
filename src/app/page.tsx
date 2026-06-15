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

  // Track Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle Main CTA Click
  const handleGetStarted = () => {
    if (user) {
      router.push("/workspace");
    } else {
      setShowAuthModal(true);
    }
  };

  // Handle Successful Login
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    router.push("/workspace");
  };

  return (
    <div className="relative flex-1 w-full bg-blue-50 overflow-hidden font-sans flex flex-col justify-center min-h-[85vh]">

      {/* --- ANIMATED BACKGROUND SYSTEM --- */}
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

      {/* --- MOVING LIGHT BLUE COLORS & GLASS EFFECT --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center">
        {/* Bright Animated Orbs (All shifted to variations of Light Blue & Cyan) */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-300/50 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-sky-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-blue-400/30 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-6000" />

        {/* Full-page frosted glass overlay */}
        <div className="absolute inset-0 backdrop-blur-[60px] bg-white/50" />

        {/* CSS Dot Grid over the glass */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center gap-10">

        {/* --- HERO CONTENT --- */}
        <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tighter text-[#0f172a] leading-[1.1]">
            Where research <br className="hidden sm:block"/> gets done.
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl font-medium leading-relaxed">
            An AI-powered workspace that helps students move from an approved idea to a submission-ready document in minutes.
          </p>

          {/* Features Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm md:text-base font-bold text-gray-700 bg-white/60 backdrop-blur-md py-3 px-6 rounded-full border border-gray-200/50 shadow-sm">
            {["Topic Setup", "Automated Structuring", "One-Click Export"].map((feature, idx) => (
              <span key={idx} className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full shadow-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* --- DIRECT CTA BUTTONS --- */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
          <button 
            onClick={handleGetStarted}
            className="w-full sm:w-auto bg-black text-white font-extrabold py-4 px-12 rounded-2xl hover:bg-gray-800 transition-all uppercase tracking-widest text-sm shadow-xl hover:-translate-y-1 transform duration-200"
          >
            Get Started &rarr;
          </button>
          
          <Link 
            href="/originality" 
            className="w-full sm:w-auto bg-white/80 backdrop-blur-md text-gray-900 border border-gray-200 font-bold py-4 px-12 rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-sm shadow-sm hover:-translate-y-1 transform duration-200"
          >
            Originality Center
          </Link>
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
