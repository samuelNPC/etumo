"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
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
  const router = useRouter();

  const projectId = searchParams.get("id");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("guidelines");
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  const [course, setCourse] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const [showFeedbackPanel, setShowFeedbackPanel] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>("");
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
          const data = docSnap.data() as ProjectData;
          setProject(data);

          if (data.guidelines?.isCustomized && activeChapter === "guidelines") {
            const structure = data.guidelines.structure || defaultStructure;
            if (structure.length > 1) {
              setActiveChapter(structure[1].key); 
            }
          }
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleGuidelinesComplete = async () => {
    if (!projectId) return;
    const docRef = doc(db, "projects", projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const updatedProject = docSnap.data() as ProjectData;
      setProject(updatedProject);

      const structure = updatedProject.guidelines?.structure || defaultStructure;
      if (structure.length > 1) {
        setActiveChapter(structure[1].key);
      }
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
      console.error("Error creating project:", err);
      setSetupError("Failed to initialize your workspace database. Check connection.");
      setSetupLoading(false);
    }
  };

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

  const currentStructure = project?.guidelines?.isCustomized ? project.guidelines.structure : defaultStructure;

  const handleDownload = async () => {
    if (!projectId || !activeChapter) return;
    const isPaid = window.confirm(`Unlock export for UGX 20,000 via Mobile Money?`);
    if (!isPaid) return;

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterKey: activeChapter }),
      });

      if (!res.ok) throw new Error("Export failed");

      const currentLabel = currentStructure.find(c => c.key === activeChapter)?.label || activeChapter;
      const cleanFileName = currentLabel.replace(/\s+/g, "_");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cleanFileName}_formatted.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert("Error downloading document.");
    }
  };

  if (loading) return <div className="p-8 font-mono text-sm text-center mt-10">Synchronizing project workspace hooks...</div>;

  if (!projectId) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-black mb-4 inline-block transition-colors">&larr; Back to Home</Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Get Started</h1>
          <p className="text-gray-500 mt-2">
            Enter your approved research topic below to initialize your workspace.
          </p>
        </div>

        {setupError && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-red-700 text-sm font-bold shadow-sm rounded-r-lg">
            ⚠️ {setupError}
          </div>
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
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={setupLoading || !customTopic.trim()}
            className="mt-2 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-300 text-sm uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
          >
            {setupLoading ? "Provisioning Database..." : "Initialize Workspace \u2192"}
          </button>
        </form>
      </div>
    );
  }

  if (!project) return <div className="p-8 font-mono text-sm text-center mt-10">Project data corrupted. Please create a new project.</div>;

  const activeChapterLabel = currentStructure.find(c => c.key === activeChapter)?.label || activeChapter;
  const isGuidelinesUploaded = project?.guidelines?.isCustomized === true;

  return (
    // 🚨 Notice the wrapper here no longer has global px-4 padding on mobile!
    <div className="max-w-6xl mx-auto pb-12">
      
      {/* Header Section (Padding restored locally here) */}
      <div className="border-b border-gray-200 pb-4 mb-4 md:mb-6 pt-6 md:pt-8 px-4 md:px-8">
        <span className="text-xs font-mono uppercase text-[#d97706] tracking-wider font-bold">
          {project.course} Workspace
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mt-1 leading-tight">
          {project.topic}
        </h2>
      </div>

      <div className="flex flex-col md:flex-row md:gap-8 md:px-8">
        
        {/* Progress Menu Component */}
        <WorkspaceProgress 
          structure={currentStructure}
          activeChapter={activeChapter}
          setActiveChapter={setActiveChapter}
          guidelinesUploaded={isGuidelinesUploaded}
          progress={project.progress} 
          generatedChapters={Object.keys(project?.content || {})}
        />

        {/* Dynamic Content Area (Padding restored locally here) */}
        <div className="flex-1 w-full max-w-full overflow-hidden px-4 md:px-0 mt-6 md:mt-0">
          {activeChapter === "guidelines" ? (
            <div className="animate-in fade-in duration-300">
              {isGuidelinesUploaded ? (
                <div className="bg-green-50 border border-green-200 p-8 rounded-xl text-center shadow-sm">
                  <div className="w-16 h-16 bg-green-100 text-[#34A853] rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">Guidelines Configured Successfully!</h3>
                  <p className="text-green-800 text-sm mb-8 font-medium">Your workspace has been perfectly adapted to your university's exact formatting rules.</p>
                  <button 
                    onClick={() => setActiveChapter(currentStructure[1]?.key || "preliminaryPages")} 
                    className="bg-[#34A853] text-white font-bold py-3 px-8 rounded-xl hover:bg-green-600 transition-colors shadow-md"
                  >
                    Start Drafting Next Section &rarr;
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-orange-50 border border-orange-200 p-4 mb-6 rounded-xl">
                    <h3 className="font-bold text-orange-900 text-sm uppercase tracking-wider mb-1">Crucial First Step</h3>
                    <p className="text-orange-800 text-xs">Upload your university's research handbook or typing guidelines here. All subsequent chapters are strictly locked until the AI learns your exact formatting rules.</p>
                  </div>
                  <GuidelineUploader projectId={projectId as string} onComplete={handleGuidelinesComplete} />
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 p-4 rounded-xl shadow-sm gap-4">
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
                      className="w-full sm:w-auto bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-lg shadow-sm"
                    >
                      {generating ? "Chaining Memory..." : `Draft Section`}
                    </button>
                  ) : (
                    <button
                      onClick={handleDownload}
                      className="w-full sm:w-auto bg-[#d97706] text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors rounded-lg shadow-sm"
                    >
                      Download DOCX
                    </button>
                  )}
                </div>
              </div>

              <LockedDocumentViewer content={project.content ? project.content[activeChapter] : ""} />

              {project.content && project.content[activeChapter] && (
                <div className="border border-gray-200 rounded-xl bg-white p-4 sm:p-6 shadow-sm mt-2">
                  {!showFeedbackPanel ? (
                    <button
                      onClick={() => setShowFeedbackPanel(true)}
                      className="w-full bg-gray-50 text-gray-800 border border-gray-200 font-bold py-4 uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors rounded-lg"
                    >
                      + Add Supervisor Corrections
                    </button>
                  ) : (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
                      <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wider">Submit Supervisor Feedback</h4>
                      <textarea
                        className="w-full border border-gray-200 p-4 bg-gray-50 outline-none text-sm rounded-xl focus:border-black resize-y min-h-[100px]"
                        placeholder="Type supervisor's comments here..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button disabled={applyingCorrection || !feedbackText} className="flex-1 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-lg shadow-sm">
                          {applyingCorrection ? "Rewriting..." : "Apply Corrections"}
                        </button>
                        <button onClick={() => setShowFeedbackPanel(false)} className="w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors rounded-lg shadow-sm">
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
