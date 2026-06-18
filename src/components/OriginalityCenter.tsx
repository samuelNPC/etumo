"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import LoadingGame from "./LoadingGame"; 
import PaymentModal from "./PaymentModal"; // 🚨 Imported the new LivePay modal

interface TurnitinData {
  studentName: string;
  overallSimilarity: number;
  aiScore: number; 
  aiFlaggedSections: number; 
  issues: {
    notCited: number;
    missingQuotations: number;
  };
  topSources: string[];
}

interface RemediatedFile {
  url: string;
  filename: string;
  downloaded: boolean;
}

const PARSING_MESSAGES = [
  "Reading PDF structure...",
  "Extracting similarity metrics...",
  "Identifying AI footprints...",
  "Compiling originality report..."
];

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
  const [parsingMsgIndex, setParsingMsgIndex] = useState(0);

  const [remediatingType, setRemediatingType] = useState<"ai_bypass" | "plagiarism_bypass" | null>(null);
  const [turnitinData, setTurnitinData] = useState<TurnitinData | null>(null);

  const [remediatedFile, setRemediatedFile] = useState<RemediatedFile | null>(null);

  // 🚨 NEW: Universal Payment State
  const [paymentState, setPaymentState] = useState<{
    isActive: boolean;
    amount: number;
    description: string;
    onSuccess: () => void;
  }>({
    isActive: false,
    amount: 0,
    description: "",
    onSuccess: () => {},
  });

  const FREE_LIMIT = 30; // 🚨 Aligned with your 30 Free limit criteria

  useEffect(() => {
    const today = new Date().toDateString();
    const loadLocalData = () => {
      const localData = localStorage.getItem("etumo_usage");
      if (localData) {
        const { count, date } = JSON.parse(localData);
        if (date === today) setUsageCount(count);
        else setUsageCount(0);
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
          } else loadLocalData();
        } catch (error) {
          loadLocalData();
        }
      } else loadLocalData();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isParsing) {
      interval = setInterval(() => {
        setParsingMsgIndex((prev) => (prev + 1) % PARSING_MESSAGES.length);
      }, 2500);
    } else {
      setParsingMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [isParsing]);

  const handleResetWorkspace = () => {
    if (remediatedFile) {
      window.URL.revokeObjectURL(remediatedFile.url);
    }
    setRemediatedFile(null);
    setTurnitinData(null);
    setSelectedFile(null);
  };

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
        body: JSON.stringify({ flaggedTexts: [inputText], type: type }),
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
        await setDoc(doc(db, "users", user.uid), { originalityUsageCount: newCount, lastUsageDate: today }, { merge: true });
      }
    } catch (error) {
      alert("Error processing text. Check your connection and try again.");
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

      const response = await fetch("/api/parse-turnitin", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error || "Failed to parse document.");

      const safeData = {
        ...data.data,
        aiScore: data.data.aiScore || 0,
        overallSimilarity: data.data.overallSimilarity || 0,
        aiFlaggedSections: data.data.aiFlaggedSections || 0,
      };

      setTurnitinData(safeData);
    } catch (error: any) {
      alert(error.message || "An error occurred while scanning the document.");
    } finally {
      setIsParsing(false);
    }
  };

  const triggerDownloadAction = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePopupDownloadNow = () => {
    if (remediatedFile) triggerDownloadAction(remediatedFile.url, remediatedFile.filename);
    setRemediatedFile(prev => prev ? { ...prev, downloaded: true } : null);
    setRemediatingType(null); 
  };

  const handlePopupDownloadLater = () => {
    setRemediatingType(null); 
  };

  // 🚨 NEW: Payment Unlock Logic for Text Removals
  const handleUnlockTextPackage = () => {
    setPaymentState({
      isActive: true,
      amount: 10000, // 10,000 UGX for 100 text removals
      description: "Unlock 100 Text Similarity/AI Removals",
      onSuccess: async () => {
        setPaymentState({ isActive: false, amount: 0, description: "", onSuccess: () => {} });
        setShowSubscription(false);
        
        // Push usageCount negative to grant exactly 100 new free attempts
        const newUsageCount = FREE_LIMIT - 100;
        setUsageCount(newUsageCount);
        const today = new Date().toDateString();
        localStorage.setItem("etumo_usage", JSON.stringify({ count: newUsageCount, date: today }));

        if (user) {
          await setDoc(doc(db, "users", user.uid), { originalityUsageCount: newUsageCount, lastUsageDate: today }, { merge: true });
        }
      }
    });
  };

  // 🚨 NEW: Triggers the Payment Modal for the Document Engine
  const initiateDocumentRemediation = (type: "ai_bypass" | "plagiarism_bypass") => {
    if (!selectedFile) return;

    setPaymentState({
      isActive: true,
      amount: 15000, // 🚨 15,000 UGX based on pricing rules
      description: type === "ai_bypass" ? "Full Document AI Detection Removal" : "Full Document Similarity Remediation",
      onSuccess: () => {
        setPaymentState({ isActive: false, amount: 0, description: "", onSuccess: () => {} });
        executeDocumentRemediation(type);
      }
    });
  };

  // The actual processing function that runs AFTER successful payment
  const executeDocumentRemediation = async (type: "ai_bypass" | "plagiarism_bypass") => {
    setRemediatingType(type);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile!);
      formData.append("type", type); 

      const aiResponse = await fetch("/api/remediate-document", { method: "POST", body: formData });
      const aiData = await aiResponse.json();

      if (!aiResponse.ok || aiData.error) throw new Error(aiData.error || "Failed to remediate the document.");

      const compileResponse = await fetch("/api/compile-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawText: aiData.remediatedText,
          rawTitle: `${turnitinData?.studentName || "Student"} Cleaned Research`
        }),
      });

      if (!compileResponse.ok) throw new Error("Document compilation failed.");

      const blob = await compileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = `${turnitinData?.studentName?.replace(/\s+/g, "_") || "Clean"}_${type === "ai_bypass" ? "AI_Bypassed" : "Plagiarism_Bypassed"}.docx`;

      setRemediatedFile({ url, filename, downloaded: false });
      setTurnitinData(null); 
      setSelectedFile(null);

    } catch (error: any) {
      alert(error.message || "An error occurred during document remediation.");
      setRemediatingType(null);
    }
  };

  return (
    <div className="space-y-8">

      {/* Payment Gateway Overlay */}
      {paymentState.isActive && (
        <PaymentModal
          amount={paymentState.amount}
          description={paymentState.description}
          onSuccess={paymentState.onSuccess}
          onCancel={() => setPaymentState({ isActive: false, amount: 0, description: "", onSuccess: () => {} })}
        />
      )}

      {remediatingType && (
        <LoadingGame 
          featureName={remediatingType === "ai_bypass" ? "AI Detection Restructuring" : "Similarity / Plagiarism Rewrite"} 
          isComplete={remediatedFile !== null}
          onDownloadNow={handlePopupDownloadNow}
          onDownloadLater={handlePopupDownloadLater}
        />
      )}

      {/* THE SUCCESS DASHBOARD */}
      {remediatedFile && !remediatingType ? (
        <div className="border border-gray-300 bg-white p-12 text-center shadow-sm animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            {remediatedFile.downloaded ? "Download Successful" : "Remediation Complete"}
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {remediatedFile.downloaded 
              ? "Your clean Microsoft Word document has been saved to your device. You can safely close this page or download it again." 
              : "Your completely rewritten document is securely held in your browser. Download it before leaving this page."}
          </p>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg inline-flex items-center gap-3 mb-10 text-left">
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <div>
              <p className="text-xs font-bold text-gray-900 uppercase tracking-widest truncate max-w-[200px] sm:max-w-xs">{remediatedFile.filename}</p>
              <p className="text-[10px] text-gray-500 font-mono">DOCX Format</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => {
                triggerDownloadAction(remediatedFile.url, remediatedFile.filename);
                setRemediatedFile(prev => prev ? { ...prev, downloaded: true } : null);
              }} 
              className="bg-black text-white px-8 py-4 uppercase text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors shadow-md"
            >
              {remediatedFile.downloaded ? "Download Again" : "Download Document"}
            </button>
            <button 
              onClick={handleResetWorkspace} 
              className="bg-gray-100 text-gray-700 px-8 py-4 uppercase text-xs font-bold tracking-widest hover:bg-gray-200 transition-colors"
            >
              Remediate Another File
            </button>
          </div>
        </div>
      ) : (
        /* Original Content */
        <div className={`space-y-8 ${remediatingType ? 'hidden' : 'block'}`}>
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
              <button onClick={() => handleFix("plagiarism_bypass")} disabled={isProcessing} className="flex-1 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-none">
                {isProcessing ? "Processing..." : "Fix Similarity"}
              </button>
              <button onClick={() => handleFix("ai_bypass")} disabled={isProcessing} className="flex-1 bg-[#d97706] text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] disabled:bg-gray-400 transition-colors rounded-none">
                {isProcessing ? "Processing..." : "Humanize (AI Bypass)"}
              </button>
            </div>
            {cleanedResults && (
              <div className="bg-green-50 p-6 border border-green-200 mt-6 relative animate-in fade-in duration-300">
                <h3 className="font-bold text-xs uppercase tracking-wider text-green-900 mb-2">Remediated Text</h3>
                <p className="text-sm text-green-900 pr-8 whitespace-pre-wrap">{cleanedResults}</p>
                <button onClick={handleCopy} className="absolute top-4 right-4 p-2 text-green-700 hover:text-green-900 hover:bg-green-100 transition-colors" title="Copy to clipboard">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
                {copyFeedback && <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mt-4 animate-in fade-in">✓ Text copied to clipboard</p>}
              </div>
            )}
          </div>

          <div className="border border-gray-300 bg-gray-50 p-8 text-center shadow-sm relative">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Upload Turnitin Report</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Upload your raw Turnitin PDF. Our engine will instantly scan your metrics and isolate flagged content.
            </p>
            <div className={`border-2 border-dashed ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-white'} p-8 mb-6 relative cursor-pointer hover:bg-gray-100 transition-colors`}>
              <input type="file" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <span className={`font-bold text-sm uppercase tracking-widest ${selectedFile ? 'text-green-700' : 'text-gray-700'}`}>
                {selectedFile ? selectedFile.name : "Select Turnitin PDF File"}
              </span>
              {!selectedFile && <p className="text-xs text-gray-400 mt-2">Attaching is free.</p>}
            </div>
            <button onClick={handleDocumentUpload} disabled={!selectedFile || isParsing} className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-none">
              {isParsing ? PARSING_MESSAGES[parsingMsgIndex] : "Analyze Document"}
            </button>
          </div>

          {turnitinData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white border border-gray-300 max-w-lg w-full p-8 shadow-2xl relative text-left">
                <button onClick={() => setTurnitinData(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2 transition-colors">✕</button>

                <div className="border-b border-gray-200 pb-4 mb-6">
                  <span className="text-xs font-mono uppercase text-[#d97706] tracking-wider font-bold">Analysis Complete</span>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">Hello, {turnitinData.studentName || "Student"}</h3>

                  <div className="mt-2 text-sm text-gray-700 font-medium leading-relaxed">
                    {(turnitinData.aiScore > 0 || turnitinData.overallSimilarity > 0) ? (
                      <p>
                        We found <span className="text-red-600 font-bold">{turnitinData.overallSimilarity > 0 ? `${turnitinData.overallSimilarity}% Plagiarism` : ''}</span> 
                        {turnitinData.overallSimilarity > 0 && turnitinData.aiScore > 0 ? ' and ' : ''}
                        <span className="text-purple-600 font-bold">{turnitinData.aiScore > 0 ? `${turnitinData.aiScore}% AI` : ''}</span>
                        {turnitinData.aiFlaggedSections > 0 ? ` across ${turnitinData.aiFlaggedSections} sections` : ''} in your document.
                      </p>
                    ) : (
                      <p>We have securely mapped your document framework. No major similarity detected.</p>
                    )}
                  </div>
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
                    <span className="text-2xl font-bold text-orange-600">{turnitinData.issues?.notCited || 0}</span>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">
                    Our engine will extract flagged segments and restructure the syntax to bypass detection algorithms, injecting proper academic formatting to drop your score.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* 🚨 Updated to exactly 15,000 UGX based on pricing rule */}
                  <button onClick={() => initiateDocumentRemediation("plagiarism_bypass")} className="w-full bg-black text-white font-bold py-4 flex flex-col items-center justify-center uppercase text-sm tracking-wider hover:bg-gray-800 transition-colors rounded-none shadow-md">
                    Remediate Similarity (15,000 UGX)
                  </button>
                  <button onClick={() => initiateDocumentRemediation("ai_bypass")} className="w-full bg-[#d97706] text-white font-bold py-4 flex flex-col items-center justify-center uppercase text-sm tracking-wider hover:bg-[#b45309] transition-colors rounded-none shadow-md">
                    Remediate AI Detection (15,000 UGX)
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSubscription && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white border border-gray-300 max-w-md w-full p-8 shadow-2xl text-center relative">
                <button onClick={() => setShowSubscription(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2 transition-colors">✕</button>
                <div className="w-16 h-16 bg-orange-100 border-2 border-[#d97706] rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-[#d97706] text-2xl font-bold">!</span></div>
                <h3 className="font-bold text-2xl tracking-tight text-gray-900 mb-2">Daily Limit Reached</h3>
                <p className="text-sm text-gray-500 mb-8">You have used your 30 free text removals for today.</p>
                {/* 🚨 Updated to 10,000 UGX based on pricing rule */}
                <button onClick={handleUnlockTextPackage} className="w-full bg-[#d97706] text-white font-bold py-4 uppercase text-sm tracking-wider hover:bg-[#b45309] transition-colors rounded-none">
                  Unlock 100 Removals (10,000 UGX)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
