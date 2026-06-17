"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface InstrumentData {
  questionCount: number;
  sectionCount: number;
  previewText: string;
}

interface ResponseData {
  id: string;
  submittedAt: string;
  answers: { [key: number]: string };
}

export default function AnalyticsDashboard({ params }: { params: { id: string } }) {
  const [instrument, setInstrument] = useState<InstrumentData | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch the Instrument Info
        const docRef = doc(db, "instruments", params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInstrument(docSnap.data() as InstrumentData);
        }

        // 2. Fetch all Responses linked to this Instrument
        const q = query(collection(db, "responses"), where("instrumentId", "==", params.id));
        const querySnapshot = await getDocs(q);
        
        const fetchedResponses: ResponseData[] = [];
        querySnapshot.forEach((doc) => {
          fetchedResponses.push({ id: doc.id, ...doc.data() } as ResponseData);
        });
        
        // Sort by newest first
        fetchedResponses.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setResponses(fetchedResponses);

      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [params.id]);

  const handleGenerateSummary = async () => {
    if (responses.length === 0) {
      alert("You need at least one response to generate an analysis.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/summarize-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          responses: responses.map(r => r.answers), 
          questionCount: instrument?.questionCount 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setAiSummary(data.summary);
    } catch (error: any) {
      alert(error.message || "Error generating insights.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (responses.length === 0) return;

    // Create CSV Headers (Response ID, Date, Q1, Q2, etc.)
    const headers = ["Response ID", "Submitted At"];
    for (let i = 1; i <= (instrument?.questionCount || 0); i++) {
      headers.push(`Question ${i}`);
    }

    // Create CSV Rows
    const rows = responses.map(r => {
      const rowData = [r.id, new Date(r.submittedAt).toLocaleString()];
      for (let i = 1; i <= (instrument?.questionCount || 0); i++) {
        // Wrap answers in quotes to prevent commas in text from breaking the CSV layout
        rowData.push(`"${(r.answers[i] || "").replace(/"/g, '""')}"`);
      }
      return rowData.join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `Etumo_Data_${params.id.substring(0, 6)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#d97706] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 animate-pulse">Loading Analytics Dashboard</p>
      </div>
    );
  }

  if (!instrument) return <div className="text-center p-20 font-bold">Dashboard not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 mt-4 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <Link href="/workspace" className="text-xs font-bold text-gray-400 hover:text-black mb-4 inline-block uppercase tracking-widest transition-colors">&larr; Back to Workspace</Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Data Analytics Hub</h1>
          <p className="text-gray-500 mt-2 text-sm">Monitor incoming responses and generate Chapter 4 insights automatically.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            disabled={responses.length === 0}
            className="bg-white border border-gray-300 text-gray-800 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
          >
            Export CSV
          </button>
          <button 
            onClick={() => window.open(`/collect/${params.id}`, '_blank')}
            className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            View Public Link
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Responses</p>
            <span className="text-4xl font-black text-gray-900">{responses.length}</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Questions Asked</p>
            <span className="text-4xl font-black text-gray-900">{instrument.questionCount}</span>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-[#d97706] rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#d97706] to-[#b45309] p-6 rounded-2xl shadow-md text-white flex flex-col justify-center items-start relative overflow-hidden group">
          <div className="relative z-10 w-full">
            <p className="text-[10px] font-bold text-orange-200 uppercase tracking-widest mb-2">Automated Analysis</p>
            <button 
              onClick={handleGenerateSummary}
              disabled={isGenerating || responses.length === 0}
              className="w-full bg-white text-[#d97706] py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-orange-50 disabled:opacity-90 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isGenerating ? "Analyzing Patterns..." : "Generate Chapter 4 Summary"}
            </button>
          </div>
          <svg className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white opacity-10 transform group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        </div>
      </div>

      {/* AI SUMMARY PANEL */}
      {aiSummary && (
        <div className="bg-white border-2 border-orange-200 rounded-2xl shadow-sm mb-10 overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="bg-orange-50 border-b border-orange-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <h3 className="font-bold text-orange-900 uppercase tracking-widest text-sm">AI Data Insights</h3>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(aiSummary)}
              className="text-xs font-bold text-orange-700 bg-white border border-orange-200 px-3 py-1.5 rounded hover:bg-orange-100 transition-colors"
            >
              Copy Text
            </button>
          </div>
          <div className="p-6 sm:p-8">
            <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">
              {aiSummary}
            </div>
          </div>
        </div>
      )}

      {/* RAW DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm">Raw Submissions</h3>
        </div>
        
        {responses.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm font-medium">
            No responses collected yet. Share your link to start gathering data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Response ID</th>
                  {Array.from({ length: Math.min(instrument.questionCount, 3) }).map((_, idx) => (
                    <th key={idx} className="px-6 py-4 font-bold">Question {idx + 1}</th>
                  ))}
                  {instrument.questionCount > 3 && <th className="px-6 py-4 font-bold">...</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {responses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{new Date(response.submittedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{response.id.substring(0, 8)}...</td>
                    {Array.from({ length: Math.min(instrument.questionCount, 3) }).map((_, idx) => (
                      <td key={idx} className="px-6 py-4 truncate max-w-[200px]">
                        {response.answers[idx + 1] || "-"}
                      </td>
                    ))}
                    {instrument.questionCount > 3 && <td className="px-6 py-4 text-gray-400">View in CSV</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
