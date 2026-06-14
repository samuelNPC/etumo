"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import AuthModal from "@/components/AuthModal"; // Import the new component

export default function Home() {
  const router = useRouter();
  
  // App Mode State
  const [inputMode, setInputMode] = useState<"generate" | "custom">("generate");
  
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

  // 1. Handle AI Generation
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

  // 2. Lock in the topic and trigger the Auth Modal
  const handleLockTopic = (selectedTopic: string) => {
    localStorage.setItem("etumo_pending_topic", selectedTopic);
    localStorage.setItem("etumo_pending_course", course || "General");
    setShowAuthModal(true);
  };

  // 3. Write to database and push to workspace (Passed to AuthModal as onSuccess)
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
    <main className="max-w-3xl mx-auto p-4 sm:p-8 mt-8">
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

      {/* Mode Toggle Switch */}
      <div className="flex border-b border-gray-300 mb-6">
        <button
          onClick={() => setInputMode("generate")}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            inputMode === "generate" ? "border-[#d97706] text-[#d97706] bg-gray-50" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Generate New Topic
        </button>
        <button
          onClick={() => setInputMode("custom")}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            inputMode === "custom" ? "border-[#d97706] text-[#d97706] bg-gray-50" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          I Have My Own Topic
        </button>
      </div>

      {/* FORM PATH A: Generate Topic */}
      {inputMode === "generate" && (
        <div className="border border-gray-300 p-6 bg-gray-50">
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
              disabled={loading}
              className="bg-[#d97706] text-white font-bold p-3 w-full hover:bg-[#b45309] transition-colors disabled:bg-gray-400 rounded-none uppercase tracking-wider text-sm"
            >
              {loading ? "Scanning Academic Matrix..." : "Generate Research Topics"}
            </button>
          </form>
        </div>
      )}

      {/* Render AI Topics List */}
      {inputMode === "generate" && topics.length > 0 && (
        <div className="mt-8 border border-gray-300 p-6 bg-white shadow-sm">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-gray-800">Select a Topic to Continue:</h3>
          <ul className="flex flex-col gap-3">
            {topics.map((topic, index) => (
              <li key={index}>
                <button 
                  onClick={() => handleLockTopic(topic)}
                  className="w-full text-left border border-gray-300 p-4 hover:border-[#d97706] hover:bg-orange-50 transition-all font-medium text-gray-900 rounded-none"
                >
                  {topic}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FORM PATH B: Custom Topic */}
      {inputMode === "custom" && (
        <div className="border border-gray-300 p-6 bg-gray-50">
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
              className="bg-black text-white font-bold p-3 w-full hover:bg-gray-800 transition-colors rounded-none uppercase tracking-wider text-sm"
            >
              Lock In Custom Topic
            </button>
          </form>
        </div>
      )}

      {/* Cleaned up: The logic now lives inside AuthModal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleInitializeWorkspace} 
        initializing={initializing} 
      />
    </main>
  );
}
