"use client";

import React, { useEffect } from "react";

interface LockedDocumentViewerProps {
  content: string;
}

export default function LockedDocumentViewer({ content }: LockedDocumentViewerProps) {
  useEffect(() => {
    // JavaScript-level protection to block right-clicks and keyboard shortcuts
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+P (Print), Ctrl+C (Copy), and Ctrl+A (Select All)
      if ((e.ctrlKey || e.metaKey) && ["p", "c", "a"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Basic markdown parser for the preview (handles headings and page breaks for Full Doc view)
  const formatContent = (text: string) => {
    if (!text) return "Select a chapter from the left panel to load the document...";
    
    return text.split('\n').map((line, idx) => {
      if (line.trim() === "[PAGE BREAK]") {
        return <div key={idx} className="my-12 border-b-2 border-dashed border-gray-300 w-full relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-4 text-xs font-bold uppercase tracking-widest text-gray-400">Page Break</span>
        </div>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-xl font-bold mt-8 mb-4 uppercase tracking-wider">{line.replace("### ", "")}</h3>;
      }
      return <p key={idx} className="mb-4">{line}</p>;
    });
  };

  return (
    <div className="relative border-x border-b border-gray-300 p-10 sm:p-16 min-h-[800px] bg-white locked-document-viewer overflow-hidden shadow-sm">

      {/* Embedded Security Watermark */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15] flex items-center justify-center text-center z-0"
        style={{ 
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\'><text x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'36\' font-weight=\'900\' fill=\'%23d97706\' text-anchor=\'middle\' transform=\'rotate(-45 200 200)\'>ETUMO.com</text></svg>")',
          backgroundRepeat: 'repeat'
        }}
      ></div>

      {/* The Actual Document Content */}
      <div className="relative z-10 font-serif text-gray-800 text-[17px] leading-[2] text-justify max-w-3xl mx-auto">
        {formatContent(content)}
      </div>

    </div>
  );
}
