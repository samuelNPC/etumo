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
}

export default function WorkspaceProgress({
  structure,
  activeChapter,
  setActiveChapter,
  guidelinesUploaded,
  progress,
}: WorkspaceProgressProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (key: string, isLocked: boolean) => {
    if (isLocked) return;
    setActiveChapter(key);
    setIsOpen(false); 
  };

  return (
    <aside className="w-full md:w-64 flex-shrink-0 flex flex-col">
      
      {/* MOBILE: Secondary Hamburger Toggle */}
      <div className="md:hidden border border-gray-300 bg-black text-white mb-4 transition-colors">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 font-bold uppercase text-xs tracking-widest"
        >
          <span>{isOpen ? "Close Progress Status" : "Show Progress Status"}</span>
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          )}
        </button>
      </div>

      {/* THE SIDEBAR CONTENT */}
      <div className={`
        ${isOpen ? "block animate-in slide-in-from-top-2 fade-in duration-200 mb-6" : "hidden"} 
        md:flex flex-col bg-gray-50 border border-gray-300 p-4 h-full min-h-[500px]
      `}>
        
        {/* Progress Bar Header (From your layout) */}
        <div className="mb-6">
          <h2 className="font-bold text-lg tracking-tight">Etumo Engine</h2>
          <div className="mt-2 w-full bg-gray-200 h-2">
            <div className="bg-[#d97706] h-2 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xs text-gray-500 font-medium">Research Completion: {progress}%</span>
        </div>

        {/* Dynamic Project Structure */}
        <nav className="flex-1 flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Structure</span>
          
          {structure.map((chapter) => {
            const isLocked = !guidelinesUploaded && chapter.key !== "guidelines";
            const isActive = activeChapter === chapter.key;
            const isFree = chapter.key === "guidelines" || chapter.key === "preliminaryPages";

            return (
              <button
                key={chapter.key}
                onClick={() => handleSelect(chapter.key, isLocked)}
                disabled={isLocked}
                className={`text-left p-2 border text-sm flex items-center justify-between group transition-all ${
                  isActive 
                    ? "bg-white border-gray-300 font-bold text-black shadow-sm" 
                    : isLocked 
                      ? "border-transparent text-gray-400 cursor-not-allowed opacity-70" 
                      : "border-transparent hover:border-gray-300 hover:bg-white text-gray-700"
                }`}
              >
                <span className="truncate">{chapter.label}</span>
                
                {isLocked ? (
                  <span className="text-xs opacity-60">🔒</span>
                ) : isFree ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 font-bold tracking-wider">FREE</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom Action Links (From your layout) */}
        <div className="border-t border-gray-300 pt-4 flex flex-col gap-2 mt-4">
          <Link href="/originality" className="w-full border border-gray-400 p-2 text-xs font-bold text-center hover:bg-white transition-colors uppercase tracking-widest text-gray-700">
            Originality Center
          </Link>
          <button className="w-full border border-gray-400 p-2 text-xs font-bold text-center hover:bg-white transition-colors uppercase tracking-widest text-gray-700 opacity-50 cursor-not-allowed" title="Coming soon">
            Data Collector
          </button>
        </div>
      </div>
    </aside>
  );
}
