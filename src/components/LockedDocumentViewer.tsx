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

    // Cleanup event listeners when the component unmounts
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative border border-gray-300 p-8 min-h-[600px] bg-white locked-document-viewer overflow-hidden">

      {/* Embedded Security Watermark */}
      <div 
        // Increased opacity slightly because yellow on white is much harder to see than black
        className="absolute inset-0 pointer-events-none opacity-[0.25] flex items-center justify-center text-center z-0"
        style={{ 
          // Replaced text with ETUMO.com, changed font size/weight, and set fill to a bright yellow (%23facc15)
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'350\' height=\'350\'><text x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'32\' font-weight=\'900\' fill=\'%23facc15\' text-anchor=\'middle\' transform=\'rotate(-45 175 175)\'>ETUMO.com</text></svg>")',
          backgroundRepeat: 'repeat'
        }}
      ></div>

      {/* The Actual Document Content */}
      <div className="relative z-10 whitespace-pre-wrap font-serif text-gray-800 text-lg leading-relaxed">
        {content || "Select a chapter from the left panel to load the document..."}
      </div>

    </div>
  );
}
