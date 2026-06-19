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
  const { pages, toc, lot, chapterOneGlobalIndex } = useMemo(() => {
    if (!content) return { pages: [], toc: [], lot: [], chapterOneGlobalIndex: -1 };

    // Clean the raw AI output
    let cleanText = content
      .replace(/^(#\s*)?(\*\*)?PRELIMINARY PAGES(\*\*)?\s*$/gim, '')
      .replace(/^(#\s*)?(\*\*)?APPENDICES(\*\*)?\s*$/gim, '')
      .replace(/^\*\*(CHAPTER .*?)\*\*\s*$/gim, ''); // Strip duplicate bold headings

    // Force a page break on explicit tags, markdown dividers, OR any major Heading 1
    const paginatedText = cleanText
      .replace(/\[PAGE BREAK\]/gi, '\n___PAGE_BREAK___\n')
      .replace(/\n\s*---\s*\n/g, '\n___PAGE_BREAK___\n')
      .replace(/\n# /g, '\n___PAGE_BREAK___\n# ')
      .replace(/^# /, '\n___PAGE_BREAK___\n# ');

    const rawPages = paginatedText.split('___PAGE_BREAK___').filter(p => p.trim().length > 0);
    
    const finalPages: any[][] = [];
    const generatedToc: any[] = [];
    const generatedLot: any[] = []; // List of Tables
    let chapOneIndex = -1;
    let tableCounter = 1;

    rawPages.forEach((pageText) => {
      const rawBlocks = pageText.split(/\n\n+/);
      const currentPageBlocks: any[] = [];
      let isSkippingAiToc = false;

      rawBlocks.forEach((block) => {
        let blockText = block.trim();
        if (!blockText) return;

        // Skip AI-generated TOC/LOT blocks so we can inject our own clean ones
        if (blockText.toUpperCase().includes("TABLE OF CONTENTS") || blockText.toUpperCase().includes("[SYSTEM_AUTO_INDEX]")) {
          isSkippingAiToc = true;
          currentPageBlocks.push({ type: 'toc-placeholder', text: "TABLE OF CONTENTS" });
          return;
        }
        if (isSkippingAiToc) {
          if (blockText.startsWith("|") || blockText.toLowerCase().includes("abstract")) return; 
          isSkippingAiToc = false; 
        }

        // --- NEW: ROBUST TABLE DETECTION ---
        const lines = blockText.split('\n');
        const tableStartIndex = lines.findIndex(line => line.trim().startsWith('|'));
        const hasTableSeparator = lines.some(line => /^[|\-\s:]+$/.test(line.trim()) && line.includes('-'));

        if (tableStartIndex !== -1 && hasTableSeparator) {
          // We found a table mixed in this block!

          // 1. If there is a title above the table (e.g., "Table 4.6: ANOVA"), separate it and push as a paragraph
          if (tableStartIndex > 0) {
            const titleText = lines.slice(0, tableStartIndex).join('\n').trim();
            if (titleText) currentPageBlocks.push({ type: 'p', text: titleText });
          }
          
          // 2. Push the actual Markdown table
          const tableText = lines.slice(tableStartIndex).join('\n');
          currentPageBlocks.push({ type: 'table', text: tableText });
          
          // 3. Track it for the List of Tables
          let lotTitle = `Table ${tableCounter}`;
          if (tableStartIndex > 0) {
             const potentialTitle = lines[0].replace(/\*\*/g, '').trim();
             if (potentialTitle.toLowerCase().startsWith('table')) {
                lotTitle = potentialTitle.length > 70 ? potentialTitle.substring(0, 70) + '...' : potentialTitle;
             }
          }
          generatedLot.push({
            title: lotTitle,
            globalPageIndex: finalPages.length
          });
          tableCounter++;

        } 
        // --- STANDARD HEADING AND PARAGRAPH PARSING ---
        else if (blockText.startsWith("# ")) {
          const title = blockText.replace("# ", "");
          currentPageBlocks.push({ type: 'h1', text: title });
          
          const titleClean = title.replace(/\*\*/g, '').trim();
          generatedToc.push({ title: titleClean, level: 1, globalPageIndex: finalPages.length });
          
          if (titleClean.toUpperCase().includes("CHAPTER ONE") || titleClean.toUpperCase().includes("CHAPTER 1")) {
            chapOneIndex = finalPages.length;
          }
        } else if (blockText.startsWith("## ")) {
          const title = blockText.replace("## ", "");
          currentPageBlocks.push({ type: 'h2', text: title });
          generatedToc.push({ title: title.replace(/\*\*/g, '').trim(), level: 2, globalPageIndex: finalPages.length });
        } else if (blockText.startsWith("### ")) {
          currentPageBlocks.push({ type: 'h3', text: blockText.replace("### ", "") });
        } else {
          currentPageBlocks.push({ type: 'p', text: blockText });
        }
      });

      if (currentPageBlocks.length > 0) {
        finalPages.push(currentPageBlocks);
      }
    });

    return { pages: finalPages, toc: generatedToc, lot: generatedLot, chapterOneGlobalIndex: chapOneIndex };
  }, [content]);

  // --- Helper: Get Display Page Number ---
  const getDisplayPageNum = (globalIndex: number) => {
    if (globalIndex === 0) return "";
    if (chapterOneGlobalIndex !== -1 && globalIndex < chapterOneGlobalIndex) {
      return toRoman(globalIndex);
    }
    return (globalIndex - (chapterOneGlobalIndex !== -1 ? chapterOneGlobalIndex : 1) + 1).toString();
  };

  // --- 3. DYNAMIC TOC RENDERER ---
  const renderDynamicToC = () => {
    return (
      <div className="w-full mt-4 mb-8 px-2 md:px-8 font-sans">
        {toc.map((item, idx) => {
          if (item.globalPageIndex === 0) return null; // Skip cover page
          return (
            <div key={`toc-${idx}`} className={`flex w-full text-[11px] md:text-sm items-end mb-1 md:mb-2 ${item.level === 1 ? 'font-bold mt-2 md:mt-4' : 'pl-4 text-gray-700'}`}>
              <span className="bg-white pr-2 whitespace-nowrap">{item.title}</span>
              <span className="flex-grow border-b-[2px] border-dotted border-gray-400 relative -top-1 mx-1"></span>
              <span className="bg-white pl-2">{getDisplayPageNum(item.globalPageIndex)}</span>
            </div>
          );
        })}
        
        {/* Append List of Tables if tables exist */}
        {lot.length > 0 && (
          <div className="mt-8 page-break-before">
            <h1 className="text-xl md:text-2xl font-black mt-0 mb-6 uppercase tracking-widest text-center">LIST OF TABLES</h1>
            {lot.map((item, idx) => (
              <div key={`lot-${idx}`} className="flex w-full text-[11px] md:text-sm items-end mb-1 md:mb-2 pl-4 text-gray-700">
                <span className="bg-white pr-2 whitespace-nowrap">{item.title}</span>
                <span className="flex-grow border-b-[2px] border-dotted border-gray-400 relative -top-1 mx-1"></span>
                <span className="bg-white pl-2">{getDisplayPageNum(item.globalPageIndex)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- 4. HTML TABLE GENERATOR ---
  const renderTable = (rawMarkdown: string, keyIndex: number) => {
    const rows = rawMarkdown.split('\n');
    const isSeparator = (r: string) => /^[|\-\s:]+$/.test(r.trim()) && r.includes('-');
    const cleanRows = rows.filter((r) => !isSeparator(r) && r.trim().length > 0);
    const hasHeader = rows.length > 1 && rows.some(isSeparator);

    // Robust cell parser: Handles pipes correctly even if outer pipes are missing
    const parseCells = (row: string) => {
      let cells = row.split('|').map(c => c.trim());
      if (cells.length > 0 && cells[0] === '') cells.shift();
      if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
      return cells;
    };

    return (
      <div key={keyIndex} className="w-full overflow-x-auto my-6">
        <table className="w-full border-collapse border border-gray-300 text-[10px] md:text-xs text-left font-sans">
          {hasHeader && cleanRows.length > 0 && (
            <thead className="bg-gray-100">
              <tr>
                {parseCells(cleanRows[0]).map((cell, i) => (
                    <th key={i} className="py-2 px-2 border border-gray-300 font-bold text-gray-800">{formatInlineText(cell)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {cleanRows.slice(hasHeader ? 1 : 0).map((row, rIdx) => {
              return (
                <tr key={rIdx} className="border-b border-gray-300 hover:bg-gray-50">
                  {parseCells(row).map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-2 border border-gray-300 text-gray-700">{formatInlineText(cell)}</td>
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
                
                if (block.type === 'h1') return <h1 key={bIdx} className="text-xl md:text-2xl font-black mt-0 mb-6 uppercase tracking-widest text-center">{formatInlineText(block.text)}</h1>;
                if (block.type === 'h2') return <h2 key={bIdx} className={`text-lg md:text-xl font-bold mt-6 mb-3 ${isCoverPage ? 'text-center' : 'text-left'}`}>{formatInlineText(block.text)}</h2>;
                if (block.type === 'h3') return <h3 key={bIdx} className={`text-base md:text-lg font-bold mt-4 mb-2 ${isCoverPage ? 'text-center' : 'text-left'}`}>{formatInlineText(block.text)}</h3>;

                return <p key={bIdx} className={`mb-4 text-sm md:text-[16px] leading-[2] ${isCoverPage ? 'text-center' : 'text-justify'}`}>{formatInlineText(block.text)}</p>;
              })}

            </div>

            {/* Page Number Footer */}
            {!isCoverPage && (
              <div className="absolute bottom-[10mm] left-0 w-full text-center text-xs md:text-sm text-gray-500 font-serif">
                {getDisplayPageNum(index)}
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
