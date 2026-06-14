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
    <div className="relative min-h-[calc(100vh-4rem)] bg-white overflow-hidden font-sans flex items-center">
      
      {/* --- MINIMALIST DOT GRID & AMBIENT GLOW BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center">
        {/* Subtle top glow */}
        <div className="absolute top-0 -translate-y-12 w-[600px] h-[300px] bg-green-50/50 blur-[80px] rounded-full" />
        {/* CSS Dot Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      <main className="relative z-10 w-full max-w-5xl mx-auto p-4 sm:p-8 flex flex-col md:flex-row gap-8 items-center justify-between">

        {/* --- LEFT COLUMN: VALUE PROPOSITION --- */}
        <div className="flex-1 w-full animate-in slide-in-from-left-4 fade-in duration-700">
          <span className="inline-block py-1 px-3 bg-gray-50 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-5 rounded-sm">
            The Evolution of Academic Research
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tighter text-gray-900 leading-[1.05]">
            Where research <br className="hidden sm:block" /> gets done.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md font-medium leading-relaxed">
            An AI-powered workspace that helps students and writers move from idea to submission-ready documents faster.
          </p>

          {/* Left-Aligned Value Bullets - Compact Layout */}
          <div className="flex flex-col gap-3 text-sm font-semibold text-gray-800">
            {["Topic Generation", "Chapter Structuring", "Format & Export"].map((feature, idx) => (
              <span key={idx} className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-black text-white rounded-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* --- RIGHT COLUMN: INTENT BUTTONS --- */}
        <div className="w-full md:w-[420px] shrink-0 animate-in slide-in-from-right-4 fade-in duration-700 delay-100">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-4">Let's set up your workspace</h2>

          <div className="flex flex-col gap-3">
            {/* Button 1: Custom Topic Intent */}
            <button 
              onClick={() => handleActionClick("custom")}
              className="group w-full text-left p-5 bg-white border border-gray-200 rounded-sm shadow-sm hover:border-black hover:shadow-md transition-all duration-200 flex items-center justify-between"
            >
              <div className="pr-4">
                <h3 className="font-bold text-base text-gray-900 mb-0.5">I have a research topic</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Start structuring chapters based on your approved idea.
                </p>
              </div>
              <div className="shrink-0 text-gray-300 group-hover:text-black transition-colors transform group-hover:translate-x-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Button 2: Generate Topic Intent */}
            <button 
              onClick={() => handleActionClick("generate")}
              className="group w-full text-left p-5 bg-white border border-gray-200 rounded-sm shadow-sm hover:border-black hover:shadow-md transition-all duration-200 flex items-center justify-between"
            >
              <div className="pr-4">
                <h3 className="font-bold text-base text-gray-900 mb-0.5">I need a topic idea</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Let our AI suggest topics aligned with your course.
                </p>
              </div>
              <div className="shrink-0 text-gray-300 group-hover:text-black transition-colors transform group-hover:translate-x-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          <div className="mt-6 text-left">
            <Link href="/originality" className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase tracking-wide">
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
