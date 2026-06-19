"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, setDoc } from "firebase/firestore";
import LockedDocumentViewer from "@/components/LockedDocumentViewer";
import GuidelineUploader from "@/components/GuidelineUploader";
import PaymentModal from "@/components/PaymentModal";

interface ChapterStructure { key: string; label: string; }
interface ProjectData {
  topic: string; course: string; faculty: string; progress: number; freeEditsUsed?: number;
  guidelines?: { isCustomized: boolean; formattingRules: string; structure: ChapterStructure[]; };
  content: { [key: string]: any[] }; // 🚨 STRICT AST ARRAY STRUCTURE
}

const defaultStructure: ChapterStructure[] = [
  { key: "guidelines", label: "1. Faculty Guidelines" },
  { key: "preliminaryPages", label: "2. Preliminary Pages" },
  { key: "chapter1", label: "3. Introduction" },
  { key: "chapter2", label: "4. Literature Review" },
  { key: "chapter3", label: "5. Methodology" },
  { key: "chapter4", label: "6. Data Presentation" },
  { key: "chapter5", label: "7. Conclusion" },
  { key: "appendices", label: "8. Appendices (Instruments & Budget)" }, 
];

const generationQuotes = ["Synthesizing academic literature...", "Structuring conceptual frameworks...", "Aligning with faculty guidelines...", "Chaining memory from previous chapters..."];

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("id");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [previewChapter, setPreviewChapter] = useState<string | null>(null);
  const [trafficErrorLevel, setTrafficErrorLevel] = useState<0 | 1 | 2>(0);
  const [failedChapterKey, setFailedChapterKey] = useState<string | null>(null);
  const [lockedPopup, setLockedPopup] = useState<boolean>(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [course, setCourse] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Supervisor Feedback States
  const [showFeedbackPanel, setShowFeedbackPanel] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [applyingCorrection, setApplyingCorrection] = useState<boolean>(false);

  const [paymentState, setPaymentState] = useState({ isActive: false, amount: 0, description: "", onSuccess: () => {} });

  useEffect(() => {
    if (!projectId) return setLoading(false);
    const fetchProject = async () => {
      try {
        const docSnap = await getDoc(doc(db, "projects", projectId));
        if (docSnap.exists()) setProject(docSnap.data() as ProjectData);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generatingKey) interval = setInterval(() => setQuoteIndex(p => (p + 1) % generationQuotes.length), 3000);
    return () => clearInterval(interval);
  }, [generatingKey]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;
    setSetupLoading(true); setSetupError(null);
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        topic: customTopic.trim(), course: course || "General", faculty: "General", progress: 10, freeEditsUsed: 0, content: {}, userId: auth.currentUser?.uid || "anonymous", createdAt: new Date().toISOString(),
      });
      router.push(`/workspace?id=${docRef.id}`);
    } catch (err) { setSetupError("Failed to initialize database."); setSetupLoading(false); }
  };

  const currentStructure = project?.guidelines?.isCustomized ? project.guidelines.structure : defaultStructure;
  const isGuidelinesUploaded = project?.guidelines?.isCustomized === true;
  const generatedChapters = Object.keys(project?.content || {});

  const firstUngeneratedIndex = currentStructure.findIndex(c => c.key !== "guidelines" && !generatedChapters.includes(c.key));

  // 🚨 STITCH AST ARRAYS TOGETHER FOR FULL DOCUMENT
  let fullDocumentBlocks: any[] = [];
  currentStructure.filter(c => c.key !== "guidelines" && project?.content[c.key]).forEach((c, index) => {
      if (index > 0) fullDocumentBlocks.push({ type: 'page-break', text: '' });
      fullDocumentBlocks = fullDocumentBlocks.concat(project?.content[c.key] || []);
  });

  const handleGenerateChapter = async (chapterKey: string) => {
    if (!projectId) return;
    setGeneratingKey(chapterKey); setFailedChapterKey(null); setQuoteIndex(0); 

    try {
      const res = await fetch("/api/chapters", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, chapterKey }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503 || data.code === "HIGH_TRAFFIC") {
          setFailedChapterKey(chapterKey);
          if (trafficErrorLevel === 0) { setTrafficErrorLevel(1); throw new Error("TRAFFIC_STRIKE_1"); } 
          else { setTrafficErrorLevel(2); throw new Error("TRAFFIC_STRIKE_2"); }
        }
        throw new Error(data.error || "Failed to generate chapter.");
      }

      if (data.chapterContent) {
        setProject(prev => prev ? { ...prev, progress: Math.min(prev.progress + 15, 100), content: { ...prev.content, [chapterKey]: data.chapterContent } } : null);
        setTrafficErrorLevel(0); setFailedChapterKey(null); setPreviewChapter(chapterKey);
      }
    } catch (err: any) {
      if (!err.message.includes("TRAFFIC_STRIKE")) alert("Error: " + err.message);
    } finally { setGeneratingKey(null); }
  };

  const handleDownloadSingle = (chapterKey: string) => {
    if (!projectId) return;
    const isPrelim = chapterKey.toLowerCase().includes("preliminary");
    const price = isPrelim ? 5000 : 10000;
    const documentType = isPrelim ? "Preliminary Pages" : "Chapter";

    setPaymentState({
      isActive: true,
      amount: price,
      description: `Unlock ${documentType} Download`,
      onSuccess: () => {
        setPaymentState({ isActive: false, amount: 0, description: "", onSuccess: () => {} });
        executeDownload(false, chapterKey);
      }
    });
  };

  const handleDownloadFullDocument = () => {
    if (!projectId) return;
    setPaymentState({
      isActive: true,
      amount: 50000,
      description: "Unlock Complete Research Document",
      onSuccess: () => {
        setPaymentState({ isActive: false, amount: 0, description: "", onSuccess: () => {} });
        executeDownload(true, "full");
      }
    });
  };

  const executeDownload = async (isFull: boolean, chapterKey: string) => {
    try {
      const res = await fetch("/api/compile-document", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, chapterKey, isFullDocument: isFull, structure: currentStructure }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isFull ? `${project?.topic.substring(0, 30).replace(/\s+/g, "_")}_Complete.docx` : `${chapterKey}.docx`;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
    } catch (error) { alert("Error downloading document."); }
  };

  // Supervisor Feedback Logic
  const editsUsed = project?.freeEditsUsed || 0;
  const editsRemaining = Math.max(2 - editsUsed, 0);

  const handleApplyCorrection = () => {
    if (editsRemaining > 0) {
      executeCorrection(); 
    } else {
      setPaymentState({
        isActive: true,
        amount: 5000,
        description: "Unlock Supervisor Correction Rewrite",
        onSuccess: () => {
          setPaymentState({ isActive: false, amount: 0, description: "", onSuccess: () => {} });
          executeCorrection();
        }
      });
    }
  };

  const executeCorrection = async () => {
    if (!previewChapter || !projectId) return;
    setApplyingCorrection(true);

    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterKey: previewChapter, feedback: feedbackText }),
      });

      const data = await res.json();
      if (data.chapterContent) {
        // AST handles strings on the backend, we just accept the array
        const newEditsUsed = editsUsed + 1;

        setProject(prev => prev ? { 
          ...prev, 
          freeEditsUsed: newEditsUsed, 
          content: { ...prev.content, [previewChapter]: data.chapterContent } 
        } : null);

        await setDoc(doc(db, "projects", projectId), {
          [`content.${previewChapter}`]: data.chapterContent,
          freeEditsUsed: newEditsUsed
        }, { merge: true });

        setShowFeedbackPanel(false);
        setFeedbackText("");
      } else {
        alert(data.error || "Failed to apply corrections.");
      }
    } catch (error) {
      alert("Error rewriting document.");
    } finally {
      setApplyingCorrection(false);
    }
  };

  const closePreview = () => {
    setPreviewChapter(null);
    setShowFeedbackPanel(false);
    setFeedbackText("");
  };

  if (loading) return <div className="h-[80vh] flex flex-col items-center justify-center"><div className="w-20 h-20 border-4 border-[#d97706] border-t-transparent rounded-full animate-spin"></div><p className="mt-4 font-mono text-xs uppercase tracking-widest text-gray-500">Initializing Workspace</p></div>;
  
  if (!projectId) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 mt-8">
      <Link href="/" className="text-sm font-bold text-gray-500 hover:text-black mb-4 inline-block transition-colors">&larr; Back to Home</Link>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Get Started</h1>
      <p className="text-gray-500 mb-8">Enter your approved research topic below to initialize your workspace.</p>
      {setupError && <div className="mb-6 bg-red-50 p-4 text-red-700 text-sm font-bold shadow-sm">{setupError}</div>}
      <form onSubmit={handleCreateProject} className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-6">
        <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Approved Topic</label><textarea className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none font-medium" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} required /></div>
        <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Course (Optional)</label><input type="text" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none font-medium" value={course} onChange={(e) => setCourse(e.target.value)} /></div>
        <button type="submit" disabled={setupLoading || !customTopic.trim()} className="mt-2 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 text-sm uppercase tracking-widest shadow-md">{setupLoading ? "Provisioning Database..." : "Initialize Workspace \u2192"}</button>
      </form>
    </div>
  );

  if (!project) return <div className="p-8 font-mono text-sm text-center mt-10">Project data corrupted. Please create a new project.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 relative">
      {paymentState.isActive && <PaymentModal amount={paymentState.amount} description={paymentState.description} onSuccess={paymentState.onSuccess} onCancel={() => setPaymentState({ isActive: false, amount: 0, description: "", onSuccess: () => {} })} />}
      
      {lockedPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Section Locked</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">You must generate the previous sections sequentially to unlock this chapter.</p>
            <button onClick={() => setLockedPopup(false)} className="w-full bg-black text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-md">I Understand</button>
          </div>
        </div>
      )}

      <div className="mb-10 text-center sm:text-left"><span className="text-xs font-mono uppercase text-[#d97706] tracking-widest font-bold">{project.course || "Research"} Workspace</span><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">{project.topic}</h1></div>
      
      <div className="space-y-4">
        {currentStructure.map((chapter, index) => {
          const isGenerated = generatedChapters.includes(chapter.key);
          const isGuidelinesStep = chapter.key === "guidelines";
          let isLocked = false;
          if (!isGuidelinesUploaded && !isGuidelinesStep) isLocked = true;
          else if (!isGenerated && firstUngeneratedIndex !== -1 && index > firstUngeneratedIndex) isLocked = true;

          return (
            <div key={chapter.key} className={`border rounded-2xl bg-white flex flex-col sm:flex-row justify-between gap-4 ${isLocked ? 'p-5 sm:p-6 bg-gray-50 opacity-80 cursor-not-allowed' : 'p-5 sm:p-6'}`} onClick={() => { if (isLocked) setLockedPopup(true); }}>
              <div><h3 className={`font-bold sm:text-lg tracking-tight ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>{chapter.label}</h3></div>
              <div className="shrink-0 flex items-center justify-start sm:justify-end mt-2 sm:mt-0">
                {isGuidelinesStep ? (
                  isGuidelinesUploaded ? <span className="text-xs font-bold text-green-600">Learned ✓</span> : <GuidelineUploader projectId={projectId as string} onComplete={() => window.location.reload()} />
                ) : isGenerated ? (
                  <button onClick={() => setPreviewChapter(chapter.key)} className="bg-white text-gray-800 border border-gray-300 px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-gray-50">Preview</button>
                ) : (
                  <button onClick={() => handleGenerateChapter(chapter.key)} disabled={isLocked || generatingKey !== null} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border ${isLocked ? 'text-gray-400 border-gray-300 bg-transparent' : 'bg-[#d97706] text-white hover:bg-[#b45309]'}`}>{generatingKey === chapter.key ? "Drafting..." : "Generate"}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-white border border-gray-200 p-8 rounded-2xl text-center shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-6">Complete Compilation</h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => setPreviewChapter("FULL_DOCUMENT")} disabled={generatedChapters.length === 0} className="border-2 border-black font-extrabold px-8 py-4 rounded-xl uppercase tracking-widest disabled:opacity-50 hover:bg-gray-50 transition-colors">Preview Full Document</button>
          <button onClick={handleDownloadFullDocument} disabled={generatedChapters.length === 0} className="bg-black text-white font-extrabold px-8 py-4 rounded-xl uppercase tracking-widest shadow-lg disabled:opacity-50 hover:-translate-y-1 transition-transform">Download (50,000 UGX)</button>
        </div>
      </div>

      {/* Restored External Tool Links */}
      <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/originality" className="flex flex-col border border-yellow-300 bg-yellow-50 p-5 rounded-2xl hover:bg-yellow-100 transition-colors">
          <span className="text-sm font-bold text-yellow-900 uppercase tracking-widest mb-1">Originality Center</span>
          <span className="text-xs text-yellow-700 leading-relaxed">Remove similarity and AI percentages with ease.</span>
        </Link>
        <Link href="/data-collector" className="flex flex-col border border-orange-300 bg-orange-50 p-5 rounded-2xl hover:bg-orange-100 transition-colors">
          <span className="text-sm font-bold text-[#d97706] uppercase tracking-widest mb-1">Data Collector &rarr;</span>
          <span className="text-xs text-orange-700 leading-relaxed">Digitize research instruments and collect field responses.</span>
        </Link>
      </div>

      {previewChapter && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 shadow-sm z-10">
            <button onClick={() => previewChapter === "FULL_DOCUMENT" ? handleDownloadFullDocument() : handleDownloadSingle(previewChapter)} className="bg-[#d97706] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-[#b45309]">Export to DOCX &darr;</button>
            <button onClick={closePreview} className="text-xs font-bold text-gray-500 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-2 px-2 py-2">Close Preview ✕</button>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-100">
            <div className="max-w-4xl mx-auto w-full min-h-full flex flex-col shadow-2xl my-8">
              
              <div className="flex-1 p-0">
                {/* 🚨 PASSES BLOCKS ARRAY TO RENDERER */}
                <LockedDocumentViewer blocks={previewChapter === "FULL_DOCUMENT" ? fullDocumentBlocks : project.content[previewChapter]} />
              </div>

              {/* Restored Supervisor Feedback Box */}
              {previewChapter !== "FULL_DOCUMENT" && (
                <div className="border-t border-gray-200 bg-white p-6 sm:p-10">
                  <div className="max-w-3xl mx-auto">
                    {!showFeedbackPanel ? (
                      <button
                        onClick={() => setShowFeedbackPanel(true)}
                        className="w-full bg-white text-gray-800 border border-gray-300 font-bold py-5 uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors rounded-xl shadow-sm"
                      >
                        + Add Supervisor Corrections
                      </button>
                    ) : (
                      <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wider">Submit Supervisor Feedback</h4>
                            <p className="text-xs text-gray-500 mt-1">The AI will rewrite this chapter to reflect the feedback perfectly.</p>
                          </div>

                          <span className={`${editsRemaining > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200"} border text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest`}>
                            {editsRemaining > 0 ? `${editsRemaining} Free Edits Left` : "5,000 UGX / Edit"}
                          </span>
                        </div>

                        <textarea
                          className="w-full border border-gray-200 p-4 bg-gray-50 outline-none text-sm rounded-xl focus:border-black resize-y min-h-[120px]"
                          placeholder="Type supervisor's comments here..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                        />

                        <div className="flex flex-col sm:flex-row gap-3 mt-2">
                          <button 
                            onClick={handleApplyCorrection}
                            disabled={applyingCorrection || !feedbackText} 
                            className="flex-1 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-lg shadow-sm"
                          >
                            {applyingCorrection 
                              ? "Rewriting Chapter..." 
                              : editsRemaining > 0 
                                ? "Apply Corrections (Free)" 
                                : "Apply Corrections (5,000 UGX)"}
                          </button>
                          <button onClick={() => setShowFeedbackPanel(false)} className="w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors rounded-lg shadow-sm">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading Workspace...</div>}><WorkspaceContent /></Suspense>;
}
