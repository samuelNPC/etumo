"use client";

import { useState } from "react";
import Link from "next/link";
import LockedDocumentViewer from "@/components/LockedDocumentViewer";

interface AnalysisData {
  questionCount: number;
  sectionCount: number;
  instrumentId: string;
  previewText: string; // 🚨 Added to hold the extracted text
}

export default function DataCollectorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "analyzing" | "checkout" | "success">("upload");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Controls the edge-to-edge document preview
  const [showPreview, setShowPreview] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setStep("analyzing");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/parse-instrument", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze document.");
      }

      setAnalysisData({
        questionCount: data.questionCount,
        sectionCount: data.sectionCount,
        instrumentId: data.instrumentId,
        previewText: data.previewText || "No text extracted."
      });

      setStep("checkout");
    } catch (error: any) {
      setErrorMessage(error.message);
      setStep("upload");
    }
  };

  const handlePayment = () => {
    const isPaid = window.confirm("Redirecting to Mobile Money checkout for 10,000 UGX. Click OK to simulate successful payment.");
    if (!isPaid) return;
    
    setShowPreview(false); // Close preview if open
    setStep("success");
  };

  const finalLink = `etumo.ug/collect/${analysisData?.instrumentId?.substring(0, 4) || "demo"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${finalLink}`);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 3000);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-8 bg-blue-50 overflow-hidden relative">

      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[80px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[80px]" />
      </div>

      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white shadow-2xl p-8 sm:p-12 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl">

        {/* Header */}
        <div className="mb-8">
          <Link href="/workspace" className="text-xs font-bold text-gray-400 hover:text-black mb-4 inline-block uppercase tracking-widest transition-colors">&larr; Back to Workspace</Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Research Instrument <br /> Digitization
          </h1>
          <p className="text-gray-500 mt-3 text-sm sm:text-base leading-relaxed">
            Stop printing paper questionnaires. Upload your approved document, and the Etumo Engine will convert it into a digital collection link.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-red-700 text-sm font-bold shadow-sm rounded-r-lg">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* STEP 1 & 2: UPLOAD & ANALYZE */}
        {(step === "upload" || step === "analyzing") && (
          <div className="space-y-6">
            <div className={`border-2 border-dashed ${selectedFile ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'} p-10 text-center transition-all duration-300 relative group rounded-xl`}>
              <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={step === "analyzing"}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2 text-orange-700">
                  {step === "analyzing" ? (
                    <div className="w-8 h-8 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin mb-2" />
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  <span className="font-bold text-sm tracking-wider">{selectedFile.name}</span>
                  {step === "analyzing" && <span className="text-xs font-bold animate-pulse">Extracting Variables...</span>}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-black transition-colors">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <span className="font-bold text-sm uppercase tracking-widest">Select Instrument (.pdf)</span>
                  <span className="text-xs">Click or drag and drop (Save Word Docs as PDF first)</span>
                </div>
              )}
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!selectedFile || step === "analyzing"}
              className="w-full bg-black text-white font-bold py-4 rounded-xl uppercase text-sm tracking-widest hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {step === "analyzing" ? "Processing via Etumo Engine..." : "Analyze Document"}
            </button>
          </div>
        )}

        {/* STEP 3: CHECKOUT UPSALE */}
        {step === "checkout" && analysisData && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-200 text-green-700 rounded-full flex items-center justify-center font-bold">✓</div>
                <h3 className="font-bold text-green-900 uppercase tracking-widest text-sm">Instrument Mapped</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
                  <span className="block text-3xl font-black text-gray-900 mb-1">{analysisData.questionCount}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Questions Found</span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
                  <span className="block text-3xl font-black text-gray-900 mb-1">{analysisData.sectionCount}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Data Sections</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Deployment Package Includes:</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700 font-medium"><span className="text-blue-600">✓</span> Instant Mobile Collection Link</li>
                <li className="flex items-center gap-2 text-sm text-gray-700 font-medium"><span className="text-blue-600">✓</span> Live Link Analytics & Tracking</li>
                <li className="flex items-center gap-2 text-sm text-gray-700 font-medium"><span className="text-blue-600">✓</span> Automated AI Summary of Responses</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowPreview(true)}
                className="flex-1 bg-white text-gray-900 border-2 border-black font-extrabold py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-gray-50 transition-all shadow-sm"
              >
                Preview Document
              </button>
              <button 
                onClick={handlePayment}
                className="flex-1 bg-[#d97706] text-white font-extrabold py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-[#b45309] transition-all shadow-lg hover:-translate-y-1"
              >
                Deploy Link (10,000 UGX)
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS & LINK GENERATION */}
        {step === "success" && (
          <div className="space-y-6 animate-in zoom-in-95 fade-in duration-500 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">System Online</h2>
            <p className="text-gray-500 text-sm mb-8">Your digital instrument is live and ready to collect responses.</p>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between gap-4">
              <span className="text-sm font-mono font-bold text-gray-800 truncate px-2">
                {finalLink}
              </span>
              <button 
                onClick={handleCopyLink}
                className="bg-black text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shrink-0"
              >
                {copyFeedback ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <Link href="/workspace" className="block mt-6 text-sm font-bold text-[#d97706] hover:text-[#b45309] uppercase tracking-widest transition-colors">
              Return to Workspace
            </Link>
          </div>
        )}

      </div>

      {/* 🚨 EDGE-TO-EDGE PREVIEW MODAL */}
      {showPreview && analysisData && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 shrink-0 shadow-sm z-10">
            <button 
              onClick={handlePayment}
              className="bg-[#d97706] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors shadow-sm"
            >
              Deploy Link (10,000 UGX)
            </button>
            <button 
              onClick={() => setShowPreview(false)}
              className="text-xs font-bold text-gray-500 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-2 px-2 py-2"
            >
              Close Preview ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-100">
            <div className="max-w-4xl mx-auto w-full min-h-full flex flex-col shadow-2xl my-8">
              <div className="flex-1 p-0">
                <LockedDocumentViewer content={analysisData.previewText} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
