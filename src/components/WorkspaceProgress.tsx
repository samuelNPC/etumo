"use client";

import { useState } from "react";
import Link from "next/link";

interface ChapterStructure {
  key: string;
  label: string;
}

interface WorkspaceProgressProps {
  structure: ChapterStructure[];
  activeChapter: string;
  setActiveChapter: (key: string) => void;
  guidelinesUploaded: boolean;
  progress: number;
  generatedChapters: string[];
}

export default function WorkspaceProgress({
  structure,
  activeChapter,
  setActiveChapter,
  guidelinesUploaded,
  progress,
  generatedChapters,
}: WorkspaceProgressProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (key: string, isLocked: boolean) => {
    if (isLocked) return;
    setActiveChapter(key);
    setIsOpen(false); 
  };

  const firstUngeneratedIndex = structure.findIndex(c => !generatedChapters.includes(c.key));

  return (
    // 🚨 FIX: Removed "relative" so "sticky" can actually do its job!
    <aside className="w-full md:w-64 flex-shrink-0 flex flex-col sticky top-0 md:top-4 z-40 self-start">

      {/* MOBILE: Edge-to-Edge Sticky Toggle */}
      <div className="md:hidden shadow-lg w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 font-bold uppercase text-xs tracking-widest bg-black text-white transition-colors border-b border-gray-800"
        >
          <span>{isOpen ? "Close Progress Status" : "Show Progress Status"}</span>
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* OVERLAY MENU */}
      <div className={`
        ${isOpen ? "absolute top-full left-0 w-full z-50 bg-white shadow-2xl border-b border-gray-300 block animate-in slide-in-from-top-2" : "hidden"} 
        md:flex md:static md:w-full md:bg-gray-50 md:shadow-none md:border md:border-gray-300 md:animate-none
        flex-col p-4 h-fit max-h-[80vh] overflow-y-auto
      `}>

        <div className="mb-6">
          <h2 className="font-bold text-lg tracking-tight">Etumo Engine</h2>
          <div className="mt-2 w-full bg-gray-200 h-2">
            <div className="bg-[#d97706] h-2 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xs text-gray-500 font-medium">Research Completion: {progress}%</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Structure</span>

          {structure.map((chapter, index) => {
            const isGenerated = generatedChapters.includes(chapter.key);
            const isActive = activeChapter === chapter.key;
            const isFree = chapter.key === "guidelines" || chapter.key === "preliminaryPages";
            
            let isLocked = false;
            if (!guidelinesUploaded && chapter.key !== "guidelines") {
              isLocked = true;
            } else if (!isGenerated && index > firstUngeneratedIndex) {
              isLocked = true;
            }

            return (
              <button
                key={chapter.key}
                onClick={() => handleSelect(chapter.key, isLocked)}
                disabled={isLocked}
                className={`text-left p-3 border text-sm flex items-center justify-between group transition-all ${
                  isActive 
                    ? "bg-black border-black font-bold text-white shadow-sm" 
                    : isLocked 
                      ? "border-transparent text-gray-400 cursor-not-allowed opacity-60 bg-gray-100/50" 
                      : "border-transparent hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="truncate pr-2">{chapter.label}</span>

                {isGenerated && chapter.key !== "guidelines" ? (
                  <span className={`text-[10px] px-1.5 py-0.5 font-bold tracking-wider rounded-sm shrink-0 ${isActive ? 'bg-gray-800 text-gray-200' : 'bg-green-100 text-green-700'}`}>DONE ✓</span>
                ) : isLocked ? (
                  <span className="text-xs opacity-60 shrink-0">🔒</span>
                ) : isFree ? (
                  <span className={`text-[10px] px-1.5 py-0.5 font-bold tracking-wider rounded-sm shrink-0 ${isActive ? 'bg-gray-800 text-gray-200' : 'bg-blue-100 text-blue-700'}`}>FREE</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-300 pt-4 flex flex-col gap-2 mt-4">
          <Link href="/originality" className="w-full border border-gray-400 p-3 text-xs font-bold text-center hover:bg-gray-100 transition-colors uppercase tracking-widest text-gray-700">
            Originality Center
          </Link>
          <Link href="/data-collector" className="w-full border border-orange-200 p-3 text-xs font-bold text-center hover:bg-orange-100 transition-colors uppercase tracking-widest text-[#d97706] bg-orange-50">
            Data Collector &rarr;
          </Link>
        </div>
      </div>
    </aside>
  );
}
