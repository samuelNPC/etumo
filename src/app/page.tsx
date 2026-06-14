"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase"; // Added auth import
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth"; // Added auth listener
import AuthModal from "@/components/AuthModal";

export default function Home() {
  const router = useRouter();

  // Track Logged In User
  const [user, setUser] = useState<User | null>(null);

  // App Mode State
  const [inputMode, setInputMode] = useState<"generate" | "custom" | null>(null);

  // Form States
  const [course, setCourse] = useState("");
  const [interest, setInterest] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth Modal & Progression States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // 1. Listen for user session on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle AI Generation
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

  // 3. Lock in the topic - bypass AuthModal if already logged in!
  const handleLockTopic = async (selectedTopic: string) => {
    localStorage.setItem("etumo_pending_topic", selectedTopic);
    localStorage.setItem("etumo_pending_course", course || "General");
    
    if (user) {
      // User is already logged in, skip the modal and go straight to workspace creation
      await handleInitializeWorkspace();
    } else {
      // User is not logged in, show the auth modal
      setShowAuthModal(true);
    }
  };

  // 4. Write to database and push to workspace
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
        // Attach the user's UID to the project so we know it belongs to them
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
    <main className="max-w-3xl mx-auto p-4 sm:p-8 mt-8 relative">
      
      {/* Global Initializing Overlay (Shows when bypassing AuthModal) */}
      {initializing && !showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white p-8 max-w-sm w-full text-center shadow-2xl border border-gray-300">
            <div className="w-12 h-12 border-4 border-[#d97706] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-2">Configuring Workspace...</h2>
            <p className="text-sm text-gray-500">Setting up your research OS.</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-900">The evolution of academic research starts here.</h1>
        <p className="text-gray-600 mb-4">Instant Turnitin refinement and faculty-aligned chapter generation.</p>

        {/* Upsell to Originality Center */}
        <Link href="/originality" className="inline-block bg-orange-50 border border-orange-200 text-orange-800 text-sm font-bold px-4 py-2 uppercase tracking-wider hover:bg-orange-100 transition-colors">
          Need to fix Similarity or AI? &rarr;
        </Link>
      </div>

      {error && (
        <div className="mb-6 border border-red-500 bg-red-50 p-4 text-red-700 text-sm font-bold shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {/* NEW DECISION WIZARD */}
      <div className="mb-6 border border-gray-300 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Lets get you started ...</h2>
        <p className="text-sm text-gray-500 mb-6">Sub test pick one option below .</p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border border-gray-200 bg-gray-50 p-4">
          <span className="font-bold text-sm text-gray-800 uppercase tracking-wider">Do you have a research topic ?</span>

          <div className="flex gap-8 sm:ml-auto">
            {/* Custom Topic Checkbox (Yes) */}
            <label className="flex items-center cursor-pointer gap-3 group">
              <input 
                type="checkbox" 
                checked={inputMode === "custom"} 
                onChange={() => setInputMode(inputMode === "custom" ? null : "custom")} 
                className="w-5 h-5 border-gray-400 rounded-none accent-black cursor-pointer transition-all"
              />
              <span className="font-bold text-sm uppercase text-gray-700 group-hover:text-black">Yes</span>
            </label>

            {/* Generate Topic Checkbox (No) */}
            <label className="flex items-center cursor-pointer gap-3 group">
              <input 
                type="checkbox" 
                checked={inputMode === "generate"} 
                onChange={() => setInputMode(inputMode === "generate" ? null : "generate")} 
                className="w-5 h-5 border-gray-400 rounded-none accent-[#d97706] cursor-pointer transition-all"
              />
              <span className="font-bold text-sm uppercase text-gray-700 group-hover:text-[#d97706]">No</span>
            </label>
          </div>
        </div>
      </div>

      {/* FORM PATH A: Custom Topic (They clicked YES) */}
      {inputMode === "custom" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 border border-gray-300 p-6 bg-gray-50 mb-8 shadow-sm">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleLockTopic(customTopic);
            }} 
            className="flex flex-col gap-4"
          >
            <textarea
              placeholder="Type your approved research topic here..."
              rows={3}
              className="border border-gray-400 p-3 w-full bg-white outline-none rounded-none focus:border-black resize-none"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              required
            />
             <input
              type="text"
              placeholder="What is your course? (Optional)"
              className="border border-gray-400 p-3 w-full bg-white outline-none rounded-none focus:border-black"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
            <button
              type="submit"
              disabled={initializing}
              className="bg-black text-white font-bold p-3 w-full hover:bg-gray-800 transition-colors rounded-none uppercase tracking-wider text-sm disabled:bg-gray-400"
            >
              Lock In Topic
            </button>
          </form>
        </div>
      )}

      {/* FORM PATH B: Generate Topic (They clicked NO) */}
      {inputMode === "generate" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 border border-gray-300 p-6 bg-gray-50 mb-8 shadow-sm">
          <form onSubmit={generateTopics} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="What is your course? (e.g., Procurement)"
              className="border border-gray-400 p-3 w-full bg-white outline-none rounded-none focus:border-black"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="What is your research interest? (e.g., Digital Systems)"
              className="border border-gray-400 p-3 w-full bg-white outline-none rounded-none focus:border-black"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading || initializing}
              className="bg-[#d97706] text-white font-bold p-3 w-full hover:bg-[#b45309] transition-colors disabled:bg-gray-400 rounded-none uppercase tracking-wider text-sm"
            >
              {loading ? "Scanning Academic Matrix..." : "Generate Research Topics"}
            </button>
          </form>

          {/* Render AI Topics List inside the active panel */}
          {topics.length > 0 && (
            <div className="mt-6 border-t border-gray-300 pt-6">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-gray-800">Select a Topic to Continue:</h3>
              <ul className="flex flex-col gap-3">
                {topics.map((topic, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => handleLockTopic(topic)}
                      disabled={initializing}
                      className="w-full text-left border border-gray-300 p-4 hover:border-[#d97706] hover:bg-orange-50 bg-white transition-all font-medium text-gray-900 rounded-none shadow-sm disabled:opacity-50"
                    >
                      {topic}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleInitializeWorkspace} 
        initializing={initializing} 
      />
    </main>
  );
}
