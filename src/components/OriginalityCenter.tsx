"use client";

import React, { useState } from "react";

interface ExtractedData {
  plagiarism_flagged: string[];
  ai_flagged: string[];
}

export default function OriginalityCenter() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<ExtractedData | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData, // Sending as multipart/form-data
      });

      const json = await res.json();
      if (json.success) {
        setResults(json.data);
      } else {
        alert(json.error);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("A network error occurred while parsing the document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-300 bg-white p-8">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Originality Center</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload your Turnitin or AI detection report. We will automatically target and isolate the flagged sections for refinement.
        </p>
      </div>

      <form onSubmit={handleUpload} className="flex flex-col gap-4 mb-8">
        <div className="border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
          <input 
            type="file" 
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required
          />
          <span className="font-bold text-gray-700">
            {file ? file.name : "Drag & Drop your PDF Report Here"}
          </span>
        </div>
        
        <button
          type="submit"
          disabled={loading || !file}
          className="bg-black text-white font-bold py-3 uppercase tracking-wider text-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Scanning Document Highlights..." : "Extract Target Sections"}
        </button>
      </form>

      {/* Results Display Panel */}
      {results && (
        <div className="flex flex-col gap-6">
          <div className="border border-orange-300 bg-orange-50 p-4">
            <h3 className="font-bold text-orange-800 mb-2 uppercase text-xs tracking-wider">Similarity Flags (Plagiarism)</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-orange-900">
              {results.plagiarism_flagged.length > 0 
                ? results.plagiarism_flagged.map((text, i) => <li key={i}>{text}</li>)
                : <li>No similarity highlights detected.</li>}
            </ul>
          </div>

          <div className="border border-blue-300 bg-blue-50 p-4">
            <h3 className="font-bold text-blue-800 mb-2 uppercase text-xs tracking-wider">AI Written Flags</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
              {results.ai_flagged.length > 0 
                ? results.ai_flagged.map((text, i) => <li key={i}>{text}</li>)
                : <li>No AI highlights detected.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
