"use client";

import { useState } from "react";

interface ChapterStructure {
  key: string;
  label: string;
}

interface WorkspaceProgressProps {
  structure: ChapterStructure[];
  activeChapter: string;
  setActiveChapter: (key: string) => void;
  guidelinesUploaded: boolean;
}

export default function WorkspaceProgress({
  structure,
  activeChapter,
  setActiveChapter,
  guidelinesUploaded,
}: WorkspaceProgressProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (key: string, isLocked: boolean) => {
    if (isLocked) return;
    setActiveChapter(key);
    setIsOpen(false); // Auto-close drawer on mobile when an unlocked stage is tapped
  };

  return (
    <div className="w-full md:w-64 flex-shrink-0">
      {/* MOBILE: Secondary Hamburger Toggle */}
      <div className="md:hidden border border-gray-300 bg-black text-white mb-4 transition-colors">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 font-bold uppercase text-xs tracking-widest"
        >
          <span>{isOpen ? "Close Progress Status" : "Show Progress Status"}</span>
          {isOpen ? (
            // Lucide ChevronLeft
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          ) : (
            // Lucide ChevronRight
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          )}
        </button>
      </div>

      {/* THE LIST: Sliding Drawer (Mobile) / Static Sidebar (Desktop) */}
      <div className={`
        ${isOpen ? "block animate-in slide-in-from-top-2 fade-in duration-200 mb-6" : "hidden"} 
        md:block border border-gray-300 bg-white shadow-sm
      `}>
        <div className="p-4 border-b border-gray-200 bg-gray-50 hidden md:block">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Project Nodes</h3>
        </div>
        
        <ul className="flex flex-col">
          {structure.map((chapter) => {
            // Strict Lock Logic: If it's not the 'guidelines' tab, and guidelines aren't uploaded, lock it.
            const isLocked = !guidelinesUploaded && chapter.key !== "guidelines";
            const isActive = activeChapter === chapter.key;

            return (
              <li key={chapter.key} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => handleSelect(chapter.key, isLocked)}
                  disabled={isLocked}
                  className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                    isActive 
                      ? "bg-orange-50 border-l-4 border-[#d97706] text-orange-900 font-bold" 
                      : isLocked 
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-70" 
                        : "hover:bg-gray-50 text-gray-700 font-medium hover:text-black border-l-4 border-transparent"
                  }`}
                >
                  <span className="text-sm tracking-wide">{chapter.label}</span>
                  
                  {isLocked && (
                    // Lucide Lock Icon
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
