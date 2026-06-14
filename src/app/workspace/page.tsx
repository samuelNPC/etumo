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
  const intent = searchParams.get("intent"); // "custom" or "generate"

  // --- WORKSPACE STATES ---
  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("guidelines");
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // --- SETUP WIZARD STATES ---
  const [course, setCourse] = useState("");
  const [interest, setInterest] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // --- FEEDBACK STATES ---
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

  // ==========================================
  // WIZARD LOGIC: Topic Generation & Creation
  // ==========================================
  const handleGenerateTopics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    setSetupError(null);
    setGeneratedTopics([]);

    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, faculty: "General", interest }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setSetupError(data.error || `Server Error: ${response.status}`);
      } else if (data.topics) {
        setGeneratedTopics(data.topics);
      }
    } catch (err: any) {
      setSetupError(err.message || "A critical network error occurred.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleCreateProject = async (selectedTopic: string) => {
    setSetupLoading(true);
    setSetupError(null);

    try {
      const docRef = await addDoc(collection(db, "projects"), {
        topic: selectedTopic || "Untitled Research",
        course: course || "General",
        faculty: "General",
        progress: 10,
        content: {},
        userId: auth.currentUser?.uid || "anonymous", 
        createdAt: new Date().toISOString(),
      });

      // Redirect to the newly created workspace
      router.push(`/workspace?id=${docRef.id}`);
    } catch (err) {
      console.error("Error creating project:", err);
      setSetupError("Failed to initialize your workspace database. Check connection.");
      setSetupLoading(false);
    }
  };


  // ==========================================
  // WORKSPACE LOGIC: Generation & Download
  // ==========================================
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
    const isPaid = window.confirm(`Unlock export for UGX 20,000 via Mobile Money?`);
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

  if (loading) return <div className="p-8 font-mono text-sm text-center mt-10">Synchronizing project workspace hooks...</div>;

  // ==========================================
  // RENDER: SETUP WIZARD (No Project ID, but has Intent)
  // ==========================================
  if (!projectId && intent) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="mb-8">
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-black mb-4 inline-block transition-colors">&larr; Back to Home</Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Workspace Setup</h1>
          <p className="text-gray-500 mt-2">
            {intent === "custom" ? "Define your approved research topic." : "Let's generate the perfect topic for your course."}
          </p>
        </div>

        {setupError && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-red-700 text-sm font-bold shadow-sm rounded-r-lg">
            ⚠️ {setupError}
          </div>
        )}

        {intent === "custom" && (
          <form 
            onSubmit={(e) => { e.preventDefault(); handleCreateProject(customTopic); }} 
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-6"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Approved Topic</label>
              <textarea
                placeholder="Paste your exact research topic here..."
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
                placeholder="e.g., Procurement, Computer Science"
                className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={setupLoading}
              className="mt-2 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-300 text-sm uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
            >
              {setupLoading ? "Provisioning Database..." : "Initialize Workspace \u2192"}
            </button>
          </form>
        )}

        {intent === "generate" && (
          <div className="flex flex-col gap-8">
            <form onSubmit={handleGenerateTopics} className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Course of Study</label>
                  <input
                    type="text"
                    placeholder="e.g., Business Administration"
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all font-medium"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Area of Interest</label>
                  <input
                    type="text"
                    placeholder="e.g., Digital Transformation"
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all font-medium"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={setupLoading}
                className="mt-2 bg-[#4285F4] text-white font-bold py-4 rounded-xl hover:bg-[#3367D6] transition-colors disabled:bg-blue-300 text-sm uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
              >
                {setupLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Scanning Matrix...
                  </>
                ) : (
                  "Generate Ideas"
                )}
              </button>
            </form>

            {generatedTopics.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 animate-in slide-in-from-bottom-4">
                <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-gray-400">Select an AI-Generated Topic:</h3>
                <ul className="flex flex-col gap-3">
                  {generatedTopics.map((topic, index) => (
                    <li key={index}>
                      <button 
                        onClick={() => handleCreateProject(topic)}
                        disabled={setupLoading}
                        className="w-full text-left border border-gray-200 p-5 rounded-xl hover:border-[#4285F4] hover:bg-blue-50 transition-all font-semibold text-gray-800 shadow-sm disabled:opacity-50 group flex justify-between items-center"
                      >
                        <span className="pr-4 leading-relaxed">{topic}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-[#4285F4] transition-opacity shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: ERROR FALLBACK (No Project ID, No Intent)
  // ==========================================
  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="border border-gray-300 bg-white p-8 max-w-md w-full shadow-xl rounded-2xl text-center">
          <div className="w-12 h-12 bg-red-50 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 font-bold text-xl">!</span>
          </div>
          <h2 className="text-xl font-bold mb-2 tracking-tight">Workspace Locked</h2>
          <p className="text-gray-500 text-sm mb-6">
            No active project detected. You need to select or create a research topic before accessing the workspace editor.
          </p>
          <Link href="/" className="bg-black text-white font-bold py-3 px-6 uppercase text-xs tracking-wider hover:bg-gray-800 transition-colors block w-full rounded-xl">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN WORKSPACE (Has Project ID)
  // ==========================================
  if (!project) return <div className="p-8 font-mono text-sm text-center mt-10">Project data corrupted. Please create a new project.</div>;

  const currentStructure = project?.guidelines?.isCustomized ? project.guidelines.structure : defaultStructure;
  const activeChapterLabel = currentStructure.find(c => c.key === activeChapter)?.label || activeChapter;
  const isGuidelinesUploaded = project?.guidelines?.isCustomized === true;

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

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Progress Menu Component */}
        <WorkspaceProgress 
          structure={currentStructure}
          activeChapter={activeChapter}
          setActiveChapter={setActiveChapter}
          guidelinesUploaded={isGuidelinesUploaded}
          progress={project.progress} 
        />

        {/* Dynamic Content Area */}
        <div className="flex-1 w-full max-w-full overflow-hidden">
          {activeChapter === "guidelines" ? (
            <div className="animate-in fade-in duration-300">
              <div className="bg-orange-50 border border-orange-200 p-4 mb-6 rounded-xl">
                <h3 className="font-bold text-orange-900 text-sm uppercase tracking-wider mb-1">Crucial First Step</h3>
                {/* TEXT UPDATED HERE TO REFLECT BROADER DOCUMENT ACCEPTANCE */}
                <p className="text-orange-800 text-xs">Upload your university's research handbook or typing guidelines here (PDF, Word Document, TXT, or Image). All subsequent chapters are strictly locked until the AI learns your exact formatting rules.</p>
              </div>
              <GuidelineUploader 
                projectId={projectId as string} 
                onComplete={() => window.location.reload()} 
              />
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

              {/* SUPERVISOR FEEDBACK PANEL */}
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
                        placeholder="Type supervisor's comments here... (e.g., 'Expand on the background of the study')"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button
                          onClick={() => {}}
                          disabled={applyingCorrection || !feedbackText}
                          className="flex-1 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-lg shadow-sm"
                        >
                          {applyingCorrection ? "Rewriting..." : "Apply Corrections"}
                        </button>
                        <button
                          onClick={() => setShowFeedbackPanel(false)}
                          className="w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors rounded-lg shadow-sm"
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
