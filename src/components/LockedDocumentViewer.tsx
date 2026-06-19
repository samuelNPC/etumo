"use client";

import React, { useEffect, useMemo } from "react";

interface LockedDocumentViewerProps {
  content: string;
}

// Helper: Convert numbers to Roman Numerals for Preliminary Pages
const toRoman = (num: number): string => {
  const lookup: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let roman = '';
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman.toLowerCase() || "i";
};

export default function LockedDocumentViewer({ content }: LockedDocumentViewerProps) {
  
  useEffect(() => {
    // 🚨 MAXIMUM SECURITY: JavaScript-level protection
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // --- 1. INLINE TEXT FORMATTER ---
  const formatInlineText = (text: string) => {
    if (!text.includes("**")) return text;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
      ) : part
    );
  };

  // --- 2. ENGINE: PARSE, PAGINATE & BUILD TOC ---
  const { pages, toc, chapterOneGlobalIndex } = useMemo(() => {
    if (!content) return { pages: [], toc: [], chapterOneGlobalIndex: -1 };

    // Clean the raw AI output
    let cleanText = content
      .replace(/^(#\s*)?(\*\*)?PRELIMINARY PAGES(\*\*)?\s*$/gim, '')
      .replace(/^(#\s*)?(\*\*)?APPENDICES(\*\*)?\s*$/gim, '')
      .replace(/^\*\*(CHAPTER .*?)\*\*\s*$/gim, '') // Strip duplicate bold headings
      .replace(/\[PAGE BREAK\]/gi, ''); // Remove manual breaks, we auto-calculate now

    // Step A: Split into logical blocks (Paragraphs, Headings, Tables)
    const rawBlocks = cleanText.split(/\n\n+/);
    const parsedBlocks = [];
    
    let isSkippingAiToc = false;

    for (let i = 0; i < rawBlocks.length; i++) {
      let blockText = rawBlocks[i].trim();
      if (!blockText) continue;

      // Ignore markdown dividers
      if (blockText.match(/^[-*]{3,}$/)) continue;

      // If the AI generated a raw markdown table for the TOC, we SKIP IT so we can inject our own
      if (blockText.toUpperCase().includes("TABLE OF CONTENTS")) {
        isSkippingAiToc = true;
        parsedBlocks.push({ type: 'toc-placeholder', text: "TABLE OF CONTENTS" });
        continue;
      }
      if (isSkippingAiToc) {
        // Skip the table that immediately follows the TOC heading
        if (blockText.startsWith("|") || blockText.toLowerCase().includes("abstract")) {
          continue; 
        } else {
          isSkippingAiToc = false; // We passed the bad TOC, resume normal parsing
        }
      }

      if (blockText.startsWith("|")) {
        parsedBlocks.push({ type: 'table', text: blockText });
      } else if (blockText.startsWith("# ")) {
        parsedBlocks.push({ type: 'h1', text: blockText.replace("# ", "") });
      } else if (blockText.startsWith("## ")) {
        parsedBlocks.push({ type: 'h2', text: blockText.replace("## ", "") });
      } else if (blockText.startsWith("### ")) {
        parsedBlocks.push({ type: 'h3', text: blockText.replace("### ", "") });
      } else {
        parsedBlocks.push({ type: 'p', text: blockText });
      }
    }

    // Step B: Auto-Paginate into A4 Sizes based on character count heuristics
    const MAX_CHARS_PER_PAGE = 1700; 
    const finalPages: any[][] = [];
    let currentPage: any[] = [];
    let currentChars = 0;
    const generatedToc: any[] = [];
    let chapOneIndex = -1;

    parsedBlocks.forEach((block) => {
      // Calculate how much physical space this block takes
      let blockCost = block.text.length;
      if (block.type === 'h1') blockCost += 300; // Big headings take lots of space
      if (block.type === 'h2' || block.type === 'h3') blockCost += 150;
      if (block.type === 'table') blockCost = block.text.split('\n').length * 150; 

      const isNewChapter = block.type === 'h1' && block.text.toUpperCase().includes("CHAPTER");

      // Break to a new page IF it's a new chapter, OR if the current page is full
      if ((isNewChapter && currentPage.length > 0) || (currentChars + blockCost > MAX_CHARS_PER_PAGE && currentPage.length > 0)) {
        finalPages.push(currentPage);
        currentPage = [];
        currentChars = 0;
      }

      currentPage.push(block);
      currentChars += blockCost;

      // Map the Heading to the physical page we just placed it on
      if (block.type === 'h1' || block.type === 'h2') {
        const titleClean = block.text.replace(/\*\*/g, '').trim();
        generatedToc.push({
          title: titleClean,
          level: block.type === 'h1' ? 1 : 2,
          globalPageIndex: finalPages.length // Index of the page it lives on
        });

        // Detect where the real numbering should start
        if (titleClean.toUpperCase().includes("CHAPTER ONE") || titleClean.toUpperCase().includes("CHAPTER 1")) {
          chapOneIndex = finalPages.length;
        }
      }
    });

    if (currentPage.length > 0) finalPages.push(currentPage);

    return { pages: finalPages, toc: generatedToc, chapterOneGlobalIndex: chapOneIndex };
  }, [content]);

  // --- 3. DYNAMIC TOC RENDERER ---
  const renderDynamicToC = () => {
    return (
      <div className="w-full mt-6 mb-8 px-4 font-sans">
        {toc.map((item, idx) => {
          // Calculate realistic page number based on physical A4 boundaries
          let displayPageNum = "";
          if (item.globalPageIndex === 0) {
            displayPageNum = ""; // Cover page has no number
          } else if (chapterOneGlobalIndex !== -1 && item.globalPageIndex < chapterOneGlobalIndex) {
            // Preliminary pages use roman numerals
            displayPageNum = toRoman(item.globalPageIndex);
          } else {
            // Body pages use standard numbers
            const actualPage = item.globalPageIndex - (chapterOneGlobalIndex !== -1 ? chapterOneGlobalIndex : 1) + 1;
            displayPageNum = actualPage.toString();
          }

          // Don't list the cover page in the TOC
          if (item.globalPageIndex === 0) return null;

          return (
            <div key={idx} className={`flex w-full text-xs md:text-sm items-end mb-2 ${item.level === 1 ? 'font-bold mt-4' : 'pl-4 text-gray-700'}`}>
              <span className="bg-white pr-2 whitespace-nowrap">{item.title}</span>
              {/* Dotted Leader Line */}
              <span className="flex-grow border-b-[2px] border-dotted border-gray-400 relative -top-1 mx-1"></span>
              <span className="bg-white pl-2">{displayPageNum}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // --- 4. HTML TABLE GENERATOR ---
  const renderTable = (rawMarkdown: string, keyIndex: number) => {
    const rows = rawMarkdown.split('\n');
    const isSeparator = (r: string) => /^[|\-\s:]+$/.test(r);
    const cleanRows = rows.filter((r) => !isSeparator(r));
    const hasHeader = rows.length > 1 && isSeparator(rows[1]);

    return (
      <div key={keyIndex} className="w-full overflow-x-auto my-6">
        <table className="w-full border-collapse border border-gray-300 text-xs md:text-sm text-left font-sans">
          {hasHeader && cleanRows.length > 0 && (
            <thead className="bg-gray-100">
              <tr>
                {cleanRows[0].split('|').map((c) => c.trim()).filter((_, i, arr) => i !== 0 && i !== arr.length - 1).map((cell, i) => (
                    <th key={i} className="py-2 px-3 border border-gray-300 font-bold text-gray-800">{formatInlineText(cell)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {cleanRows.slice(hasHeader ? 1 : 0).map((row, rIdx) => {
              const cells = row.split('|').map((c) => c.trim()).filter((_, i, arr) => i !== 0 && i !== arr.length - 1);
              return (
                <tr key={rIdx} className="border-b border-gray-300 hover:bg-gray-50">
                  {cells.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 border border-gray-300 text-gray-700">{formatInlineText(cell)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (!content) {
    return <div className="p-10 text-center text-gray-500 font-mono">Select a chapter to load the preview...</div>;
  }

  return (
    <div className="bg-gray-200 py-6 md:py-10 px-2 md:px-10 overflow-y-auto locked-document-viewer select-none flex flex-col gap-6 md:gap-8 items-center h-[80vh]">
      {pages.map((pageBlocks, index) => {
        const isCoverPage = index === 0;

        // Calculate the footer page number display
        let footerPageNum = "";
        if (!isCoverPage) {
          if (chapterOneGlobalIndex !== -1 && index < chapterOneGlobalIndex) {
            footerPageNum = toRoman(index);
          } else {
            footerPageNum = (index - (chapterOneGlobalIndex !== -1 ? chapterOneGlobalIndex : 1) + 1).toString();
          }
        }

        return (
          <div key={index} className="relative bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] px-8 py-12 md:px-[25.4mm] md:py-[25.4mm] pointer-events-none flex flex-col overflow-hidden">
            
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04] flex items-center justify-center text-center z-0"
              style={{ backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\'><text x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'36\' font-weight=\'900\' fill=\'%23d97706\' text-anchor=\'middle\' transform=\'rotate(-45 200 200)\'>ETOMU.com</text></svg>")', backgroundRepeat: 'repeat' }}>
            </div>

            {/* Page Content */}
            <div className={`relative z-10 font-serif text-gray-900 flex-grow ${isCoverPage ? 'flex flex-col justify-center items-center text-center' : 'text-justify'}`}>
              
              {pageBlocks.map((block: any, bIdx: number) => {
                if (block.type === 'toc-placeholder') {
                  return (
                    <div key={bIdx} className="w-full">
                      <h1 className="text-xl md:text-2xl font-black mt-0 mb-6 text-center uppercase tracking-widest">TABLE OF CONTENTS</h1>
                      {renderDynamicToC()}
                    </div>
                  );
                }
                if (block.type === 'table') return renderTable(block.text, bIdx);
                if (block.type === 'h1') return <h1 key={bIdx} className={`text-xl md:text-2xl font-black mt-0 mb-6 uppercase tracking-widest ${isCoverPage ? 'text-center' : 'text-center'}`}>{formatInlineText(block.text)}</h1>;
                if (block.type === 'h2') return <h2 key={bIdx} className={`text-lg md:text-xl font-bold mt-6 mb-3 ${isCoverPage ? 'text-center' : 'text-left'}`}>{formatInlineText(block.text)}</h2>;
                if (block.type === 'h3') return <h3 key={bIdx} className={`text-base md:text-lg font-bold mt-4 mb-2 ${isCoverPage ? 'text-center' : 'text-left'}`}>{formatInlineText(block.text)}</h3>;
                
                return <p key={bIdx} className={`mb-4 text-sm md:text-[16px] leading-[2] ${isCoverPage ? 'text-center' : 'text-justify'}`}>{formatInlineText(block.text)}</p>;
              })}

            </div>

            {/* Page Number Footer */}
            {!isCoverPage && (
              <div className="absolute bottom-[10mm] left-0 w-full text-center text-xs md:text-sm text-gray-500 font-serif">
                {footerPageNum}
              </div>
            )}
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
            top: 50%; left: 50%; transform: translate(-50%, -50%);
            font-size: 20px; font-weight: bold; color: black; text-align: center;
          }
        }
      `}} />
    </div>
  );
}
