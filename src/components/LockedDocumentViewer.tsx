"use client";

import React, { useEffect } from "react";

interface LockedDocumentViewerProps {
  content: string;
}

export default function LockedDocumentViewer({ content }: LockedDocumentViewerProps) {
  useEffect(() => {
    // 🚨 MAXIMUM SECURITY: JavaScript-level protection
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+P (Print), Ctrl+C (Copy), Ctrl+A (Select All), Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && ["p", "c", "a", "s"].includes(e.key.toLowerCase())) {
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

  // Format internal text (headings, bolding, paragraphs)
  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <br key={idx} />;

      // Safety catch: completely hide any stray markdown dividers that sneak through
      if (trimmedLine === "---" || trimmedLine === "***") return null;

      // Handle H1 / Chapter Titles (Auto-centered)
      if (trimmedLine.startsWith("# ")) {
        return <h1 key={idx} className="text-xl md:text-2xl font-black mt-0 mb-6 md:mb-8 text-center uppercase tracking-widest">{trimmedLine.replace(/^#\s*/, "")}</h1>;
      }
      // Handle H2 (Auto-centered for cover pages)
      if (trimmedLine.startsWith("## ")) {
        return <h2 key={idx} className="text-lg md:text-xl font-bold mt-6 md:mt-8 mb-3 md:mb-4 text-center">{trimmedLine.replace(/^##\s*/, "")}</h2>;
      }
      // Handle H3
      if (trimmedLine.startsWith("### ")) {
        return <h3 key={idx} className="text-base md:text-lg font-bold mt-4 md:mt-6 mb-2 md:mb-3">{trimmedLine.replace(/^###\s*/, "")}</h3>;
      }

      // Handle Bolding within paragraphs
      if (trimmedLine.includes("**")) {
        const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx} className="mb-4 text-sm md:text-[16px] leading-[2] text-justify">
            {parts.map((part, i) => 
              part.startsWith("**") && part.endsWith("**") 
                ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong> 
                : part
            )}
          </p>
        );
      }

      // Center align placeholder brackets (e.g., [INSERT LOGO HERE]) for cover page aesthetics
      if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
        return <p key={idx} className="mb-4 text-sm md:text-[16px] leading-[2] text-center font-bold text-gray-500">{line}</p>;
      }

      // Standard Paragraph
      return <p key={idx} className="mb-4 text-sm md:text-[16px] leading-[2] text-justify">{line}</p>;
    });
  };

  if (!content) {
    return <div className="p-10 text-center text-gray-500 font-mono">Select a chapter to load the preview...</div>;
  }

  let cleanContent = content;

  // 🚨 1. HTML SANITIZER: Strip & Convert rogue HTML injected by AI
  cleanContent = cleanContent
    .replace(/<h1[^>]*>/gi, '\n# ')
    .replace(/<\/h1>/gi, '\n')
    .replace(/<h2[^>]*>/gi, '\n## ')
    .replace(/<\/h2>/gi, '\n')
    .replace(/<h3[^>]*>/gi, '\n### ')
    .replace(/<\/h3>/gi, '\n')
    .replace(/<(b|strong)[^>]*>/gi, '**')
    .replace(/<\/(b|strong)>/gi, '**')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '\n');

  // Catch-all: Strip any remaining HTML tags (like <span align="center">)
  cleanContent = cleanContent.replace(/<[^>]+>/g, '');

  // 🚨 2. CLEANUP FILTER: Strip out meta-headings
  cleanContent = cleanContent
    .replace(/^(#\s*)?PRELIMINARY PAGES$/gim, '')
    .replace(/^(#\s*)?APPENDICES$/gim, '');

  // 🚨 3. ENHANCED AUTO-PAGINATION ENGINE
  // First, handle explicit generic page break markers
  cleanContent = cleanContent
    .replace(/\[PAGE BREAK\]/gi, '___PAGE_BREAK___') 
    .replace(/\n\s*---\s*\n/g, '\n___PAGE_BREAK___\n');

  // Force page breaks explicitly before standard CHAPTER headings
  cleanContent = cleanContent.replace(/^(#{1,3}\s*)(CHAPTER\s+[A-Z0-9]+.*)$/gim, '___PAGE_BREAK___\n# $2');

  // Force page breaks specifically before Preliminary Page sections
  const prelimSections = [
    "DECLARATION", "APPROVAL", "DEDICATION", "ACKNOWLEDGEMENT", "ACKNOWLEDGEMENTS",
    "ABSTRACT", "TABLE OF CONTENTS", "LIST OF TABLES", "LIST OF FIGURES", 
    "LIST OF ACRONYMS", "LIST OF ABBREVIATIONS"
  ];
  // Regex looks for these exact words at the start of a line (with or without # tags)
  const prelimRegex = new RegExp(`^\\s*(#{1,3}\\s*)?(${prelimSections.join('|')})\\s*$`, 'gim');
  cleanContent = cleanContent.replace(prelimRegex, '___PAGE_BREAK___\n# $2');

  // Clean up any double page breaks and excessive newlines
  cleanContent = cleanContent.replace(/(___PAGE_BREAK___\s*)+/g, '___PAGE_BREAK___\n');
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');

  // Remove page break if it accidentally landed at the very beginning of the document
  cleanContent = cleanContent.replace(/^___PAGE_BREAK___\s*/, '');

  // Split into final array
  const pages = cleanContent
    .split('___PAGE_BREAK___')
    .map(page => page.trim())
    .filter(page => page.length > 0); 

  return (
    <div className="bg-gray-200 py-6 md:py-10 px-2 md:px-10 overflow-y-auto locked-document-viewer select-none flex flex-col gap-6 md:gap-8 items-center min-h-[80vh]">

      {pages.map((pageContent, index) => {
        return (
          // 🚨 RESPONSIVE A4 PAGE CONTAINER
          <div 
            key={index} 
            className="relative bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] px-6 py-10 md:px-[25.4mm] md:py-[25.4mm] pointer-events-none"
          >
            {/* Embedded Security Watermark */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.05] flex items-center justify-center text-center z-0 overflow-hidden"
              style={{ 
                backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\'><text x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'36\' font-weight=\'900\' fill=\'%23d97706\' text-anchor=\'middle\' transform=\'rotate(-45 200 200)\'>ETUMO.com</text></svg>")',
                backgroundRepeat: 'repeat'
              }}
            ></div>

            {/* The Actual Page Content */}
            <div className="relative z-10 font-serif text-gray-900">
              {formatText(pageContent)}
            </div>

            {/* Page Number */}
            <div className="absolute bottom-[10mm] md:bottom-[15mm] left-0 w-full text-center text-xs md:text-sm text-gray-500 font-serif">
              {index + 1}
            </div>
          </div>
        );
      })}

      {/* Print security lock */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden !important; }
          .locked-document-viewer::after {
            content: "UNAUTHORIZED PRINT ATTEMPT - Please pay to export this document officially on Etomu.com";
            visibility: visible !important;
            display: block;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 20px;
            font-weight: bold;
            color: black;
            text-align: center;
          }
        }
      `}} />
    </div>
  );
}
