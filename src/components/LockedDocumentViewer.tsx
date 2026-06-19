"use client";

import React, { useEffect, useMemo } from "react";

interface LockedDocumentViewerProps {
  blocks: any[]; // 🚨 AST ARCHITECTURE: Receives a structured array, NOT a string!
}

const toRoman = (num: number): string => {
  if (num <= 0) return "";
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

export default function LockedDocumentViewer({ blocks }: LockedDocumentViewerProps) {
  
  // Anti-Copy Protections
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

  // Parses inline bolding inside normal text blocks
  const formatInlineText = (text: string) => {
    if (!text.includes("**")) return text;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
      ) : part
    );
  };

  // --- THE AST PAGINATION ENGINE ---
  // Simply calculates heights and loops over the pre-cleaned array.
  const { finalRenderPages, tocData, lotData, lofData, finalChapterOneIdx } = useMemo(() => {
    if (!blocks || blocks.length === 0) {
        return { finalRenderPages: [], tocData: [], lotData: [], lofData: [], finalChapterOneIdx: -1 };
    }

    const tempPages: any[][] = [];
    let currentPage: any[] = [];
    let currentHeight = 0;
    const MAX_PAGE_HEIGHT = 800; 
    
    const tempToc: any[] = [];
    const tempLot: any[] = [];
    const tempLof: any[] = []; 
    let chapOneIdx = -1;
    let tableCounter = 1;

    const pushPage = () => {
         if (currentPage.length > 0) {
              tempPages.push(currentPage);
              currentPage = [];
              currentHeight = 0;
         }
    };

    blocks.forEach((block, index) => {
        if (block.type === 'page-break') {
            pushPage();
            return;
        }

        let blockHeight = 0;
        let forceNewPage = false;

        if (block.type === 'h1') {
             blockHeight = 80;
             forceNewPage = true; 
             
             const upperTitle = block.text.toUpperCase();
             if (!["TABLE OF CONTENTS", "LIST OF TABLES", "LIST OF FIGURES", "LIST OF ACRONYMS"].includes(upperTitle)) {
                 tempToc.push({ title: block.text, level: 1, globalPageIndex: tempPages.length });
             }
             
             if (upperTitle.includes("CHAPTER ONE") || upperTitle.includes("CHAPTER 1") || upperTitle.includes("1.0 INTRODUCTION")) {
                 if (chapOneIdx === -1) chapOneIdx = tempPages.length;
             }
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
             
             const upperText = block.text.toUpperCase();
             if (upperText.includes('[INSERT') && upperText.includes('CONCEPTUAL FRAMEWORK')) {
                 tempLof.push({ title: "Conceptual Framework", globalPageIndex: tempPages.length });
             } else if (upperText.startsWith('FIGURE')) {
                 tempLof.push({ title: block.text.split('\n')[0].substring(0, 80), globalPageIndex: tempPages.length });
             }
        } 
        else if (block.type === 'list-item') {
             blockHeight = Math.ceil(block.text.length / 90) * 24 + 8; 
        }
        else if (block.type === 'table') {
             blockHeight = block.text.split('\n').length * 30 + 40; 
             
             let lotTitle = `Table ${tableCounter}`;
             if (index > 0 && blocks[index - 1].type === 'p') {
                 const prevText = blocks[index - 1].text.replace(/\*\*/g, '').trim();
                 if (prevText.toLowerCase().includes('table')) {
                     lotTitle = prevText.length > 80 ? prevText.substring(0, 80) + '...' : prevText;
                 }
             }
             tempLot.push({ title: lotTitle, globalPageIndex: tempPages.length });
             tableCounter++;
        }

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

    // Inject dynamic index flags based on the clean headers
    const finalPages = tempPages.map(pageBlocks => {
        const firstBlock = pageBlocks[0];
        if (firstBlock && firstBlock.type === 'h1') {
            const upper = firstBlock.text.toUpperCase();
            if (upper.includes("TABLE OF CONTENTS")) return [{ type: 'auto-toc' }];
            if (upper.includes("LIST OF TABLES")) return [{ type: 'auto-lot' }];
            if (upper.includes("LIST OF FIGURES")) return [{ type: 'auto-lof' }];
        }
        return pageBlocks;
    });

    return { finalRenderPages: finalPages, tocData: tempToc, lotData: tempLot, lofData: tempLof, finalChapterOneIdx: chapOneIdx };
  }, [blocks]);

  // --- PERFECT ROMAN NUMERAL MATH ---
  const getDisplayPageNum = (globalIndex: number) => {
    if (globalIndex === 0) return ""; 
    if (finalChapterOneIdx !== -1 && globalIndex < finalChapterOneIdx) {
      return toRoman(globalIndex);
    }
    return (globalIndex - (finalChapterOneIdx !== -1 ? finalChapterOneIdx : 1) + 1).toString();
  };

  // --- AUTO COMPONENTS ---
  const renderDynamicToC = () => (
    <div className="w-full font-sans py-8">
      <h1 className="text-xl md:text-2xl font-black mt-0 mb-8 uppercase tracking-widest text-center">TABLE OF CONTENTS</h1>
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

  const renderDynamicLoT = () => {
    if (lotData.length === 0) return <div className="w-full text-center py-8"><h1 className="text-xl md:text-2xl font-black mt-0 mb-8 uppercase tracking-widest text-center">LIST OF TABLES</h1><p className="text-sm text-gray-500 italic">No tables found.</p></div>;
    return (
      <div className="w-full font-sans py-8">
        <h1 className="text-xl md:text-2xl font-black mt-0 mb-8 uppercase tracking-widest text-center">LIST OF TABLES</h1>
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

  const renderDynamicLoF = () => {
    if (lofData.length === 0) return <div className="w-full text-center py-8"><h1 className="text-xl md:text-2xl font-black mt-0 mb-8 uppercase tracking-widest text-center">LIST OF FIGURES</h1><p className="text-sm text-gray-500 italic">No figures found.</p></div>;
    return (
      <div className="w-full font-sans py-8">
        <h1 className="text-xl md:text-2xl font-black mt-0 mb-8 uppercase tracking-widest text-center">LIST OF FIGURES</h1>
        {lofData.map((item, idx) => (
          <div key={`lof-${idx}`} className="flex w-full text-xs items-end mb-2 pl-6 text-gray-800">
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
      <div key={keyIndex} className="w-full max-w-full overflow-x-auto my-6 bg-white">
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

  if (!blocks || blocks.length === 0) {
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
                if (block.type === 'auto-toc') return <div key={bIdx} className="w-full">{renderDynamicToC()}</div>;
                if (block.type === 'auto-lot') return <div key={bIdx} className="w-full">{renderDynamicLoT()}</div>;
                if (block.type === 'auto-lof') return <div key={bIdx} className="w-full">{renderDynamicLoF()}</div>;

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

            {/* PERFECT FOOTER NUMBERING */}
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
