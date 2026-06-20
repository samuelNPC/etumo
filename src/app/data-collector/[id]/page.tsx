"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

interface InstrumentData {
  userId: string;
  questionCount: number;
  sectionCount: number;
  previewText: string;
  status: string;
}

interface ResponseData {
  id: string;
  submittedAt: string;
  answers: { [key: number]: string };
}

export default function AnalyticsDashboard({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  const [instrument, setInstrument] = useState<InstrumentData | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "responses" | "ai_insights">("overview");
  const [isExporting, setIsExporting] = useState(false);

  // 🚨 NEW STATE FOR AI SUMMARY
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Authenticate user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login?redirect=/data-collector/" + params.id);
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [params.id, router]);

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const docRef = doc(db, "instruments", params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Instrument not found.");
          setLoading(false);
          return;
        }

        const data = docSnap.data() as InstrumentData;
        if (data.userId !== user.uid) {
          setError("Unauthorized: You do not own this research instrument.");
          setLoading(false);
          return;
        }

        setInstrument(data);

        const q = query(
          collection(db, "responses"), 
          where("instrumentId", "==", params.id)
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedResponses: ResponseData[] = [];
        querySnapshot.forEach((doc) => {
          const respData = doc.data();
          fetchedResponses.push({
            id: doc.id,
            submittedAt: respData.submittedAt || new Date().toISOString(),
            answers: respData.answers || {}
          });
        });

        fetchedResponses.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setResponses(fetchedResponses);

      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, params.id]);

  const handleExportExcel = async () => {
    if (!instrument || responses.length === 0) return;
    setIsExporting(true);

    try {
      const headers = ["Respondent ID", "Date Submitted"];
      for (let i = 1; i <= instrument.questionCount; i++) {
        headers.push(`Question ${i}`);
      }

      const data = [headers];
      responses.forEach((r, index) => {
        const rowData = [
          `Respondent_${responses.length - index}`,
          new Date(r.submittedAt).toLocaleDateString()
        ];
        for (let i = 1; i <= instrument.questionCount; i++) {
          rowData.push(r.answers[i] || ""); 
        }
        data.push(rowData);
      });

      const XLSX = await import("xlsx");
      
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Survey Responses");

      XLSX.writeFile(wb, `Etomu_Data_${params.id}.xlsx`);
    } catch (err) {
      alert("Failed to export Excel file.");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // 🚨 NEW HANDLER TO TRIGGER THE AI API
  const handleGenerateSummary = async () => {
    if (!instrument || responses.length === 0) return;
    setIsGeneratingSummary(true);
    setAiSummary(null);

    try {
      const res = await fetch("/api/summarize-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          questionCount: instrument.questionCount
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAiSummary(data.summary);
    } catch (err: any) {
      alert(err.message || "Failed to generate AI insights.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#d97706] rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-widest text-gray-500 animate-pulse">Decrypting Database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 border border-red-200 rounded-xl shadow-sm text-center max-w-md w-full">
          <span className="text-4xl mb-4 block text-red-500">🔒</span>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link href="/dashboard" className="bg-black text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 p-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">Instrument Analytics</h1>
            <p className="text-xs text-gray-500 mt-1 font-mono">ID: {params.id}</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`https://etomu.com/collect/${params.id}`);
                alert("Collection link copied to clipboard!");
              }}
              className="flex-1 sm:flex-none bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm"
            >
              Copy Link
            </button>
            <button 
              onClick={handleExportExcel}
              disabled={responses.length === 0 || isExporting}
              className="flex-1 sm:flex-none bg-[#d97706] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                "Export Excel \u2193"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Responses</span>
            <span className="text-4xl font-black text-[#d97706]">{responses.length}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Questions Tracked</span>
            <span className="text-4xl font-black text-gray-900">{instrument?.questionCount}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status</span>
            <span className="text-2xl font-black text-green-600 mt-2 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              Accepting Data
            </span>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`flex-none px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === "overview" ? "bg-white text-[#d97706] border-b-2 border-[#d97706]" : "text-gray-500 hover:bg-gray-100"}`}
            >
              Live Feed
            </button>
            <button 
              onClick={() => setActiveTab("responses")}
              className={`flex-none px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === "responses" ? "bg-white text-[#d97706] border-b-2 border-[#d97706]" : "text-gray-500 hover:bg-gray-100"}`}
            >
              Data Grid View
            </button>
            {/* 🚨 NEW TAB BUTTON */}
            <button 
              onClick={() => setActiveTab("ai_insights")}
              className={`flex-none px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === "ai_insights" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              AI Insights (Chap 4)
            </button>
          </div>

          <div className="p-0">
            {responses.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No responses yet</h3>
                <p className="text-sm text-gray-500 max-w-sm">Share your public collection link with your target audience to start gathering data.</p>
              </div>
            ) : (
              <>
                {/* TAB 1: Live Feed */}
                {activeTab === "overview" && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {responses.map((resp, idx) => (
                      <div key={resp.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                          <span className="font-bold text-gray-900">Respondent #{responses.length - idx}</span>
                          <span className="text-xs text-gray-500 font-mono">{new Date(resp.submittedAt).toLocaleString()}</span>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                          {Object.entries(resp.answers).map(([qNum, answer]) => (
                            <div key={qNum}>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Question {qNum}</span>
                              <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border border-gray-100">{answer as string}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 2: Data Grid */}
                {activeTab === "responses" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap border-r border-gray-200">ID</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap border-r border-gray-200">Date</th>
                          {Array.from({ length: instrument?.questionCount || 0 }).map((_, i) => (
                            <th key={i} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap border-r border-gray-200">Q{i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {responses.map((resp, idx) => (
                          <tr key={resp.id} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors">
                            <td className="p-4 text-sm font-bold text-gray-900 border-r border-gray-100 whitespace-nowrap">#{responses.length - idx}</td>
                            <td className="p-4 text-xs text-gray-500 border-r border-gray-100 whitespace-nowrap">{new Date(resp.submittedAt).toLocaleDateString()}</td>
                            {Array.from({ length: instrument?.questionCount || 0 }).map((_, i) => (
                              <td key={i} className="p-4 text-sm text-gray-700 border-r border-gray-100 min-w-[200px] max-w-[300px] truncate">
                                {resp.answers[i + 1] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 🚨 TAB 3: AI INSIGHTS */}
                {activeTab === "ai_insights" && (
                  <div className="p-6 sm:p-10 bg-blue-50/30">
                    {!aiSummary && !isGeneratingSummary && (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Automate Chapter 4</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm">
                          Let the Etomu Engine analyze your {responses.length} responses. It will identify trends, percentages, and write a structured draft of your Data Presentation chapter.
                        </p>
                        <button 
                          onClick={handleGenerateSummary}
                          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-md"
                        >
                          Generate AI Analysis
                        </button>
                      </div>
                    )}

                    {isGeneratingSummary && (
                      <div className="text-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 animate-pulse">Running Data Analysis...</p>
                        <p className="text-xs text-gray-500 mt-2">This may take up to 30 seconds depending on data size.</p>
                      </div>
                    )}

                    {aiSummary && (
                      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-10 relative">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(aiSummary);
                            alert("Analysis copied to clipboard!");
                          }}
                          className="absolute top-6 right-6 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                        >
                          Copy Text
                        </button>
                        
                        <div className="prose prose-blue max-w-none font-serif leading-relaxed text-gray-800 whitespace-pre-wrap mt-8">
                          {/* Basic markdown parsing to handle headers generated by Gemini */}
                          {aiSummary.split('\n').map((line, idx) => {
                            if (line.startsWith('### ')) return <h3 key={idx} className="text-lg font-bold text-gray-900 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                            if (line.startsWith('## ')) return <h2 key={idx} className="text-xl font-black text-gray-900 mt-8 mb-4">{line.replace('## ', '')}</h2>;
                            if (line.startsWith('# ')) return <h1 key={idx} className="text-2xl font-black text-blue-900 mt-8 mb-4">{line.replace('# ', '')}</h1>;
                            if (line.startsWith('**') && line.endsWith('**')) return <p key={idx} className="font-bold text-gray-900 mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>;
                            if (line.startsWith('- ')) return <li key={idx} className="ml-4 mb-2">{line.replace('- ', '').replace(/\*\*/g, '')}</li>;
                            if (line.trim() === '') return <br key={idx} />;
                            return <p key={idx} className="mb-4">{line.replace(/\*\*/g, '')}</p>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
