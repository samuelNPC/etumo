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

  const formatInlineText = (text: string) => {
    if (!text.includes("**")) return text;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
      ) : part
    );
  };

  // --- STABILIZED ENGINE ---
  const { pages, toc, lot, chapterOneIndex } = useMemo(() => {
    if (!content) return { pages: [], toc: [], lot: [], chapterOneIndex: -1 };

    // 1. Aggressive, clean stripping of AI hallucinations
    let cleanText = content
      .replace(/^(#\s*)?(\*\*)?PRELIMINARY PAGES(\*\*)?\s*$/gim, '')
      .replace(/^(#\s*)?(\*\*)?APPENDICES(\*\*)?\s*$/gim, '');

    // Strip duplicate "CHAPTER ONE: INTRODUCTION" that sits right above "1.0 Introduction"
    cleanText = cleanText.replace(/^(#\s*)?(\*\*)?(CHAPTER [A-Z]+:.*?|CHAPTER \d+:.*?)(\*\*)?\s*\n+(?=(#\s*)?(\*\*)?(CHAPTER [A-Z]+:.*?|CHAPTER \d+:.*?|1\.0\s+Introduction)(\*\*)?)/gim, '');
    
    // Strip random bold duplicates on their own lines
    cleanText = cleanText.replace(/^\*\*(CHAPTER .*?)\*\*\s*$/gim, '');

    // 2. Simple, predictable pagination
    // Break ONLY on explicit [PAGE BREAK] or before a new # CHAPTER
    const paginatedText = cleanText
      .replace(/\[PAGE BREAK\]/gi, '\n___PAGE_BREAK___\n')
      .replace(/\n(?=#\s*CHAPTER)/gi, '\n___PAGE_BREAK___\n');

    const rawPages = paginatedText.split('___PAGE_BREAK___').filter(p => p.trim().length > 0);
    
    const finalPages: any[][] = [];
    const generatedToc: any[] = [];
    const generatedLot: any[] = [];
    let chapOneIdx = -1;
    let tableCounter = 1;

    rawPages.forEach((pageText) => {
      const lines = pageText.split('\n');
      const currentPageBlocks: any[] = [];
      let tableBuffer: string[] = [];

      const flushTable = () => {
        if (tableBuffer.length > 0) {
          currentPageBlocks.push({ type: 'table', text: tableBuffer.join('\n') });
          
          // Try to find the table title (usually the line right before the table)
          let lotTitle = `Table ${tableCounter}`;
          if (currentPageBlocks.length > 1) {
            const prevBlock = currentPageBlocks[currentPageBlocks.length - 2];
            if (prevBlock.type === 'p' && prevBlock.text.toLowerCase().includes('table')) {
              lotTitle = prevBlock.text.replace(/\*\*/g, '').trim();
            }
          }
          generatedLot.push({ title: lotTitle, globalPageIndex: finalPages.length });
          tableCounter++;
          tableBuffer = [];
        }
      };

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Skip AI generated placeholders
        if (line.includes("[SYSTEM_AUTO_INDEX]") || line.toUpperCase().includes("TABLE OF CONTENTS") && lines.length < 5) {
            currentPageBlocks.push({ type: 'toc-placeholder', text: "" });
            continue;
        }

        // Table Detection
        if (line.startsWith('|')) {
          tableBuffer.push(line);
          continue;
        } else {
          flushTable();
        }

        // Heading Detection
        if (line.startsWith("# ")) {
          const title = line.replace("# ", "");
          currentPageBlocks.push({ type: 'h1', text: title });
          
          const titleClean = title.replace(/\*\*/g, '').trim();
          generatedToc.push({ title: titleClean, level: 1, globalPageIndex: finalPages.length });
          
          if (titleClean.toUpperCase().includes("CHAPTER ONE") || titleClean.toUpperCase().includes("CHAPTER 1")) {
            chapOneIdx = finalPages.length;
          }
        } else if (line.startsWith("## ")) {
          const title = line.replace("## ", "");
          currentPageBlocks.push({ type: 'h2', text: title });
          generatedToc.push({ title: title.replace(/\*\*/g, '').trim(), level: 2, globalPageIndex: finalPages.length });
        } else if (line.startsWith("### ")) {
          currentPageBlocks.push({ type: 'h3', text: line.replace("### ", "") });
        } else {
           // Standard Paragraph
          currentPageBlocks.push({ type: 'p', text: line });
        }
      }
      flushTable(); // Catch any table at the very end

      if (currentPageBlocks.length > 0) {
        finalPages.push(currentPageBlocks);
      }
    });

    return { pages: finalPages, toc: generatedToc, lot: generatedLot, chapterOneIndex: chapOneIdx };
  }, [content]);

  const getDisplayPageNum = (globalIndex: number) => {
    if (globalIndex === 0) return "";
    if (chapterOneIndex !== -1 && globalIndex < chapterOneIndex) {
      return toRoman(globalIndex);
    }
    return (globalIndex - (chapterOneIndex !== -1 ? chapterOneIndex : 1) + 1).toString();
  };

  const renderDynamicToC = () => {
    return (
      <div className="w-full mt-8 mb-8 px-4 md:px-12 font-sans">
         <h1 className="text-xl md:text-2xl font-black mt-0 mb-8 uppercase tracking-widest text-center">TABLE OF CONTENTS</h1>
        {toc.map((item, idx) => {
          if (item.globalPageIndex === 0) return null; 
          return (
            <div key={`toc-${idx}`} className={`flex w-full text-xs md:text-sm items-end mb-2 md:mb-3 ${item.level === 1 ? 'font-bold mt-4 md:mt-6' : 'pl-6 text-gray-800'}`}>
              <span className="bg-white pr-2 whitespace-nowrap">{item.title}</span>
              <span className="flex-grow border-b-[2px] border-dotted border-gray-400 relative -top-1 mx-1"></span>
              <span className="bg-white pl-2 font-medium">{getDisplayPageNum(item.globalPageIndex)}</span>
            </div>
          );
        })}
        
        {lot.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg md:text-xl font-bold mb-6 uppercase tracking-wider text-center">LIST OF TABLES</h2>
            {lot.map((item, idx) => (
              <div key={`lot-${idx}`} className="flex w-full text-xs md:text-sm items-end mb-2 md:mb-3 pl-6 text-gray-800">
                <span className="bg-white pr-2 whitespace-nowrap">{item.title}</span>
                <span className="flex-grow border-b-[2px] border-dotted border-gray-400 relative -top-1 mx-1"></span>
                <span className="bg-white pl-2 font-medium">{getDisplayPageNum(item.globalPageIndex)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTable = (rawMarkdown: string, keyIndex: number) => {
    const rows = rawMarkdown.split('\n');
    const isSeparator = (r: string) => /^[|\-\s:]+$/.test(r.trim()) && r.includes('-');
    const cleanRows = rows.filter((r) => !isSeparator(r) && r.trim().length > 0);
    const hasHeader = rows.length > 1 && rows.some(isSeparator);

    const parseCells = (row: string) => {
      let cells = row.split('|').map(c => c.trim());
      if (cells.length > 0 && cells[0] === '') cells.shift();
      if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
      return cells;
    };

    return (
      <div key={keyIndex} className="w-full overflow-x-auto my-8">
        <table className="w-full border-collapse border border-gray-400 text-[11px] md:text-xs text-left font-sans">
          {hasHeader && cleanRows.length > 0 && (
            <thead className="bg-gray-100">
              <tr>
                {parseCells(cleanRows[0]).map((cell, i) => (
                    <th key={i} className="py-2 px-3 border border-gray-400 font-bold text-gray-900">{formatInlineText(cell)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {cleanRows.slice(hasHeader ? 1 : 0).map((row, rIdx) => {
              return (
                <tr key={rIdx} className="border-b border-gray-300 hover:bg-gray-50">
                  {parseCells(row).map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 border border-gray-400 text-gray-800">{formatInlineText(cell)}</td>
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
    <div className="bg-gray-200 py-6 md:py-10 px-2 md:px-10 overflow-y-auto locked-document-viewer select-none flex flex-col gap-8 md:gap-10 items-center h-[80vh]">
      {pages.map((pageBlocks, index) => {
        const isCoverPage = index === 0;

        return (
          <div key={index} className="relative bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] px-8 py-12 md:px-[25.4mm] md:py-[25.4mm] pointer-events-none flex flex-col overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.04] flex items-center justify-center text-center z-0"
              style={{ backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\'><text x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'36\' font-weight=\'900\' fill=\'%23d97706\' text-anchor=\'middle\' transform=\'rotate(-45 200 200)\'>ETOMU.com</text></svg>")', backgroundRepeat: 'repeat' }}>
            </div>

            <div className={`relative z-10 font-serif text-gray-900 flex-grow ${isCoverPage ? 'flex flex-col justify-center items-center text-center space-y-8' : 'text-justify'}`}>
              {pageBlocks.map((block: any, bIdx: number) => {
                if (block.type === 'toc-placeholder') {
                  return <div key={bIdx} className="w-full">{renderDynamicToC()}</div>;
                }
                if (block.type === 'table') return renderTable(block.text, bIdx);
                
                if (block.type === 'h1') return <h1 key={bIdx} className="text-xl md:text-2xl font-black mt-0 mb-6 uppercase tracking-widest text-center">{formatInlineText(block.text)}</h1>;
                if (block.type === 'h2') return <h2 key={bIdx} className={`text-lg md:text-xl font-bold mt-8 mb-4 ${isCoverPage ? 'text-center' : 'text-left'}`}>{formatInlineText(block.text)}</h2>;
                if (block.type === 'h3') return <h3 key={bIdx} className={`text-base md:text-lg font-bold mt-6 mb-2 ${isCoverPage ? 'text-center' : 'text-left'}`}>{formatInlineText(block.text)}</h3>;

                return <p key={bIdx} className={`mb-4 text-sm md:text-[16px] leading-[2] ${isCoverPage ? 'text-center font-bold text-lg max-w-[80%]' : 'text-justify'}`}>{formatInlineText(block.text)}</p>;
              })}
            </div>

            {!isCoverPage && (
              <div className="absolute bottom-[10mm] left-0 w-full text-center text-xs md:text-sm text-gray-500 font-serif">
                {getDisplayPageNum(index)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
