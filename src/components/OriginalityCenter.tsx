"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface TurnitinData {
  studentName: string;
  overallSimilarity: number;
  aiScore: number; 
  issues: {
    notCited: number;
    missingQuotations: number;
  };
  topSources: string[];
}

export default function OriginalityCenter() {
  const [user, setUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState("");
  const [cleanedResults, setCleanedResults] = useState<string | null>(null);

  const [usageCount, setUsageCount] = useState(0);
  const [showSubscription, setShowSubscription] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  // Track which specific remediation type is loading
  const [remediatingType, setRemediatingType] = useState<"ai_bypass" | "plagiarism_bypass" | null>(null);
  const [turnitinData, setTurnitinData] = useState<TurnitinData | null>(null);

  const FREE_LIMIT = 20;

  useEffect(() => {
    const today = new Date().toDateString();

    const loadLocalData = () => {
      const localData = localStorage.getItem("etumo_usage");
      if (localData) {
        const { count, date } = JSON.parse(localData);
        if (date === today) {
          setUsageCount(count);
        } else {
          setUsageCount(0);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.lastUsageDate === today) {
              setUsageCount(data.originalityUsageCount || 0);
              localStorage.setItem("etumo_usage", JSON.stringify({ count: data.originalityUsageCount, date: today }));
            } else {
              setUsageCount(0);
            }
          } else {
            loadLocalData();
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          loadLocalData();
        }
      } else {
        loadLocalData();
      }
    });

    return () => unsubscribe();
  }, []);

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

    try {
      const response = await fetch("/api/rewrite", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          flaggedTexts: [inputText],
          type: type 
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error || "Server processing failed");

      if (data.success && data.cleanedData && data.cleanedData.length > 0) {
        setCleanedResults(data.cleanedData[0].rewritten);
      } else {
        throw new Error("Failed to parse the AI response.");
      }

      const newCount = usageCount + 1;
      const today = new Date().toDateString();
      setUsageCount(newCount);
      localStorage.setItem("etumo_usage", JSON.stringify({ count: newCount, date: today }));

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
    } catch (error) {
      alert("Error processing text. Check your connection and try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (cleanedResults) {
      navigator.clipboard.writeText(cleanedResults);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) {
      alert("Please select a Turnitin PDF report first.");
      return;
    }

    setIsParsing(true);
    setTurnitinData(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/parse-turnitin", {
        method: "POST",
        body: formData, 
      });

      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error || "Failed to parse document.");

      setTurnitinData(data.data);

    } catch (error: any) {
      alert(error.message || "An error occurred while scanning the document.");
    } finally {
      setIsParsing(false);
    }
  };

  // Full Document Remediation with Type Selection
  const handleProceedToPayment = async (type: "ai_bypass" | "plagiarism_bypass") => {
    const featureName = type === "ai_bypass" ? "AI Detection Remediation" : "Plagiarism Remediation";
    const isPaid = window.confirm(`Redirecting to Mobile Money checkout for 25,000 UGX to unlock ${featureName}. Click OK to simulate successful payment.`);
    if (!isPaid || !selectedFile) return;

    setRemediatingType(type);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", type); // Send the specific bypass type to the API

      const aiResponse = await fetch("/api/remediate-document", {
        method: "POST",
        body: formData,
      });

      const aiData = await aiResponse.json();

      if (!aiResponse.ok || aiData.error) {
        throw new Error(aiData.error || "Failed to remediate the document.");
      }

      const compileResponse = await fetch("/api/compile-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawText: aiData.remediatedText,
          rawTitle: `${turnitinData?.studentName || "Student"} Cleaned Research`
        }),
      });

      if (!compileResponse.ok) {
        throw new Error("Document compilation failed.");
      }

      const blob = await compileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${turnitinData?.studentName?.replace(/\s+/g, "_") || "Clean"}_${type === "ai_bypass" ? "AI_Bypassed" : "Plagiarism_Bypassed"}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      setTurnitinData(null); 
      setSelectedFile(null);

    } catch (error: any) {
      alert(error.message || "An error occurred during document remediation.");
    } finally {
      setRemediatingType(null);
    }
  };

  return (
    <div className="space-y-8">

      
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

        {cleanedResults && (
          <div className="bg-green-50 p-6 border border-green-200 mt-6 relative animate-in fade-in duration-300">
            <h3 className="font-bold text-xs uppercase tracking-wider text-green-900 mb-2">Remediated Text</h3>
            <p className="text-sm text-green-900 pr-8 whitespace-pre-wrap">{cleanedResults}</p>

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

      
      <div className="border border-gray-300 bg-gray-50 p-8 text-center shadow-sm relative">
        <h3 className="font-bold text-lg text-gray-900 mb-2">Upload Turnitin Report</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          Upload your raw Turnitin PDF. Our engine will instantly scan your metrics and isolate flagged content.
        </p>

        <div className={`border-2 border-dashed ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-white'} p-8 mb-6 relative cursor-pointer hover:bg-gray-100 transition-colors`}>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          />
          <span className={`font-bold text-sm uppercase tracking-widest ${selectedFile ? 'text-green-700' : 'text-gray-700'}`}>
            {selectedFile ? selectedFile.name : "Select Turnitin PDF File"}
          </span>
          {!selectedFile && <p className="text-xs text-gray-400 mt-2">Attaching is free.</p>}
        </div>

        <button 
          onClick={handleDocumentUpload}
          disabled={!selectedFile || isParsing}
          className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-none"
        >
          {isParsing ? "Scanning Document Elements..." : "Analyze Document"}
        </button>
      </div>

      
      {turnitinData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-gray-300 max-w-lg w-full p-8 shadow-2xl relative text-left">
            <button 
              onClick={() => !remediatingType && setTurnitinData(null)}
              disabled={remediatingType !== null}
              className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2 transition-colors disabled:opacity-50"
            >
              ✕
            </button>

            <div className="border-b border-gray-200 pb-4 mb-6">
              <span className="text-xs font-mono uppercase text-[#d97706] tracking-wider font-bold">Analysis Complete</span>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">Hello, {turnitinData.studentName}</h3>
              <p className="text-sm text-gray-500 mt-1">We have securely mapped your document framework.</p>
            </div>

            <div className={`grid gap-4 mb-6 ${turnitinData.overallSimilarity > 0 && turnitinData.aiScore > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {turnitinData.overallSimilarity > 0 && (
                <div className="bg-red-50 p-4 border border-red-100 flex flex-col justify-center">
                  <span className="block text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1">Plagiarism</span>
                  <span className="text-2xl font-bold text-red-600">{turnitinData.overallSimilarity}%</span>
                </div>
              )}
              {turnitinData.aiScore > 0 && (
                <div className="bg-purple-50 p-4 border border-purple-100 flex flex-col justify-center">
                  <span className="block text-[10px] font-bold text-purple-800 uppercase tracking-wider mb-1">AI Detected</span>
                  <span className="text-2xl font-bold text-purple-600">{turnitinData.aiScore}%</span>
                </div>
              )}
              <div className="bg-orange-50 p-4 border border-orange-100 flex flex-col justify-center">
                <span className="block text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-1">Unquoted Matches</span>
                <span className="text-2xl font-bold text-orange-600">{turnitinData.issues.notCited}</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                Our engine will extract flagged segments and restructure the syntax to bypass detection algorithms, injecting proper academic formatting to drop your score.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleProceedToPayment("plagiarism_bypass")}
                disabled={remediatingType !== null}
                className="w-full bg-black text-white font-bold py-4 flex flex-col items-center justify-center uppercase text-sm tracking-wider hover:bg-gray-800 disabled:bg-gray-500 transition-colors rounded-none shadow-md"
              >
                <span>{remediatingType === "plagiarism_bypass" ? "Rewriting Document..." : "Remediate Similarity (25,000 UGX)"}</span>
                {remediatingType === "plagiarism_bypass" && <span className="text-[10px] font-medium opacity-70 mt-1 capitalize tracking-normal animate-pulse">Rebuilding tables and citations (up to 60s)</span>}
              </button>

              <button 
                onClick={() => handleProceedToPayment("ai_bypass")}
                disabled={remediatingType !== null}
                className="w-full bg-[#d97706] text-white font-bold py-4 flex flex-col items-center justify-center uppercase text-sm tracking-wider hover:bg-[#b45309] disabled:bg-gray-500 transition-colors rounded-none shadow-md"
              >
                <span>{remediatingType === "ai_bypass" ? "Humanizing Document..." : "Remediate AI Detection (25,000 UGX)"}</span>
                {remediatingType === "ai_bypass" && <span className="text-[10px] font-medium opacity-70 mt-1 capitalize tracking-normal animate-pulse">Injecting perplexity and burstiness (up to 60s)</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
