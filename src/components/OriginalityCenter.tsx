"use client";

// This is the missing import that crashed your Vercel build
import { useState } from "react";

export default function OriginalityCenter() {
  const [cleaningState, setCleaningState] = useState<string | null>(null);
  const [cleanedResults, setCleanedResults] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");

  // This simulates the mobile money paywall trigger
  const handleCleanText = async (type: "ai_bypass" | "plagiarism_bypass", textsToClean: string[]) => {
    // 1. Trigger Payment Modal First
    const confirmed = window.confirm("Unlock Remediation Engine for UGX 25,000 via Mobile Money. Proceed?");
    if (!confirmed) return;

    // 2. If payment succeeds, run the engine
    setCleaningState(type);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flaggedTexts: textsToClean, type }),
      });

      const json = await res.json();
      if (json.success) {
        setCleanedResults(json.cleanedData);
      }
    } catch (error) {
      alert("Error running the remediation engine.");
    } finally {
      setCleaningState(null);
    }
  };

  return (
    <div className="border border-gray-300 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-4">Text Remediation Engine</h2>
      <p className="text-sm text-gray-500 mb-6">
        Paste flagged paragraphs from Turnitin or AI detectors below. Our engine will restructure them to pass originality checks while maintaining academic integrity.
      </p>

      <textarea
        className="w-full border border-gray-300 p-4 bg-gray-50 outline-none text-sm rounded-none focus:border-black resize-y min-h-[150px] mb-4"
        placeholder="Paste your flagged text here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={() => handleCleanText("plagiarism_bypass", [inputText])}
          disabled={cleaningState !== null || !inputText.trim()}
          className="flex-1 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-none"
        >
          {cleaningState === "plagiarism_bypass" ? "Processing..." : "Fix Similarity"}
        </button>
        <button
          onClick={() => handleCleanText("ai_bypass", [inputText])}
          disabled={cleaningState !== null || !inputText.trim()}
          className="flex-1 bg-[#d97706] text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] disabled:bg-gray-400 transition-colors rounded-none"
        >
          {cleaningState === "ai_bypass" ? "Processing..." : "Humanize (AI Bypass)"}
        </button>
      </div>

      {/* Render the Cleaned Output */}
      {cleanedResults.length > 0 && (
        <div className="border-t border-gray-300 pt-6 animate-in fade-in duration-300">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800 mb-4">Remediation Results</h3>
          <div className="flex flex-col gap-4">
            {cleanedResults.map((result, idx) => (
              <div key={idx} className="bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-900">{result.cleanText || result}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
