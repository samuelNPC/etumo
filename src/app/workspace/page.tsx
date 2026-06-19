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
  content: { [key: string]: any[] }; // 🚨 NOW AN ARRAY OF BLOCKS
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

  // 🚨 STITCH ARRAYS TOGETHER FOR FULL DOCUMENT
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

  const closePreview = () => setPreviewChapter(null);

  if (loading) return <div className="h-[80vh] flex flex-col items-center justify-center"><div className="w-20 h-20 border-4 border-[#d97706] border-t-transparent rounded-full animate-spin"></div><p className="mt-4 font-mono text-xs uppercase tracking-widest text-gray-500">Initializing Workspace</p></div>;
  if (!projectId) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 mt-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Get Started</h1>
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
      <div className="mb-10 text-center sm:text-left"><span className="text-xs font-mono uppercase text-[#d97706] tracking-widest font-bold">{project.course || "Research"} Workspace</span><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">{project.topic}</h1></div>
      
      <div className="space-y-4">
        {currentStructure.map((chapter, index) => {
          const isGenerated = generatedChapters.includes(chapter.key);
          const isGuidelinesStep = chapter.key === "guidelines";
          let isLocked = false;
          if (!isGuidelinesUploaded && !isGuidelinesStep) isLocked = true;
          else if (!isGenerated && firstUngeneratedIndex !== -1 && index > firstUngeneratedIndex) isLocked = true;

          return (
            <div key={chapter.key} className="border rounded-2xl bg-white p-5 sm:p-6 flex flex-col sm:flex-row justify-between gap-4">
              <div><h3 className={`font-bold sm:text-lg tracking-tight ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>{chapter.label}</h3></div>
              <div className="shrink-0">
                {isGuidelinesStep ? (
                  isGuidelinesUploaded ? <span className="text-xs font-bold text-green-600">Learned ✓</span> : <GuidelineUploader projectId={projectId as string} onComplete={() => window.location.reload()} />
                ) : isGenerated ? (
                  <button onClick={() => setPreviewChapter(chapter.key)} className="bg-white text-gray-800 border border-gray-300 px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm">Preview</button>
                ) : (
                  <button onClick={() => handleGenerateChapter(chapter.key)} disabled={isLocked || generatingKey !== null} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border ${isLocked ? 'text-gray-400 border-gray-300' : 'bg-[#d97706] text-white'}`}>{generatingKey === chapter.key ? "Drafting..." : "Generate"}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-white border border-gray-200 p-8 rounded-2xl text-center shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-6">Complete Compilation</h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => setPreviewChapter("FULL_DOCUMENT")} disabled={generatedChapters.length === 0} className="border-2 border-black font-extrabold px-8 py-4 rounded-xl uppercase tracking-widest disabled:opacity-50">Preview Full Document</button>
          <button onClick={() => setPaymentState({ isActive: true, amount: 50000, description: "Unlock Export", onSuccess: () => { setPaymentState({ isActive: false, amount: 0, description: "", onSuccess: () => {} }); executeDownload(true, "full"); }})} disabled={generatedChapters.length === 0} className="bg-black text-white font-extrabold px-8 py-4 rounded-xl uppercase tracking-widest shadow-lg disabled:opacity-50">Download (50,000 UGX)</button>
        </div>
      </div>

      {previewChapter && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 shadow-sm z-10">
            <button onClick={() => executeDownload(previewChapter === "FULL_DOCUMENT", previewChapter)} className="bg-[#d97706] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm">Export to DOCX &darr;</button>
            <button onClick={closePreview} className="text-xs font-bold text-gray-500 uppercase tracking-widest">Close Preview ✕</button>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-100">
            <div className="max-w-4xl mx-auto w-full min-h-full flex flex-col shadow-2xl my-8">
              {/* 🚨 PASSES BLOCKS ARRAY INSTEAD OF STRING */}
              <LockedDocumentViewer blocks={previewChapter === "FULL_DOCUMENT" ? fullDocumentBlocks : project.content[previewChapter]} />
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
