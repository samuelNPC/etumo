"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export default function OriginalityCenter() {
  const [user, setUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState("");
  const [cleanedResults, setCleanedResults] = useState<string | null>(null);
  
  const [usageCount, setUsageCount] = useState(0);
  const [showSubscription, setShowSubscription] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const FREE_LIMIT = 20;

  // 1. Initialize Auth and Load Data (Firebase + LocalStorage sync)
  useEffect(() => {
    const today = new Date().toDateString();

    const loadLocalData = () => {
      const localData = localStorage.getItem("etumo_usage");
      if (localData) {
        const { count, date } = JSON.parse(localData);
        if (date === today) {
          setUsageCount(count);
        } else {
          setUsageCount(0); // Reset for a new day
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // User is logged in: Fetch from Firebase to sync across devices
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.lastUsageDate === today) {
              setUsageCount(data.originalityUsageCount || 0);
              // Sync Firebase down to LocalStorage
              localStorage.setItem("etumo_usage", JSON.stringify({ count: data.originalityUsageCount, date: today }));
            } else {
              setUsageCount(0); // Reset for a new day
            }
          } else {
            loadLocalData(); // Fallback if no Firebase doc exists yet
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          loadLocalData();
        }
      } else {
        // Not logged in: Rely entirely on LocalStorage
        loadLocalData();
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Handle Text Fixing and Saving Progress
  const handleFix = async (type: "ai_bypass" | "plagiarism_bypass") => {
    if (usageCount >= FREE_LIMIT) {
      setShowSubscription(true);
      return;
    }

    if (!inputText.trim()) {
      alert("Please paste some text first.");
      return;
    }

    setIsProcessing(true);
    setCleanedResults(null);
    setCopyFeedback(false);

    // Simulate API Delay
    setTimeout(async () => {
      const resultText = `[Fixed using ${type === 'ai_bypass' ? 'AI Humanizer' : 'Similarity Bypass'}] ${inputText}`;
      setCleanedResults(resultText);
      setIsProcessing(false);

      // Update Counts
      const newCount = usageCount + 1;
      const today = new Date().toDateString();
      setUsageCount(newCount);

      // Save to LocalStorage immediately
      localStorage.setItem("etumo_usage", JSON.stringify({ count: newCount, date: today }));

      // Save to Firebase permanently if logged in
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, {
            originalityUsageCount: newCount,
            lastUsageDate: today
          }, { merge: true });
        } catch (error) {
          console.error("Error syncing to Firebase:", error);
        }
      }
    }, 1500);
  };

  // 3. Handle Clipboard Copy
  const handleCopy = () => {
    if (cleanedResults) {
      navigator.clipboard.writeText(cleanedResults);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }
  };

  // 4. Handle Full Document Upload Mock
  const handleDocumentUpload = () => {
    const confirmed = window.confirm("Unlock Full Document Remediation for 25,000 UGX via Mobile Money. Proceed to payment gateway?");
    if (confirmed) {
      alert("Redirecting to payment..."); // Replace with actual redirect
    }
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: Text Remediation (Free Quota) */}
      <div className="border border-gray-300 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Text Remediation</h2>
          <span className="text-xs font-bold uppercase tracking-widest bg-gray-100 px-3 py-1 text-gray-600">
            {FREE_LIMIT - usageCount} Free Uses Left Today
          </span>
        </div>
        
        <textarea
          className="w-full border border-gray-300 p-4 bg-gray-50 outline-none text-sm rounded-none focus:border-black resize-y min-h-[150px] mb-4"
          placeholder="Paste flagged paragraphs from Turnitin or AI detectors here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <button 
            onClick={() => handleFix("plagiarism_bypass")} 
            disabled={isProcessing}
            className="flex-1 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-none"
          >
            {isProcessing ? "Processing..." : "Fix Similarity"}
          </button>
          <button 
            onClick={() => handleFix("ai_bypass")} 
            disabled={isProcessing}
            className="flex-1 bg-[#d97706] text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] disabled:bg-gray-400 transition-colors rounded-none"
          >
            {isProcessing ? "Processing..." : "Humanize (AI Bypass)"}
          </button>
        </div>

        {/* Cleaned Result & Copy Action */}
        {cleanedResults && (
          <div className="bg-green-50 p-6 border border-green-200 mt-6 relative animate-in fade-in duration-300">
            <h3 className="font-bold text-xs uppercase tracking-wider text-green-900 mb-2">Remediated Text</h3>
            <p className="text-sm text-green-900 pr-8">{cleanedResults}</p>
            
            <button 
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 text-green-700 hover:text-green-900 hover:bg-green-100 transition-colors"
              title="Copy to clipboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
            
            {copyFeedback && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mt-4 animate-in fade-in">
                ✓ Text copied to clipboard
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: Full Document Upload */}
      <div className="border border-gray-300 bg-gray-50 p-8 text-center shadow-sm">
        <h3 className="font-bold text-lg text-gray-900 mb-2">Upload Full Document</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          Skip the copy-pasting. Upload your entire PDF or Word document, and our engine will fix the formatting and similarity in one go.
        </p>
        
        <div className="border-2 border-dashed border-gray-400 p-8 bg-white mb-6 relative cursor-pointer hover:bg-gray-50 transition-colors">
          <input type="file" accept=".pdf,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <span className="font-bold text-sm text-gray-700 uppercase tracking-widest">Select PDF or Word File</span>
          <p className="text-xs text-gray-400 mt-2">Attaching is free.</p>
        </div>

        <button 
          onClick={handleDocumentUpload}
          className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-none"
        >
          Fix Full Document (25,000 UGX)
        </button>
      </div>

      {/* SECTION 3: Subscription Upsell (Triggered at limit) */}
      {showSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-gray-300 max-w-md w-full p-8 shadow-2xl text-center relative">
            <button 
              onClick={() => setShowSubscription(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2 transition-colors"
            >
              ✕
            </button>
            
            <div className="w-16 h-16 bg-orange-100 border-2 border-[#d97706] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#d97706] text-2xl font-bold">!</span>
            </div>
            <h3 className="font-bold text-2xl tracking-tight text-gray-900 mb-2">Daily Limit Reached</h3>
            <p className="text-sm text-gray-500 mb-8">
              You have used your 20 free text removals for today. You can wait until tomorrow, or unlock bulk removals right now.
            </p>
            
            <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
              <h4 className="font-bold text-gray-900 uppercase tracking-wider text-sm mb-1">Pro Tier</h4>
              <p className="text-xs text-gray-600">Unlock 100 text removals for uninterrupted workflow.</p>
            </div>

            <button 
              onClick={() => alert("Redirecting to payment gateway...")}
              className="w-full bg-[#d97706] text-white font-bold py-4 uppercase text-sm tracking-wider hover:bg-[#b45309] transition-colors rounded-none"
            >
              Unlock Now (10,000 UGX)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
