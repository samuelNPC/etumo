"use client";

import React, { useEffect, useMemo } from "react";

interface LockedDocumentViewerProps {
  content: string;
}

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

  // --- THE 2-PASS AUTO-INDEX ENGINE ---
  const { finalRenderPages, tocData, lotData, finalChapterOneIdx } = useMemo(() => {
    if (!content) return { finalRenderPages: [], tocData: [], lotData: [], finalChapterOneIdx: -1 };

    // 1. Clean formatting errors
    let cleanText = content;
    cleanText = cleanText.replace(/^(#\s*)?(\*\*)?PRELIMINARY PAGES(\*\*)?\s*$/gim, '');
    cleanText = cleanText.replace(/^(#\s*)?(\*\*)?APPENDICES(\*\*)?\s*$/gim, '');
    cleanText = cleanText.replace(/^(#\s*)?(\*\*)?(CHAPTER [A-Z]+:.*?|CHAPTER \d+:.*?)(\*\*)?\s*\n+(?=(#\s*)?(\*\*)?(CHAPTER [A-Z]+:.*?|CHAPTER \d+:.*?|1\.0\s+Introduction)(\*\*)?)/gim, '');
    cleanText = cleanText.replace(/^\*\*(CHAPTER .*?)\*\*\s*$/gim, '');
    cleanText = cleanText.replace(/\[SYSTEM_AUTO_INDEX\]/g, '');

    // Force preliminary tags to act as H1s for pagination
    cleanText = cleanText.replace(/^---\s*(DEDICATION|ACKNOWLEDGEMENT|APPROVAL|DECLARATION|ABSTRACT)/gim, '# $1');
    cleanText = cleanText.replace(/^(DECLARATION|APPROVAL|DEDICATION|ACKNOWLEDGEMENT|ABSTRACT)\s*$/gim, '# $1');

    const rawBlocks = cleanText.split(/\n\n+/);
    const parsedBlocks: any[] = [];
    let isSkippingFakeIndex = false;
    
    // 2. Build Blocks & Nuke AI Fake Indexes
    rawBlocks.forEach((blockText) => {
        blockText = blockText.trim();
        if (!blockText || blockText.match(/^[-*]{3,}$/)) return;

        // --- THE PURGE: If the AI tries to write an index, we ignore it completely ---
        if (blockText.match(/^(#\s*)?(\*\*)?(TABLE OF CONTENTS|LIST OF TABLES|LIST OF FIGURES|LIST OF ACRONYMS)(\*\*)?/i)) {
            isSkippingFakeIndex = true;
            return;
        }
        if (isSkippingFakeIndex) {
            // Stop skipping ONLY when we hit a real major header
            if (blockText.match(/^(#\s*)?(\*\*)?(CHAPTER|DECLARATION|APPROVAL|DEDICATION|ACKNOWLEDGEMENT|ABSTRACT)/i)) {
                isSkippingFakeIndex = false;
            } else {
                return; // Delete the fake AI table/list text
            }
        }

        if (blockText.includes("[PAGE BREAK]")) {
             parsedBlocks.push({ type: 'page-break' });
             return;
        }

        if (blockText.includes('|') && blockText.includes('\n') && /^[|\-\s:]+$/m.test(blockText)) {
             const lines = blockText.split('\n');
             const tableStart = lines.findIndex(l => l.trim().startsWith('|'));
             if (tableStart > 0) {
                 parsedBlocks.push({ type: 'p', text: lines.slice(0, tableStart).join('\n') });
             }
             parsedBlocks.push({ type: 'table', text: lines.slice(tableStart).join('\n') });
             return;
        }

        if (blockText.startsWith("# ")) {
             parsedBlocks.push({ type: 'h1', text: blockText.replace(/^#\s*/, '').replace(/\*\*/g, '') });
        } else if (blockText.startsWith("## ")) {
             parsedBlocks.push({ type: 'h2', text: blockText.replace(/^##\s*/, '').replace(/\*\*/g, '') });
        } else if (blockText.startsWith("### ")) {
             parsedBlocks.push({ type: 'h3', text: blockText.replace(/^###\s*/, '').replace(/\*\*/g, '') });
        } else {
             if (/(?:\s|^)1\.\s+[A-Z].*?(?:\s)2\.\s+[A-Z]/g.test(blockText)) {
                 const parts = blockText.split(/(?=\s\d\.\s+[A-Z])/);
                 parts.forEach(part => { if (part.trim()) parsedBlocks.push({ type: 'list-item', text: part.trim() }); });
             } else {
                 parsedBlocks.push({ type: 'p', text: blockText });
             }
        }
    });

    // 3. PASS ONE: Paginate without Indexes
    const tempPages: any[][] = [];
    let currentPage: any[] = [];
    let currentHeight = 0;
    const MAX_PAGE_HEIGHT = 800; 
    
    const tempToc: any[] = [];
    const tempLot: any[] = [];
    let tableCounter = 1;

    const pushPage = () => {
         if (currentPage.length > 0) {
              tempPages.push(currentPage);
              currentPage = [];
              currentHeight = 0;
         }
    };

    parsedBlocks.forEach((block, index) => {
        if (block.type === 'page-break') {
            pushPage();
            return;
        }

        let blockHeight = 0;
        let forceNewPage = false;

        if (block.type === 'h1') {
             blockHeight = 80;
             forceNewPage = true; 
             tempToc.push({ title: block.text, level: 1, globalPageIndex: tempPages.length });
        } 
        else if (block.type === 'h2') {
             blockHeight = 60;
             tempToc.push({ title: block.text, level: 2, globalPageIndex: tempPages.length });
        } 
        else if (block.type === 'h3') {
             blockHeight = 40;
        } 
        else if (block.type === 'p') {
             blockHeight = Math.ceil(block.text.length / 90) * 24 + 16; 
        } 
        else if (block.type === 'list-item') {
             blockHeight = Math.ceil(block.text.length / 90) * 24 + 8; 
        }
        else if (block.type === 'table') {
             blockHeight = block.text.split('\n').length * 30 + 40; 
             let lotTitle = `Table ${tableCounter}`;
             if (index > 0 && parsedBlocks[index - 1].type === 'p') {
                 const prevText = parsedBlocks[index - 1].text.replace(/\*\*/g, '').trim();
                 if (prevText.toLowerCase().includes('table')) {
                     lotTitle = prevText.length > 60 ? prevText.substring(0, 60) + '...' : prevText;
                 }
             }
             tempLot.push({ title: lotTitle, globalPageIndex: tempPages.length });
             tableCounter++;
        }

        // Cover page must stand alone
        if (tempPages.length === 0 && forceNewPage && currentPage.length > 0) {
             pushPage();
        } else if (forceNewPage && currentPage.length > 0) {
             pushPage();
        } else if (currentHeight + blockHeight > MAX_PAGE_HEIGHT && currentPage.length > 0) {
             pushPage(); 
        }

        currentPage.push(block);
        currentHeight += blockHeight;
    });
    pushPage(); 

    // 4. PASS TWO: Find Insertion Point & Adjust Math
    // Find where the Abstract or Chapter One starts so we can slide the Indexes in before them
    let abstractIdx = tempPages.findIndex(page => page.some(b => b.type === 'h1' && b.text.toUpperCase().includes('ABSTRACT')));
    let chapOneIdx = tempPages.findIndex(page => page.some(b => b.type === 'h1' && (b.text.toUpperCase().includes('CHAPTER ONE') || b.text.toUpperCase().includes('CHAPTER 1'))));
    
    // Default to inserting after preliminary pages, before abstract/chapter 1
    let insertIdx = abstractIdx !== -1 ? abstractIdx : (chapOneIdx !== -1 ? chapOneIdx : 1);

    const hasToc = tempToc.length > 0;
    const hasLot = tempLot.length > 0;
    
    let insertedPagesCount = 0;
    if (hasToc) insertedPagesCount++;
    if (hasLot) insertedPagesCount++; 

    // Shift the page numbers for the TOC/LOT to account for the newly inserted pages
    const finalToc = tempToc.map(item => ({
        ...item,
        globalPageIndex: item.globalPageIndex >= insertIdx ? item.globalPageIndex + insertedPagesCount : item.globalPageIndex
    }));

    const finalLot = tempLot.map(item => ({
        ...item,
        globalPageIndex: item.globalPageIndex >= insertIdx ? item.globalPageIndex + insertedPagesCount : item.globalPageIndex
    }));

    const finalChapOne = chapOneIdx !== -1 ? chapOneIdx + insertedPagesCount : -1;

    // 5. BUILD FINAL ARRAY: Splice the Auto-Pages into the document flow
    const finalPages = [];
    for (let i = 0; i < tempPages.length; i++) {
        if (i === insertIdx) {
            if (hasToc) finalPages.push([{ type: 'auto-toc' }]);
            if (hasLot) finalPages.push([{ type: 'auto-lot' }]);
        }
        finalPages.push(tempPages[i]);
    }
    // Failsafe if document is very short
    if (insertIdx >= tempPages.length) {
        if (hasToc) finalPages.push([{ type: 'auto-toc' }]);
        if (hasLot) finalPages.push([{ type: 'auto-lot' }]);
    }

    return { finalRenderPages: finalPages, tocData: finalToc, lotData: finalLot, finalChapterOneIdx: finalChapOne };
  }, [content]);

  // --- PERFECT PAGE NUMBERING LOGIC ---
  const getDisplayPageNum = (globalIndex: number) => {
    if (globalIndex === 0) return ""; 
    // Preliminary Pages (including injected TOC/LOT) get Roman Numerals
    if (finalChapterOneIdx !== -1 && globalIndex < finalChapterOneIdx) {
      return toRoman(globalIndex);
    }
    // Chapter 1 and beyond get Arabic 1, 2, 3...
    return (globalIndex - (finalChapterOneIdx !== -1 ? finalChapterOneIdx : 1) + 1).toString();
  };

  // --- AUTO COMPONENTS ---
  const renderDynamicToC = () => {
    return (
      <div className="w-full font-sans py-10">
         <h1 className="text-xl md:text-2xl font-black mb-8 uppercase tracking-widest text-center">TABLE OF CONTENTS</h1>
        {tocData.map((item, idx) => {
          if (item.globalPageIndex === 0) return null; 
          return (
            <div key={`toc-${idx}`} className={`flex w-full text-xs items-end mb-2 ${item.level === 1 ? 'font-bold mt-4' : 'pl-6 text-gray-800'}`}>
              <span className="bg-white pr-2 whitespace-nowrap">{item.title}</span>
              <span className="flex-grow border-b-[2px] border-dotted border-gray-400 relative -top-1 mx-1"></span>
              <span className="bg-white pl-2 font-medium">{getDisplayPageNum(item.globalPageIndex)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDynamicLoT = () => {
    return (
      <div className="w-full font-sans py-10">
         <h1 className="text-xl md:text-2xl font-black mb-8 uppercase tracking-widest text-center">LIST OF TABLES</h1>
        {lotData.map((item, idx) => (
          <div key={`lot-${idx}`} className="flex w-full text-xs items-end mb-2 pl-6 text-gray-800">
            <span className="bg-white pr-2 whitespace-nowrap">{item.title}</span>
            <span className="flex-grow border-b-[2px] border-dotted border-gray-400 relative -top-1 mx-1"></span>
            <span className="bg-white pl-2 font-medium">{getDisplayPageNum(item.globalPageIndex)}</span>
          </div>
        ))}
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
      // --- THE CUT-OFF FIX: table-fixed, break-words, whitespace-normal ---
      <div key={keyIndex} className="w-full max-w-full my-6 bg-white overflow-hidden">
        <table className="w-full border-collapse border border-gray-400 text-[10px] md:text-xs text-left font-sans table-fixed break-words">
          {hasHeader && cleanRows.length > 0 && (
            <thead className="bg-gray-100">
              <tr>
                {parseCells(cleanRows[0]).map((cell, i) => (
                    <th key={i} className="py-2 px-2 border border-gray-400 font-bold text-gray-900 whitespace-normal break-words">{formatInlineText(cell)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {cleanRows.slice(hasHeader ? 1 : 0).map((row, rIdx) => {
              return (
                <tr key={rIdx} className="border-b border-gray-300 hover:bg-gray-50">
                  {parseCells(row).map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-2 border border-gray-400 text-gray-800 whitespace-normal break-words">{formatInlineText(cell)}</td>
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
    <div className="bg-gray-200 py-6 md:py-10 px-2 md:px-10 overflow-y-auto locked-document-viewer select-none flex flex-col gap-8 md:gap-10 items-center min-h-[80vh]">
      {finalRenderPages.map((pageBlocks, index) => {
        const isCoverPage = index === 0;

        return (
          <div key={index} className="relative bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] px-8 py-12 md:px-[25.4mm] md:py-[25.4mm] pointer-events-none flex flex-col overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.04] flex items-center justify-center text-center z-0"
              style={{ backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\'><text x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'36\' font-weight=\'900\' fill=\'%23d97706\' text-anchor=\'middle\' transform=\'rotate(-45 200 200)\'>ETOMU.com</text></svg>")', backgroundRepeat: 'repeat' }}>
            </div>

            <div className={`relative z-10 font-serif text-gray-900 flex-grow ${isCoverPage ? 'flex flex-col justify-center items-center text-center space-y-12' : 'text-justify'}`}>
              
              {pageBlocks.map((block: any, bIdx: number) => {
                // THE INJECTED AUTO-PAGES
                if (block.type === 'auto-toc') return <div key={bIdx} className="w-full">{renderDynamicToC()}</div>;
                if (block.type === 'auto-lot') return <div key={bIdx} className="w-full">{renderDynamicLoT()}</div>;

                if (block.type === 'table') return renderTable(block.text, bIdx);
                
                if (block.type === 'h1') return <h1 key={bIdx} className={`text-xl md:text-2xl font-black mt-0 mb-8 uppercase tracking-widest ${isCoverPage ? 'text-center' : 'text-center w-full'}`}>{formatInlineText(block.text)}</h1>;
                if (block.type === 'h2') return <h2 key={bIdx} className={`text-lg md:text-xl font-bold mt-8 mb-4 ${isCoverPage ? 'text-center' : 'text-left'}`}>{formatInlineText(block.text)}</h2>;
                if (block.type === 'h3') return <h3 key={bIdx} className={`text-base md:text-lg font-bold mt-6 mb-2 ${isCoverPage ? 'text-center' : 'text-left'}`}>{formatInlineText(block.text)}</h3>;

                if (block.type === 'list-item') {
                     return (
                         <div key={bIdx} className="pl-6 mb-2 text-sm md:text-base leading-loose">
                             {formatInlineText(block.text)}
                         </div>
                     );
                }

                return <p key={bIdx} className={`mb-4 text-sm md:text-base leading-loose ${isCoverPage ? 'text-center font-bold text-lg' : 'text-justify'}`}>{formatInlineText(block.text)}</p>;
              })}

            </div>

            {/* THE PAGE NUMBER FOOTER */}
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
