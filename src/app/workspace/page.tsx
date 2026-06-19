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

const generationQuotes = [
  "Synthesizing academic literature...",
  "Structuring conceptual frameworks...",
  "Aligning with faculty guidelines...",
  "Formulating research objectives...",
  "Chaining memory from previous chapters...",
  "Applying critical analysis...",
  "Drafting final paragraphs..."
];

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("id");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  
  // Preview State: Can be a chapter key, or "FULL_DOCUMENT"
  const [previewChapter, setPreviewChapter] = useState<string | null>(null);

  const [lockedPopup, setLockedPopup] = useState<boolean>(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generatingKey) {
      interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % generationQuotes.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [generatingKey]);

  const handleGuidelinesComplete = async () => {
    if (!projectId) return;
    const docRef = doc(db, "projects", projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) setProject(docSnap.data() as ProjectData);
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

  // 🚨 STITCH FULL DOCUMENT CONTENT FOR PREVIEW
  const fullDocumentContent = currentStructure
    .filter(c => c.key !== "guidelines" && project?.content[c.key])
    .map(c => `### ${c.label.toUpperCase()}\n\n${project?.content[c.key]}`)
    .join("\n\n\n[PAGE BREAK]\n\n\n");

  const handleGenerateChapter = async (chapterKey: string) => {
    if (!projectId) return;
    setGeneratingKey(chapterKey);
    setQuoteIndex(0); 

    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterKey }),
      });

      const data = await res.json();
      if (data.chapterContent) {
        const cleanContent = data.chapterContent.replace(/\*/g, "");

        setProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            progress: Math.min(prev.progress + 15, 100),
            content: { ...prev.content, [chapterKey]: cleanContent },
          };
        });
        setPreviewChapter(chapterKey);
      } else {
        alert(data.error || "Failed to generate chapter.");
      }
    } catch (err) {
      alert("Error processing generation pipeline.");
    } finally {
      setGeneratingKey(null);
    }
  };

  // 🚨 DYNAMIC PRICING FOR SINGLE DOWNLOADS
  const handleDownloadSingle = async (chapterKey: string) => {
    if (!projectId) return;
    
    // Preliminary pages are 5k, regular chapters are 10k
    const isPrelim = chapterKey.toLowerCase().includes("preliminary");
    const price = isPrelim ? "5,000" : "10,000";
    const documentType = isPrelim ? "Preliminary Pages" : "Chapter";

    const isPaid = window.confirm(`Redirecting to Mobile Money checkout for ${price} UGX to unlock this ${documentType}. Click OK to simulate successful payment.`);
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
      alert("Error downloading document.");
    }
  };

  // 🚨 PRICING FOR FULL DOCUMENT
  const handleDownloadFullDocument = async () => {
    if (!projectId) return;
    const isPaid = window.confirm(`Redirecting to Mobile Money checkout for 50,000 UGX to unlock your fully compiled Research Project. Click OK to simulate successful payment.`);
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
      alert("Error compiling full document.");
    }
  };

  const closePreview = () => {
    setPreviewChapter(null);
    setShowFeedbackPanel(false);
    setFeedbackText("");
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute w-full h-full border-4 border-gray-200 rounded-full"></div>
          <div className="absolute w-full h-full border-4 border-[#d97706] border-t-transparent rounded-full animate-spin"></div>
          <span className="font-extrabold text-[#d97706] text-2xl absolute">E</span>
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

        {setupError && <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-red-700 text-sm font-bold shadow-sm rounded-r-lg">⚠️ {setupError}</div>}

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

      {lockedPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Section Locked</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              You must generate the previous sections sequentially to unlock this chapter. The Etumo Engine requires earlier context to maintain academic flow.
            </p>
            <button onClick={() => setLockedPopup(false)} className="w-full bg-black text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-md">
              I Understand
            </button>
          </div>
        </div>
      )}

      <div className="mb-10">
        <div className="text-center mb-4">
          <span className="text-xs font-mono uppercase text-[#d97706] tracking-widest font-bold">
            {project.course || "Research"} Workspace
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug text-left">
          {project.topic}
        </h1>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-8 flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-bold">i</div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">How this works</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Follow the steps below sequentially. You must complete a section before the next one unlocks. The AI will learn your university's format and chain the context of previous chapters to ensure perfect academic flow.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project Completion</span>
          <span className="text-xl font-black text-gray-900">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <div className="bg-[#d97706] h-full transition-all duration-1000 ease-out" style={{ width: `${project.progress}%` }}></div>
        </div>
      </div>

      <div className="space-y-4">
        {currentStructure.map((chapter, index) => {
          const isGenerated = generatedChapters.includes(chapter.key);
          const isGuidelinesStep = chapter.key === "guidelines";

          let isLocked = false;
          if (!isGuidelinesUploaded && !isGuidelinesStep) {
            isLocked = true;
          } else if (!isGenerated && firstUngeneratedIndex !== -1 && index > firstUngeneratedIndex) {
            isLocked = true;
          }

          const isNextUp = !isGenerated && !isLocked && !isGuidelinesStep;

          let bgClass = 'bg-gray-50 border-gray-200 opacity-80';
          if ((isGuidelinesStep && isGuidelinesUploaded) || (isGenerated && !isGuidelinesStep)) {
            bgClass = 'bg-green-50 border-green-200';
          } else if (isNextUp || (isGuidelinesStep && !isGuidelinesUploaded)) {
            bgClass = 'bg-orange-50 border-orange-300 shadow-md ring-1 ring-orange-500/20';
          }

          const isCurrentlyGenerating = generatingKey === chapter.key;

          return (
            <div key={chapter.key} className={`border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${bgClass}`}>
              <div 
                className={`p-5 sm:p-6 flex flex-col sm:flex-row justify-between gap-4 ${isLocked ? 'cursor-not-allowed' : ''}`}
                onClick={() => { if (isLocked) setLockedPopup(true); }}
              >
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`font-bold sm:text-lg tracking-tight ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                      {chapter.label}
                    </h3>
                    {((isGuidelinesStep && isGuidelinesUploaded) || (isGenerated && !isGuidelinesStep)) && (
                      <span className="bg-green-200 text-green-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">DONE</span>
                    )}
                    {isLocked && (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {isGuidelinesStep ? "Configures AI formatting" : "Academic drafting phase"}
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-start sm:justify-end mt-2 sm:mt-0">
                  {isGuidelinesStep ? (
                    isGuidelinesUploaded ? (
                      <span className="text-xs font-bold text-green-600 border border-green-200 bg-white px-3 py-2 rounded-lg">Learned ✓</span>
                    ) : (
                      <GuidelineUploader projectId={projectId as string} onComplete={handleGuidelinesComplete} />
                    )
                  ) : isGenerated ? (
                    <button 
                      onClick={() => setPreviewChapter(chapter.key)}
                      className="bg-white text-gray-800 hover:bg-gray-100 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border border-gray-300 shadow-sm"
                    >
                      Preview
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleGenerateChapter(chapter.key)}
                      disabled={isLocked || generatingKey !== null}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border ${
                        isLocked 
                          ? 'bg-transparent text-gray-400 border-gray-300' 
                          : 'bg-[#d97706] text-white hover:bg-[#b45309] border-[#d97706] shadow-sm'
                      }`}
                    >
                      {isCurrentlyGenerating ? "Drafting..." : "Generate"}
                    </button>
                  )}
                </div>
              </div>

              {isCurrentlyGenerating && (
                <div className="bg-orange-100/50 border-t border-orange-200 px-6 py-3 flex items-center gap-3 animate-in fade-in duration-300">
                  <div className="w-4 h-4 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-xs font-mono text-[#d97706] uppercase tracking-widest animate-pulse font-bold">
                    {generationQuotes[quoteIndex]}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-white border border-gray-200 p-8 rounded-2xl text-center shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-2">Complete Research Compilation</h3>
        <p className="text-gray-600 text-sm mb-6 max-w-lg mx-auto">
          Preview or export all generated chapters into a single, cohesive Microsoft Word document, ready for supervisor review.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => setPreviewChapter("FULL_DOCUMENT")}
            disabled={generatedChapters.length === 0}
            className="bg-white text-gray-900 border-2 border-black font-extrabold px-8 py-4 rounded-xl uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview Full Document
          </button>
          <button 
            onClick={handleDownloadFullDocument}
            disabled={generatedChapters.length === 0}
            className="bg-black text-white font-extrabold px-8 py-4 rounded-xl uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:hover:-translate-y-0 disabled:cursor-not-allowed"
          >
            Download (50,000 UGX)
          </button>
        </div>
      </div>

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

      {/* EDGE-TO-EDGE PREVIEW POPUP MODAL */}
      {previewChapter && (previewChapter === "FULL_DOCUMENT" ? fullDocumentContent : project.content[previewChapter]) && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">

          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 shrink-0 shadow-sm z-10">
            <button 
              onClick={() => previewChapter === "FULL_DOCUMENT" ? handleDownloadFullDocument() : handleDownloadSingle(previewChapter)}
              className="bg-[#d97706] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors shadow-sm"
            >
              Export to DOCX &darr;
            </button>

            <button 
              onClick={closePreview}
              className="text-xs font-bold text-gray-500 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-2 px-2 py-2"
            >
              Close Preview ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-100">
            <div className="max-w-4xl mx-auto w-full min-h-full flex flex-col shadow-2xl my-8">

              <div className="flex-1 p-0">
                <LockedDocumentViewer content={previewChapter === "FULL_DOCUMENT" ? fullDocumentContent : project.content[previewChapter]} />
              </div>

              {/* Only show Supervisor corrections on individual chapters, not full doc preview */}
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
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                            2 Free Edits / Topic
                          </span>
                        </div>

                        <textarea
                          className="w-full border border-gray-200 p-4 bg-gray-50 outline-none text-sm rounded-xl focus:border-black resize-y min-h-[120px]"
                          placeholder="Type supervisor's comments here..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                        />

                        <div className="flex flex-col sm:flex-row gap-3 mt-2">
                          <button disabled={applyingCorrection || !feedbackText} className="flex-1 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-lg shadow-sm">
                            {applyingCorrection ? "Rewriting Chapter..." : "Apply Corrections (Free)"}
                          </button>
                          <button onClick={() => setShowFeedbackPanel(false)} className="w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors rounded-lg shadow-sm">
                            Cancel
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">Subsequent edits are 5,000 UGX</p>
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
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm text-center mt-10 animate-pulse">Loading Workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}