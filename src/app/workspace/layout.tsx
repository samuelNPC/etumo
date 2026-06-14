"use client";

import React from "react";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Static placeholder chapters for testing the UI layout state
  const chapters = [
    { name: "Preliminary Pages", free: true },
    { name: "Chapter 1: Introduction", free: false },
    { name: "Chapter 2: Literature Review", free: false },
    { name: "Chapter 3: Methodology", free: false },
    { name: "Chapter 4: Data Presentation", free: false },
    { name: "Chapter 5: Summary & Concl.", free: false },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* LEFT SIDEBAR: Progress & Modules */}
      <aside className="w-64 border-r border-gray-300 bg-gray-50 flex flex-col p-4">
        <div className="mb-6">
          <h2 className="font-bold text-lg tracking-tight">rs.kabaleonline</h2>
          <div className="mt-2 w-full bg-gray-200 h-2">
            <div className="bg-[#d97706] h-2 w-[10%]"></div>
          </div>
          <span className="text-xs text-gray-500 font-medium">Research Completion: 10%</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Structure</span>
          {chapters.map((ch, idx) => (
            <button
              key={idx}
              className="text-left p-2 border border-transparent hover:border-gray-300 hover:bg-white text-sm flex items-center justify-between group transition-all"
            >
              <span className="truncate">{ch.name}</span>
              {ch.free ? (
                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 font-bold">FREE</span>
              ) : (
                <span className="text-xs opacity-40 group-hover:opacity-100 transition-opacity">🔒</span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-300 pt-4 flex flex-col gap-2">
          <button className="w-full border border-gray-400 p-2 text-xs font-bold text-center hover:bg-gray-100">
            Originality Center
          </button>
          <button className="w-full border border-gray-400 p-2 text-xs font-bold text-center hover:bg-gray-100">
            Data Collector
          </button>
        </div>
      </aside>

      {/* RIGHT WORKSPACE: Content Canvas */}
      <main className="flex-1 overflow-y-auto bg-white p-8">
        {children}
      </main>
    </div>
  );
}
