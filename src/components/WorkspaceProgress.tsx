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

  const toggleDrawer = (nextState: boolean) => {
    setIsOpen(nextState);
    window.dispatchEvent(
      new CustomEvent("etomu-workspace-drawer", { detail: { isOpen: nextState } })
    );
  };

  const handleSelect = (key: string, isLocked: boolean) => {
    if (isLocked) return;
    setActiveChapter(key);
    toggleDrawer(false); 
  };

  const firstUngeneratedIndex = structure.findIndex(c => !generatedChapters.includes(c.key));

  return (
    <aside className="w-full md:w-64 flex-shrink-0 flex flex-col sticky top-0 md:top-4 z-40 self-start">

      <div className="md:hidden w-full h-14">
        <div className={`w-full h-14 bg-black border-b border-gray-800 transition-none ${
          isOpen ? "fixed top-0 left-0 right-0 z-[60]" : "relative z-50"
        }`}>
          <button
            onClick={() => toggleDrawer(!isOpen)}
            className="w-full h-full flex items-center justify-between px-4 font-bold uppercase text-xs tracking-widest text-white transition-colors"
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
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      <div 
        className={`md:hidden fixed inset-0 top-14 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => toggleDrawer(false)}
      />

      {/* 🚨 DRAWER MENU: Now slides from the RIGHT (translate-x-full) to the left! */}
      <div className={`
        md:hidden fixed inset-y-0 right-0 top-14 w-[85%] max-w-sm z-50 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        md:flex md:static md:w-full md:max-w-none md:transform-none md:transition-none md:bg-gray-50 md:shadow-none md:border md:border-gray-300 md:h-fit md:max-h-[80vh]
      `}>
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-4">
          
          <div className="mb-6 shrink-0">
            <h2 className="font-bold text-lg tracking-tight">Etumo Engine</h2>
            <div className="mt-2 w-full bg-gray-200 h-2">
              <div className="bg-[#d97706] h-2 transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs text-gray-500 font-medium">Research Completion: {progress}%</span>
          </div>

          <nav className="flex-1 flex flex-col gap-1 shrink-0">
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
                  // 🚨 CHANGED: Active state is now a sleek Gray instead of Black
                  className={`text-left p-3 border text-sm flex items-center justify-between group transition-all ${
                    isActive 
                      ? "bg-gray-200 border-gray-400 font-bold text-gray-900 shadow-sm" 
                      : isLocked 
                        ? "border-transparent text-gray-400 cursor-not-allowed opacity-60 bg-gray-50/50" 
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="truncate pr-2">{chapter.label}</span>

                  {isGenerated && chapter.key !== "guidelines" ? (
                    <span className={`text-[10px] px-1.5 py-0.5 font-bold tracking-wider rounded-sm shrink-0 ${isActive ? 'bg-white border border-green-200 text-green-700' : 'bg-green-100 text-green-700'}`}>DONE ✓</span>
                  ) : isLocked ? (
                    <span className="text-xs opacity-60 shrink-0">🔒</span>
                  ) : isFree ? (
                    <span className={`text-[10px] px-1.5 py-0.5 font-bold tracking-wider rounded-sm shrink-0 ${isActive ? 'bg-white border border-blue-200 text-blue-700' : 'bg-blue-100 text-blue-700'}`}>FREE</span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-gray-300 pt-4 flex flex-col gap-2 mt-4 shrink-0">
            <Link href="/originality" className="w-full border border-gray-400 p-3 text-xs font-bold text-center hover:bg-gray-100 transition-colors uppercase tracking-widest text-gray-700">
              Originality Center
            </Link>
            <Link href="/data-collector" className="w-full border border-orange-200 p-3 text-xs font-bold text-center hover:bg-orange-100 transition-colors uppercase tracking-widest text-[#d97706] bg-orange-50">
              Data Collector &rarr;
            </Link>
          </div>
          
        </div>
      </div>
    </aside>
  );
}
