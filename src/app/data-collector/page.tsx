"use client";

import { useState } from "react";
import Link from "next/link";

export default function DataCollectorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Flow states: upload -> analyzing -> checkout -> success
  const [step, setStep] = useState<"upload" | "analyzing" | "checkout" | "success">("upload");
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleAnalyze = () => {
    if (!selectedFile) return;
    setStep("analyzing");
    
    // Simulate the AI reading the document and extracting questions
    setTimeout(() => {
      setStep("checkout");
    }, 2500);
  };

  const handlePayment = () => {
    // This is where you will integrate MTN MoMo / Airtel Money
    alert("Redirecting to Mobile Money gateway for 10,000 UGX...");
    
    // Simulate a successful payment redirect
    setTimeout(() => {
      setStep("success");
    }, 1000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://etumo.ug/collect/kbu-89a2f");
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
            Stop printing paper questionnaires. Upload your approved Word document, and the Etumo Engine will convert it into a digital collection link for 10,000 UGX.
          </p>
        </div>

        {/* STEP 1 & 2: UPLOAD & ANALYZE */}
        {(step === "upload" || step === "analyzing") && (
          <div className="space-y-6">
            <div className={`border-2 border-dashed ${selectedFile ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'} p-10 text-center transition-all duration-300 relative group rounded-xl`}>
              <input 
                type="file" 
                accept=".docx,.pdf"
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
                  <span className="font-bold text-sm uppercase tracking-widest">Select Instrument (.docx or .pdf)</span>
                  <span className="text-xs">Click or drag and drop</span>
                </div>
              )}
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!selectedFile || step === "analyzing"}
              className="w-full bg-black text-white font-bold py-4 rounded-xl uppercase text-sm tracking-widest hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {step === "analyzing" ? "Processing..." : "Analyze Document"}
            </button>
          </div>
        )}

        {/* STEP 3: CHECKOUT UPSALE */}
        {step === "checkout" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-200 text-green-700 rounded-full flex items-center justify-center font-bold">✓</div>
                <h3 className="font-bold text-green-900 uppercase tracking-widest text-sm">Instrument Mapped</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
                  <span className="block text-3xl font-black text-gray-900 mb-1">14</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Questions Found</span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
                  <span className="block text-3xl font-black text-gray-900 mb-1">3</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Data Sections</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                Unlock your digital collection link. As respondents submit answers on their phones, the Etumo Engine will automatically generate your Chapter 4 Data Presentation graphs.
              </p>
            </div>

            <button 
              onClick={handlePayment}
              className="w-full bg-[#d97706] text-white font-extrabold py-4 rounded-xl uppercase text-sm tracking-widest hover:bg-[#b45309] transition-all shadow-lg hover:-translate-y-1"
            >
              Generate Link (10,000 UGX)
            </button>
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
                etumo.ug/collect/kbu-89a2f
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

        {/* Info Footer */}
        <div className="mt-8 pt-8 border-t border-gray-100 flex gap-4 items-start">
          <div className="shrink-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">How it works</h4>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">Our AI extracts your questions and provisions a secure database. Instead of printing papers, share the mobile-friendly link on WhatsApp to collect responses instantly.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
