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

  // Format internal text (headings, bolding, paragraphs, and tables)
  const formatText = (text: string) => {
    // Aggressively collapse 3+ empty lines down to just 2 to fix massive spacing
    const normalizedText = text.replace(/\n{3,}/g, '\n\n');

    return normalizedText.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return <div key={idx} className="h-4"></div>;

      // 🚨 SMART TABLE & TOC RENDERER
      if (trimmedLine.includes("|") && trimmedLine.length > 3) {
        // Clean the markdown table syntax
        const cleanRow = trimmedLine.replace(/^\|/, '').replace(/\|$/, '');
        const cols = cleanRow.split('|').map(c => c.trim());

        // Ignore structural markdown divider lines (e.g., |---|---| or | :--- |)
        if (cols.every(c => /^[:\- ]+$/.test(c) || c === '')) return null;

        // Is this a Table of Contents / List of Tables row? 
        // Heuristic: Last column is a short number or roman numeral
        if (cols.length >= 2) {
          const lastCol = cols[cols.length - 1];
          const isPageNumber = /^[0-9ivxlc]+$/i.test(lastCol.replace(/[^0-9a-zA-Z]/g, ''));
          
          if (isPageNumber && lastCol.length <= 6) {
            const leftText = cols.slice(0, -1).join(' ').replace(/\*\*/g, '');
            const isMainChapter = leftText.toUpperCase().includes("CHAPTER");
            
            // Render with the perfect dotted leader lines!
            return (
              <div key={idx} className={`flex items-end mb-2 text-sm md:text-[16px] leading-[2] ${isMainChapter ? 'mt-4 font-bold' : ''}`}>
                <span>{leftText}</span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 mx-2 mb-1.5 opacity-60"></div>
                <span>{lastCol}</span>
              </div>
            );
          }
        }

        // If it's a real data table (e.g., in Chapter 4 Data Presentation)
        return (
          <div key={idx} className="flex w-full border-b border-gray-300 bg-white first:border-t first:bg-gray-100 first:font-bold">
            {cols.map((col, i) => (
              <div key={i} className="flex-1 p-2 text-sm border-r border-gray-300 last:border-r-0 flex items-center text-gray-800">
                {col.replace(/\*\*/g, '')}
              </div>
            ))}
          </div>
        );
      }

      // Handle H1 / Chapter Titles (Auto-centered)
      if (trimmedLine.startsWith("# ")) {
        return <h1 key={idx} className="text-xl md:text-2xl font-black mt-0 mb-6 md:mb-8 text-center uppercase tracking-widest">{trimmedLine.replace(/^#\s*/, "")}</h1>;
      }
      // Handle H2
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
          <p key={idx} className="mb-2 text-sm md:text-[16px] leading-[2] text-justify">
            {parts.map((part, i) => 
              part.startsWith("**") && part.endsWith("**") 
                ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong> 
                : part
            )}
          </p>
        );
      }

      // Center align placeholder brackets (e.g., [INSERT LOGO HERE])
      if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
        return <p key={idx} className="mb-2 text-sm md:text-[16px] leading-[2] text-center font-bold text-gray-500">{line}</p>;
      }

      // Standard Paragraph
      return <p key={idx} className="mb-2 text-sm md:text-[16px] leading-[2] text-justify">{line}</p>;
    });
  };

  if (!content) {
    return <div className="p-10 text-center text-gray-500 font-mono">Select a chapter to load the preview...</div>;
  }

  // 🚨 1. AGGRESSIVE SANITIZER: Nuke all HTML
  let cleanContent = content
    .replace(/&nbsp;/gi, ' ') 
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n# ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<(b|strong)[^>]*>/gi, '**')
    .replace(/<\/(b|strong)>/gi, '**')
    .replace(/<[^>]+>/g, ''); 

  // 🚨 2. BULLETPROOF PAGE PARSER
  const lines = cleanContent.split('\n');
  const pages: string[] = [];
  let currentPage: string[] = [];

  const pageBreakTriggers = [
    "DECLARATION", "APPROVAL", "DEDICATION", "ACKNOWLEDGEMENT", "ACKNOWLEDGEMENTS",
    "ABSTRACT", "TABLE OF CONTENTS", "LIST OF TABLES", "LIST OF FIGURES", 
    "LIST OF ACRONYMS", "LIST OF ABBREVIATIONS", "PAGE BREAK"
  ];

  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const trimmedLine = originalLine.trim();
    
    // Create a perfectly clean string for matching
    const cleanLineToMatch = originalLine.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();

    // Kill duplicate title injections entirely
    if (cleanLineToMatch === "PRELIMINARY PAGES" || cleanLineToMatch === "APPENDICES") {
      continue;
    }

    // 🚨 FIX: Ensure the trigger is NOT inside a markdown table row (checks for | )
    const isInsideTable = trimmedLine.includes("|");
    const isChapterHeading = cleanLineToMatch.startsWith("CHAPTER ") && cleanLineToMatch.length < 60 && !isInsideTable;
    const isTrigger = pageBreakTriggers.includes(cleanLineToMatch) && !isInsideTable;

    if (isTrigger || isChapterHeading) {
      if (currentPage.join('').trim().length > 0) {
        pages.push(currentPage.join('\n'));
      }
      
      currentPage = [];

      if (cleanLineToMatch !== "PAGE BREAK") {
        currentPage.push(`# ${originalLine.replace(/[*#|]/g, '').trim()}`);
      }
    } else {
      // Ignore Markdown table structure lines during parsing to prevent empty gaps
      if (trimmedLine.match(/^\|?[:\-\s]+\|[:\-\s|]*$/)) continue;

      if (currentPage.length === 0 && originalLine.trim() === '') {
        continue;
      }
      currentPage.push(originalLine);
    }
  }

  if (currentPage.join('').trim().length > 0) {
    pages.push(currentPage.join('\n'));
  }

  return (
    <div className="bg-gray-200 py-6 md:py-10 px-2 md:px-10 overflow-y-auto locked-document-viewer select-none flex flex-col gap-6 md:gap-8 items-center min-h-[80vh]">

      {pages.map((pageContent, index) => {
        return (
          // RESPONSIVE A4 PAGE CONTAINER
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
            <div className="relative z-10 font-serif text-gray-900 w-full">
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
