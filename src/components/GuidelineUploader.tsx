"use client";

import React, { useState } from "react";

interface GuidelineUploaderProps {
  projectId: string;
  onComplete: () => void; // Triggered to refresh the workspace after successful upload
}

export default function GuidelineUploader({ projectId, onComplete }: GuidelineUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
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
        onComplete();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("Network error processing document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-300 bg-white p-8 mb-6">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Configure Institutional Guidelines</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload your university's research manual or a screenshot of the required structure. The AI will adapt the workspace to match your faculty's exact rules.
        </p>
      </div>

      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <div className="border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
          <input 
            type="file" 
            accept="application/pdf, image/png, image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required
          />
          <span className="font-bold text-gray-700">
            {file ? file.name : "Drag & Drop PDF or Image Here"}
          </span>
        </div>
        
        <button
          type="submit"
          disabled={loading || !file}
          className="bg-black text-white font-bold py-3 uppercase tracking-wider text-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Extracting Structure & Formatting..." : "Apply Faculty Structure"}
        </button>
      </form>
    </div>
  );
}
