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
    // Removed "flex items-center" so content aligns to the top naturally
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#fafafa] overflow-hidden font-sans">
      
      {/* --- COLORFUL AMBIENT GLOW & DOT GRID --- */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
        {/* Colorful glows inspired by the logo */}
        <div className="absolute top-0 -left-[10%] w-[500px] h-[500px] bg-blue-400/20 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-purple-400/20 blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute -bottom-[10%] left-[20%] w-[600px] h-[400px] bg-green-400/10 blur-[120px] rounded-full mix-blend-multiply" />
        
        {/* CSS Dot Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_30%,#000_70%,transparent_100%)]" />
      </div>

      {/* Added pt-12 md:pt-24 to push content down manually just enough, while using items-start */}
      <main className="relative z-10 w-full max-w-5xl mx-auto p-4 sm:p-8 pt-12 md:pt-24 flex flex-col md:flex-row gap-12 md:gap-8 items-start justify-between">

        {/* --- LEFT COLUMN: VALUE PROPOSITION --- */}
        <div className="flex-1 w-full animate-in slide-in-from-left-4 fade-in duration-700">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tighter text-[#0f172a] leading-[1.05]">
            Where research <br className="hidden sm:block" /> gets done.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-10 max-w-md font-medium leading-relaxed">
            An AI-powered workspace that helps students and writers move from idea to submission-ready documents faster.
          </p>

          {/* Left-Aligned Value Bullets with Colorful Icons */}
          <div className="flex flex-col gap-4 text-sm font-bold text-gray-800">
            {["Topic Generation", "Chapter Structuring", "Format & Export"].map((feature, idx) => {
              // Cycle through logo-inspired colors for the checkmarks
              const bgColors = ["bg-blue-500", "bg-purple-500", "bg-green-500"];
              return (
                <span key={idx} className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-5 h-5 ${bgColors[idx]} text-white rounded-sm shadow-sm`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="w-full md:w-[440px] shrink-0 animate-in slide-in-from-right-4 fade-in duration-700 delay-100">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-5">Let's set up your workspace</h2>

          <div className="flex flex-col gap-4">
            {/* Button 1: Custom Topic Intent */}
            <button 
              onClick={() => handleActionClick("custom")}
              className="group w-full text-left p-6 bg-white border-2 border-gray-100 rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200 flex items-center justify-between"
            >
              <div className="pr-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">I have a research topic</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Start structuring chapters based on your approved idea.
                </p>
              </div>
              <div className="shrink-0 text-gray-300 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Button 2: Generate Topic Intent */}
            <button 
              onClick={() => handleActionClick("generate")}
              className="group w-full text-left p-6 bg-white border-2 border-gray-100 rounded-lg shadow-sm hover:border-purple-500 hover:shadow-md transition-all duration-200 flex items-center justify-between"
            >
              <div className="pr-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">I need a topic idea</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Let our AI suggest topics aligned with your course.
                </p>
              </div>
              <div className="shrink-0 text-gray-300 group-hover:text-purple-500 transition-colors transform group-hover:translate-x-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          <div className="mt-8 text-left">
            <Link href="/originality" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
              Need to fix Similarity first? 
              <span aria-hidden="true" className="text-lg leading-none">&rarr;</span>
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
