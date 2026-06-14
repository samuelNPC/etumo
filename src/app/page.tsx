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

  // Track Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle Button Clicks (Intent Routing)
  const handleActionClick = (intent: "custom" | "generate") => {
    if (user) {
      router.push(`/workspace?intent=${intent}`);
    } else {
      setPendingIntent(intent);
      setShowAuthModal(true);
    }
  };

  // Handle Successful Login
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingIntent) {
      router.push(`/workspace?intent=${pendingIntent}`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#fafafa] overflow-hidden font-sans flex items-center">
      
      {/* --- ANIMATED BACKGROUND SYSTEM --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
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
      `}} />

      {/* --- MOVING COLORS & GLASS EFFECT --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center">
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-400/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-purple-400/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-green-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000" />
        
        {/* Full-page frosted glass overlay */}
        <div className="absolute inset-0 backdrop-blur-[50px] bg-white/40" />
        
        {/* CSS Dot Grid over the glass */}
        <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] opacity-60 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* --- MAIN LAYOUT (Spread out with larger max-width and gaps) --- */}
      <main className="relative z-10 w-full max-w-6xl mx-auto p-4 sm:p-8 flex flex-col md:flex-row gap-16 md:gap-24 lg:gap-32 items-center justify-between">

        {/* --- LEFT COLUMN: VALUE PROPOSITION --- */}
        <div className="flex-1 w-full animate-in slide-in-from-left-4 fade-in duration-700">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8 tracking-tighter text-[#0f172a] leading-[1.05]">
            Where research <br className="hidden sm:block" /> gets done.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-12 max-w-lg font-medium leading-relaxed">
            An AI-powered workspace that helps students and writers move from idea to submission-ready documents faster.
          </p>

          {/* Left-Aligned Value Bullets with Colorful Icons */}
          <div className="flex flex-col gap-5 text-base font-bold text-gray-800">
            {["Topic Generation", "Chapter Structuring", "Format & Export"].map((feature, idx) => {
              const bgColors = ["bg-blue-500", "bg-purple-500", "bg-green-500"];
              return (
                <span key={idx} className="flex items-center gap-4">
                  <span className={`flex items-center justify-center w-6 h-6 ${bgColors[idx]} text-white rounded-sm shadow-sm`}>
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

        {/* --- RIGHT COLUMN: INTENT BUTTONS --- */}
        <div className="w-full md:w-[500px] shrink-0 animate-in slide-in-from-right-4 fade-in duration-700 delay-100">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-6">Let's set up your workspace</h2>

          <div className="flex flex-col gap-5">
            {/* Button 1: Custom Topic Intent */}
            <button 
              onClick={() => handleActionClick("custom")}
              className="group w-full text-left p-6 sm:p-8 bg-white/70 backdrop-blur-md border border-white/50 rounded-xl shadow-lg hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex items-center justify-between"
            >
              <div className="pr-4">
                <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">I have a research topic</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Start structuring chapters based on your approved idea.
                </p>
              </div>
              <div className="shrink-0 text-yellow-500 transition-transform transform group-hover:translate-x-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Button 2: Generate Topic Intent */}
            <button 
              onClick={() => handleActionClick("generate")}
              className="group w-full text-left p-6 sm:p-8 bg-white/70 backdrop-blur-md border border-white/50 rounded-xl shadow-lg hover:border-purple-400 hover:shadow-xl transition-all duration-300 flex items-center justify-between"
            >
              <div className="pr-4">
                <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">I need a topic idea</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Let our AI suggest topics aligned with your course.
                </p>
              </div>
              <div className="shrink-0 text-yellow-500 transition-transform transform group-hover:translate-x-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          <div className="mt-10 text-left">
            <Link 
              href="/originality" 
              className="inline-flex items-center gap-2 text-sm font-black text-red-600 underline decoration-orange-500 decoration-[3px] underline-offset-4 hover:text-red-700 transition-colors uppercase tracking-widest"
            >
              Need to fix Similarity first? 
              <span aria-hidden="true" className="text-yellow-500 text-xl leading-none no-underline">&rarr;</span>
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
