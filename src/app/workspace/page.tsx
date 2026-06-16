"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import LockedDocumentViewer from "@/components/LockedDocumentViewer";
import GuidelineUploader from "@/components/GuidelineUploader";

interface ChapterStructure {
  key: string;
  label: string;
}

interface ProjectData {
  topic: string;
  course: string;
  faculty: string;
  progress: number;
  guidelines?: {
    isCustomized: boolean;
    formattingRules: string;
    structure: ChapterStructure[];
  };
  content: {
    [key: string]: string;
  };
}

const defaultStructure: ChapterStructure[] = [
  { key: "guidelines", label: "1. Faculty Guidelines" },
  { key: "preliminaryPages", label: "2. Preliminary Pages" },
  { key: "chapter1", label: "3. Introduction" },
  { key: "chapter2", label: "4. Literature Review" },
  { key: "chapter3", label: "5. Methodology" },
  { key: "chapter4", label: "6. Data Presentation" },
  { key: "chapter5", label: "7. Conclusion" },
];

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("id");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  
  // Controls which chapter is currently open in the POPUP Modal
  const [previewChapter, setPreviewChapter] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [course, setCourse] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject(docSnap.data() as ProjectData);
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGuidelinesComplete = async () => {
    if (!projectId) return;
    const docRef = doc(db, "projects", projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setProject(docSnap.data() as ProjectData);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;
    setSetupLoading(true);
    setSetupError(null);

    try {
      const docRef = await addDoc(collection(db, "projects"), {
        topic: customTopic.trim(),
        course: course || "General",
        faculty: "General",
        progress: 10,
        content: {},
        userId: auth.currentUser?.uid || "anonymous", 
        createdAt: new Date().toISOString(),
      });
      router.push(`/workspace?id=${docRef.id}`);
    } catch (err) {
      setSetupError("Failed to initialize your workspace database.");
      setSetupLoading(false);
    }
  };

  const currentStructure = project?.guidelines?.isCustomized ? project.guidelines.structure : defaultStructure;
  const isGuidelinesUploaded = project?.guidelines?.isCustomized === true;
  const generatedChapters = Object.keys(project?.content || {});
  
  const firstUngeneratedIndex = currentStructure.findIndex(
    (c) => c.key !== "guidelines" && !generatedChapters.includes(c.key)
  );

  const handleGenerateChapter = async (chapterKey: string) => {
    if (!projectId) return;
    setGeneratingKey(chapterKey);

    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterKey }),
      });

      const data = await res.json();
      if (data.chapterContent) {
        setProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            progress: prev.progress + 15,
            content: {
              ...prev.content,
              [chapterKey]: data.chapterContent,
            },
          };
        });
        // Automatically open the popup preview for the newly generated chapter
        setPreviewChapter(chapterKey);
      } else {
        showToast(data.error || "Failed to generate chapter.");
      }
    } catch (err) {
      showToast("Error processing generation pipeline.");
    } finally {
      setGeneratingKey(null);
    }
  };

  const handleDownloadSingle = async (chapterKey: string) => {
    if (!projectId) return;
    const isPaid = window.confirm(`Unlock export for UGX 20,000 via Mobile Money?`);
    if (!isPaid) return;

    try {
      const res = await fetch("/api/compile-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterKey, structure: currentStructure }),
      });

      if (!res.ok) throw new Error("Export failed");
      const currentLabel = currentStructure.find(c => c.key === chapterKey)?.label || chapterKey;
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentLabel.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      showToast("Error downloading document.");
    }
  };

  const handleDownloadFullDocument = async () => {
    if (!projectId) return;
    const isPaid = window.confirm(`Unlock your fully compiled Research Project for UGX 50,000 via Mobile Money?`);
    if (!isPaid) return;

    try {
      const res = await fetch("/api/compile-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterKey: "full", isFullDocument: true, structure: currentStructure }),
      });

      if (!res.ok) throw new Error("Full export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.topic.substring(0, 30).replace(/\s+/g, "_")}_Complete_Research.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      showToast("Error compiling full document.");
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute w-full h-full border-4 border-gray-200 rounded-full"></div>
          <div className="absolute w-full h-full border-4 border-[#d97706] border-t-transparent rounded-full animate-spin"></div>
          <span className="font-extrabold text-[#d97706] text-2xl absolute">U</span>
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-gray-500 animate-pulse">Initializing Workspace</p>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-black mb-4 inline-block transition-colors">&larr; Back to Home</Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Get Started</h1>
          <p className="text-gray-500 mt-2">Enter your approved research topic below to initialize your workspace.</p>
        </div>

        {setupError && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-red-700 text-sm font-bold shadow-sm rounded-r-lg">⚠️ {setupError}</div>
        )}

        <form onSubmit={handleCreateProject} className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Approved Topic</label>
            <textarea
              placeholder="e.g., The Impact of Digital Procurement Systems on Local Government Performance..."
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none font-medium"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Course (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Bachelor of Business Administration"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-black transition-all font-medium"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>
          <button type="submit" disabled={setupLoading || !customTopic.trim()} className="mt-2 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 text-sm uppercase tracking-widest shadow-md">
            {setupLoading ? "Provisioning Database..." : "Initialize Workspace \u2192"}
          </button>
        </form>
      </div>
    );
  }

  if (!project) return <div className="p-8 font-mono text-sm text-center mt-10">Project data corrupted. Please create a new project.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 relative">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-black text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold tracking-wide animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2">
          <span>🔒</span> {toastMessage}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="text-center mb-10">
        <span className="text-xs font-mono uppercase text-[#d97706] tracking-widest font-bold border border-[#d97706]/30 bg-orange-50 px-3 py-1 rounded-full">
          {project.course || "Research"} Workspace
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mt-4 leading-snug">
          {project.topic}
        </h1>
      </div>

      {/* INSTRUCTIONS */}
      <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-8 flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-bold">i</div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">How this works</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Follow the steps below sequentially. You must complete a section before the next one unlocks. The AI will learn your university's format and chain the context of previous chapters to ensure perfect academic flow.
          </p>
        </div>
      </div>

      {/* INLINE PROGRESS BAR */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project Completion</span>
          <span className="text-xl font-black text-gray-900">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <div className="bg-[#d97706] h-full transition-all duration-1000 ease-out" style={{ width: `${project.progress}%` }}></div>
        </div>
      </div>

      {/* LINEAR STEP LIST */}
      <div className="space-y-4">
        {currentStructure.map((chapter, index) => {
          const isGenerated = generatedChapters.includes(chapter.key);
          
          let isLocked = false;
          if (!isGuidelinesUploaded && chapter.key !== "guidelines") {
            isLocked = true;
          } else if (!isGenerated && firstUngeneratedIndex !== -1 && index > firstUngeneratedIndex) {
            isLocked = true;
          }

          const isNextUp = !isGenerated && !isLocked && chapter.key !== "guidelines";

          return (
            <div key={chapter.key} className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isNextUp ? 'border-[#d97706] shadow-md ring-1 ring-[#d97706]/20' : isLocked ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200'}`}>
              
              <div 
                className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                onClick={() => { if (isLocked) showToast("You must generate the previous sections to unlock this."); }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    chapter.key === "guidelines" && isGuidelinesUploaded ? 'bg-green-100 border-green-200 text-green-700' :
                    isGenerated ? 'bg-green-100 border-green-200 text-green-700' :
                    isLocked ? 'bg-gray-100 border-gray-200 text-gray-400' :
                    'bg-orange-100 border-orange-200 text-[#d97706]'
                  }`}>
                    {chapter.key === "guidelines" && isGuidelinesUploaded ? '✓' : isGenerated ? '✓' : isLocked ? '🔒' : '•'}
                  </div>
                  
                  <div>
                    <h3 className={`font-bold sm:text-lg tracking-tight ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                      {chapter.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {chapter.key === "guidelines" ? "Configures AI formatting" : "Academic drafting phase"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {chapter.key === "guidelines" ? (
                    isGuidelinesUploaded ? (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">Uploaded & Learned</span>
                    ) : (
                      <GuidelineUploader projectId={projectId as string} onComplete={handleGuidelinesComplete} />
                    )
                  ) : isGenerated ? (
                    <button 
                      onClick={() => setPreviewChapter(chapter.key)}
                      className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border border-gray-200"
                    >
                      Preview
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleGenerateChapter(chapter.key)}
                      disabled={isLocked || generatingKey !== null}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border ${
                        isLocked 
                          ? 'bg-gray-100 text-gray-400 border-gray-200' 
                          : 'bg-[#d97706] text-white hover:bg-[#b45309] border-[#d97706] shadow-sm'
                      }`}
                    >
                      {generatingKey === chapter.key ? "Drafting..." : "Generate"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FINAL EXPORT SECTION */}
      {project.progress > 30 && (
        <div className="mt-12 bg-green-50 border border-green-200 p-8 rounded-2xl text-center">
          <h3 className="text-xl font-black text-green-900 mb-2">Ready for Submission?</h3>
          <p className="text-green-800 text-sm mb-6 max-w-lg mx-auto">
            Compile all your generated chapters into a single, perfectly formatted Microsoft Word document instantly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={handleDownloadFullDocument}
              className="bg-[#34A853] text-white font-extrabold px-8 py-4 rounded-xl uppercase tracking-widest hover:bg-green-600 transition-colors shadow-lg hover:-translate-y-1"
            >
              Compile Full Project
            </button>
          </div>
        </div>
      )}

      {/* NAVIGATION FOOTER */}
      <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/originality" className="text-center border border-gray-300 bg-white px-6 py-3 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition-colors">
          Open Originality Center
        </Link>
        <Link href="/data-collector" className="text-center border border-orange-200 bg-orange-50 px-6 py-3 rounded-xl text-xs font-bold text-[#d97706] uppercase tracking-widest hover:bg-orange-100 transition-colors">
          Open Data Collector &rarr;
        </Link>
      </div>

      {/* PREVIEW POPUP MODAL */}
      {previewChapter && project.content && project.content[previewChapter] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Dark overlay backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewChapter(null)}
          ></div>
          
          {/* Modal Container */}
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:px-6 sm:py-4 bg-gray-50 shrink-0">
              <button 
                onClick={() => handleDownloadSingle(previewChapter)}
                className="bg-black text-white px-4 py-2.5 sm:px-6 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-sm"
              >
                Download Section &darr;
              </button>
              
              <button 
                onClick={() => setPreviewChapter(null)}
                className="text-xs font-bold text-gray-500 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                Close Preview ✕
              </button>
            </div>
            
            {/* Modal Body (Scrollable Document) */}
            <div className="overflow-y-auto p-4 sm:p-8 bg-white flex-1">
              <div className="max-w-3xl mx-auto border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <LockedDocumentViewer content={project.content[previewChapter]} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm text-center mt-10 animate-pulse">Loading Workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
