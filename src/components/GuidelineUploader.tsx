"use client";

import React, { useState } from "react";

interface GuidelineUploaderProps {
  projectId: string;
  onComplete: () => void;
}

export default function GuidelineUploader({ projectId, onComplete }: GuidelineUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // Added success state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccess(false);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      const res = await fetch("/api/guidelines", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        // Wait 1.5 seconds so the user sees the success message, then transition
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setErrorMsg(data.error || "Failed to process the document.");
      }
    } catch (error) {
      setErrorMsg("Network error processing document. Please check your connection.");
    } finally {
      if (!data?.success) setLoading(false); // Only stop loading if it failed
    }
  };

  return (
    <div className="border border-gray-200 bg-white p-6 sm:p-8 rounded-xl shadow-sm mb-6">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Configure Institutional Guidelines</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload your university's research manual. The AI will adapt the workspace to match your faculty's exact rules.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-red-700 text-sm font-bold rounded-r-lg animate-in fade-in">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleUpload} className="flex flex-col gap-5">
        
        <div className={`border-2 border-dashed p-8 text-center rounded-xl transition-all cursor-pointer relative ${
          file ? "border-black bg-gray-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
        }`}>
          <input 
            type="file" 
            accept=".pdf, .txt, image/png, image/jpeg, image/jpg"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setErrorMsg(null);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required
            disabled={loading || success}
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <svg className={`w-8 h-8 ${file ? "text-black" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <span className={`font-bold ${file ? "text-black" : "text-gray-600"}`}>
              {file ? file.name : "Drag & Drop Document Here"}
            </span>
            {!file && <span className="text-xs text-gray-400 font-medium">Supports PDF, TXT, and Images</span>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !file || success}
          className={`font-bold py-4 rounded-xl uppercase tracking-widest text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
            success 
              ? "bg-[#34A853] text-white" 
              : "bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
          }`}
        >
          {success ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Configured Successfully!
            </>
          ) : loading ? (
             <>
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
               Extracting Rules...
             </>
          ) : (
            "Apply Faculty Structure"
          )}
        </button>
      </form>
    </div>
  );
}
