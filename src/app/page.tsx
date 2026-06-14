"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import AuthModal from "@/components/AuthModal";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [inputMode, setInputMode] = useState<"generate" | "custom" | null>(null);
  
  const [course, setCourse] = useState("");
  const [interest, setInterest] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const generateTopics = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTopics([]);

    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, faculty: "General", interest }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || `Server Error: ${response.status}`);
      } else if (data.topics) {
        setTopics(data.topics);
      }
    } catch (err: any) {
      setError(err.message || "A critical network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleLockTopic = async (selectedTopic: string) => {
    localStorage.setItem("etumo_pending_topic", selectedTopic);
    localStorage.setItem("etumo_pending_course", course || "General");
    
    if (user) {
      await handleInitializeWorkspace();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleInitializeWorkspace = async () => {
    setInitializing(true);
    try {
      const finalTopic = localStorage.getItem("etumo_pending_topic") || "Untitled Research";
      const finalCourse = localStorage.getItem("etumo_pending_course") || "General";

      const docRef = await addDoc(collection(db, "projects"), {
        topic: finalTopic,
        course: finalCourse,
        faculty: "General",
        progress: 10,
        content: {},
        userId: auth.currentUser?.uid || "anonymous", 
        createdAt: new Date().toISOString(),
      });

      localStorage.removeItem("etumo_pending_topic");
      localStorage.removeItem("etumo_pending_course");
      router.push(`/workspace?id=${docRef.id}`);
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Failed to initialize your workspace database. Check Firebase rules.");
      setInitializing(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden font-sans">
      
      {/* --- STRIPE-LEVEL PREMIUM BACKGROUND SYSTEM --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top Right Orange/Red Glow */}
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-gradient-to-br from-[#EA4335]/10 to-[#FBBC05]/20 rounded-full blur-[100px] mix-blend-multiply" />
        {/* Bottom Left Blue/Purple Glow */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-[#4285F4]/10 to-[#9333EA]/10 rounded-full blur-[100px] mix-blend-multiply" />
        {/* Center subtle noise/pattern overlay (Optional) */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Global Initializing Overlay */}
      {initializing && !showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-10 max-w-sm w-full text-center shadow-2xl border border-gray-100 rounded-2xl">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-2">Creating Workspace...</h2>
            <p className="text-sm text-gray-500">Provisioning your AI research environment.</p>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-4xl mx-auto p-4 sm:p-8 pt-12 sm:pt-20">
        
        {/* --- PREMIUM HERO SECTION --- */}
        <div className="text-center mb-16 animate-in slide-in-from-bottom-4 duration-700">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-600 shadow-sm mb-6">
            The Evolution of Academic Research
          </span>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter text-gray-900 leading-[1.1]">
            Where research <br className="hidden sm:block" /> gets done.
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium">
            An AI-powered workspace that helps students and writers move from idea to submission-ready documents faster.
          </p>

          {/* Value Proposition Bullets */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 text-sm font-semibold text-gray-700">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#34A853]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Topic Generation
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#34A853]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Chapter Structuring
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#34A853]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Format & Export
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-8 border-l-4 border-red-500 bg-red-50 p-4 text-red-700 text-sm font-bold shadow-sm rounded-r-lg">
            ⚠️ {error}
          </div>
        )}

        {/* --- PREMIUM COMMAND UI (Replaces Checkboxes) --- */}
        <div className="mb-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Let's set up your workspace</h2>
            <Link href="/originality" className="text-sm font-bold text-[#d97706] hover:text-[#b45309] transition-colors hidden sm:block">
              Need to fix Similarity first? &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Custom Topic */}
            <div 
              onClick={() => setInputMode("custom")}
              className={`p-6 rounded-2xl cursor-pointer transition-all duration-200 border-2 bg-white/80 backdrop-blur-sm ${
                inputMode === "custom" 
                ? "border-black shadow-lg ring-1 ring-black" 
                : "border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors ${inputMode === "custom" ? "bg-black text-white" : "bg-gray-100 text-gray-600"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">I have a research topic</h3>
              <p className="text-sm text-gray-500 font-medium">Start structuring chapters and writing based on your approved idea.</p>
            </div>

            {/* Card 2: Generate Topic */}
            <div 
              onClick={() => setInputMode("generate")}
              className={`p-6 rounded-2xl cursor-pointer transition-all duration-200 border-2 bg-white/80 backdrop-blur-sm ${
                inputMode === "generate" 
                ? "border-[#4285F4] shadow-lg ring-1 ring-[#4285F4]" 
                : "border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors ${inputMode === "generate" ? "bg-[#4285F4] text-white" : "bg-gray-100 text-gray-600"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">I need a topic idea</h3>
              <p className="text-sm text-gray-500 font-medium">Let our AI matrix suggest high-quality topics aligned with your course.</p>
            </div>
          </div>
        </div>

        {/* --- FORM PATH A: Custom Topic --- */}
        {inputMode === "custom" && (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleLockTopic(customTopic);
              }} 
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-5"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Approved Topic</label>
                <textarea
                  placeholder="Paste your exact research topic here..."
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none font-medium"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Course (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Procurement, Computer Science"
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={initializing}
                className="mt-2 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-300 text-sm uppercase tracking-widest shadow-md hover:shadow-lg"
              >
                Initialize Workspace &rarr;
              </button>
            </form>
          </div>
        )}

        {/* --- FORM PATH B: Generate Topic --- */}
        {inputMode === "generate" && (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
            <form onSubmit={generateTopics} className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Course of Study</label>
                  <input
                    type="text"
                    placeholder="e.g., Business Administration"
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all font-medium"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Area of Interest</label>
                  <input
                    type="text"
                    placeholder="e.g., Digital Transformation"
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all font-medium"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || initializing}
                className="mt-2 bg-[#4285F4] text-white font-bold py-4 rounded-xl hover:bg-[#3367D6] transition-colors disabled:bg-blue-300 text-sm uppercase tracking-widest shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Scanning Matrix...
                  </>
                ) : (
                  "Generate Ideas"
                )}
              </button>
            </form>

            {/* AI Topics List Layer */}
            {topics.length > 0 && (
              <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 animate-in slide-in-from-bottom-4">
                <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-gray-400">Select an AI-Generated Topic:</h3>
                <ul className="flex flex-col gap-3">
                  {topics.map((topic, index) => (
                    <li key={index}>
                      <button 
                        onClick={() => handleLockTopic(topic)}
                        disabled={initializing}
                        className="w-full text-left border border-gray-200 p-5 rounded-xl hover:border-[#4285F4] hover:bg-blue-50 transition-all font-semibold text-gray-800 shadow-sm disabled:opacity-50 group flex justify-between items-center"
                      >
                        <span className="pr-4 leading-relaxed">{topic}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-[#4285F4] transition-opacity shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleInitializeWorkspace} 
        initializing={initializing} 
      />
    </div>
  );
}
