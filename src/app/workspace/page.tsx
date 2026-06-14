"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import LockedDocumentViewer from "@/components/LockedDocumentViewer";
import GuidelineUploader from "@/components/GuidelineUploader";
import WorkspaceProgress from "@/components/WorkspaceProgress";

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
  const projectId = searchParams.get("id");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("guidelines");
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  const [showFeedbackPanel, setShowFeedbackPanel] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [feedbackImage, setFeedbackImage] = useState<File | null>(null);
  const [applyingCorrection, setApplyingCorrection] = useState<boolean>(false);

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

  const currentStructure = project?.guidelines?.isCustomized 
    ? project.guidelines.structure 
    : defaultStructure;

  const activeChapterLabel = currentStructure.find(c => c.key === activeChapter)?.label || activeChapter;
  
  // DETERMINE LOCK STATUS: Is the guideline uploaded?
  const isGuidelinesUploaded = project?.guidelines?.isCustomized === true;

  const handleGenerateChapter = async () => {
    if (!projectId || !activeChapter || activeChapter === "guidelines") return;
    setGenerating(true);

    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterKey: activeChapter }),
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
              [activeChapter]: data.chapterContent,
            },
          };
        });
      } else {
        alert(data.error || "Failed to generate chapter.");
      }
    } catch (err) {
      alert("Error processing progressive context generation pipeline.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!projectId || !activeChapter) return;
    const isPaid = window.confirm(`Unlock ${activeChapterLabel} export for UGX 20,000 via Mobile Money?`);
    if (!isPaid) return;
    
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterKey: activeChapter }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeChapter}_formatted.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert("Error downloading document.");
    }
  };

  // INTERCEPTOR: Clean error state if they visit /workspace without a topic ID
  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="border border-gray-300 bg-gray-50 p-8 max-w-md w-full shadow-sm text-center">
          <div className="w-12 h-12 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold mb-2 tracking-tight">Workspace Locked</h2>
          <p className="text-gray-500 text-sm mb-6">
            No active project detected. You need to select or create a research topic before accessing the workspace editor.
          </p>
          <Link href="/" className="bg-black text-white font-bold py-3 px-6 uppercase text-xs tracking-wider hover:bg-gray-800 transition-colors block w-full rounded-none">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-8 font-mono text-sm text-center mt-10">Synchronizing project workspace hooks...</div>;
  if (!project) return <div className="p-8 font-mono text-sm text-center mt-10">Project data corrupted. Please create a new project.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      
      {/* Header Section */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <span className="text-xs font-mono uppercase text-[#d97706] tracking-wider font-bold">
          {project.course} Workspace
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mt-1 leading-tight">
          {project.topic}
        </h2>
      </div>

      {/* TWO-COLUMN LAYOUT ON DESKTOP, STACKED ON MOBILE */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* The updated Progress Menu Component */}
        <WorkspaceProgress 
          structure={currentStructure}
          activeChapter={activeChapter}
          setActiveChapter={setActiveChapter}
          guidelinesUploaded={isGuidelinesUploaded}
          progress={project.progress} // <--- Added progress prop here
        />

        {/* DYNAMIC CONTENT AREA */}
        <div className="flex-1 w-full max-w-full overflow-hidden">
          {activeChapter === "guidelines" ? (
            <div className="animate-in fade-in duration-300">
              <div className="bg-orange-50 border border-orange-200 p-4 mb-6">
                <h3 className="font-bold text-orange-900 text-sm uppercase tracking-wider mb-1">Crucial First Step</h3>
                <p className="text-orange-800 text-xs">Upload your university's research handbook or typing guidelines here. All subsequent chapters are strictly locked until the AI learns your exact formatting rules.</p>
              </div>
              <GuidelineUploader 
                projectId={projectId as string} 
                onComplete={() => window.location.reload()} 
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 border border-gray-300 p-4 gap-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wider">Viewing: {activeChapterLabel}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {project.content && project.content[activeChapter] 
                      ? "Content loaded from persistent project memory." 
                      : "No draft detected in your current workspace database node."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {(!project.content || !project.content[activeChapter]) ? (
                    <button
                      onClick={handleGenerateChapter}
                      disabled={generating}
                      className="w-full sm:w-auto bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-none"
                    >
                      {generating ? "Chaining Memory..." : `Draft Section`}
                    </button>
                  ) : (
                    <button
                      onClick={handleDownload}
                      className="w-full sm:w-auto bg-[#d97706] text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors rounded-none"
                    >
                      Download DOCX
                    </button>
                  )}
                </div>
              </div>

              <LockedDocumentViewer content={project.content ? project.content[activeChapter] : ""} />

              {/* SUPERVISOR FEEDBACK PANEL */}
              {project.content && project.content[activeChapter] && (
                <div className="border border-gray-300 bg-white p-4 sm:p-6 shadow-sm mt-2">
                  {!showFeedbackPanel ? (
                    <button
                      onClick={() => setShowFeedbackPanel(true)}
                      className="w-full bg-gray-50 text-gray-800 border border-gray-300 font-bold py-4 uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors rounded-none"
                    >
                      + Add Supervisor Corrections
                    </button>
                  ) : (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
                      <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wider">Submit Supervisor Feedback</h4>
                      <textarea
                        className="w-full border border-gray-300 p-4 bg-gray-50 outline-none text-sm rounded-none focus:border-black resize-y min-h-[100px]"
                        placeholder="Type supervisor's comments here... (e.g., 'Expand on the background of the study')"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button
                          onClick={() => {}}
                          disabled={applyingCorrection || !feedbackText}
                          className="flex-1 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-none"
                        >
                          {applyingCorrection ? "Rewriting..." : "Apply Corrections"}
                        </button>
                        <button
                          onClick={() => setShowFeedbackPanel(false)}
                          className="w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors rounded-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm text-center mt-10">Initializing workspace engine...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
