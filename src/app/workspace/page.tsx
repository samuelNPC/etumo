"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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
  { key: "preliminaryPages", label: "Preliminary Pages" },
  { key: "chapter1", label: "Chapter 1: Introduction" },
  { key: "chapter2", label: "Chapter 2: Literature Review" },
  { key: "chapter3", label: "Chapter 3: Methodology" },
  { key: "chapter4", label: "Chapter 4: Data Presentation" },
  { key: "chapter5", label: "Chapter 5: Conclusion" },
];

export default function WorkspacePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");

  // Core Project State
  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("preliminaryPages");
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // Supervisor Correction State
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
        console.error("Failed to load project database state:", err);
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

  const handleGenerateChapter = async () => {
    if (!projectId || !activeChapter) return;
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

    // The UGX 20k per chapter structure. 5 Chapters = UGX 100k Total.
    const isPaid = window.confirm(
      `Unlock ${activeChapterLabel} export for UGX 20,000 via Mobile Money?`
    );
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

  const handleApplyFeedback = async () => {
    if (!projectId || !activeChapter) return;
    setApplyingCorrection(true);

    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("chapterKey", activeChapter);
    if (feedbackText) formData.append("feedbackText", feedbackText);
    if (feedbackImage) formData.append("image", feedbackImage);

    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            content: { ...prev.content, [activeChapter]: data.updatedContent },
          };
        });
        setShowFeedbackPanel(false);
        setFeedbackText("");
        setFeedbackImage(null);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Network error while submitting feedback.");
    } finally {
      setApplyingCorrection(false);
    }
  };

  if (loading) return <div className="p-8 font-mono text-sm">Synchronizing project workspace hooks...</div>;
  if (!project) return <div className="p-8 font-mono text-sm">Project node not initialized. Return to landing page.</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Meta Details bar */}
      <div className="border-b border-gray-200 pb-4">
        <span className="text-xs font-mono uppercase text-[#d97706] tracking-wider font-bold">{project.course} Project Workspace</span>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{project.topic}</h2>
      </div>

      {!project.guidelines?.isCustomized && (
        <GuidelineUploader 
          projectId={projectId as string} 
          onComplete={() => window.location.reload()} 
        />
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-300 overflow-x-auto scrollbar-none">
        {currentStructure.map((chapter) => (
          <button
            key={chapter.key}
            onClick={() => {
              setActiveChapter(chapter.key);
              setShowFeedbackPanel(false); // Reset feedback panel when switching tabs
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              activeChapter === chapter.key
                ? "border-[#d97706] text-[#d97706] bg-gray-50"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {chapter.label}
          </button>
        ))}
      </div>

      {/* Control bar: Generate / Pay Actions */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-300 p-4">
        <div>
          <h4 className="font-bold text-sm text-gray-800">Viewing: {activeChapterLabel}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {project.content && project.content[activeChapter] 
              ? "Content loaded from persistent project memory." 
              : "No draft detected in your current workspace database node."}
          </p>
        </div>

        <div className="flex gap-4">
          {(!project.content || !project.content[activeChapter]) ? (
            <button
              onClick={handleGenerateChapter}
              disabled={generating}
              className="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-none"
            >
              {generating ? "Chaining Memory Context..." : `Draft Section`}
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="bg-[#d97706] text-white px-4 py-2 text-xs font-bold uppercase hover:bg-[#b45309] transition-colors rounded-none"
            >
              Download DOCX (UGX 20,000)
            </button>
          )}
        </div>
      </div>

      {/* Secure document render boundary */}
      <LockedDocumentViewer content={project.content ? project.content[activeChapter] : ""} />

      {/* Supervisor Feedback Integration */}
      {project.content && project.content[activeChapter] && (
        <div className="mt-2 border border-gray-300 bg-white p-4">
          {!showFeedbackPanel ? (
            <button
              onClick={() => setShowFeedbackPanel(true)}
              className="w-full bg-gray-100 text-gray-800 border border-gray-300 font-bold py-3 uppercase text-xs hover:bg-gray-200 transition-colors rounded-none"
            >
              + Add Supervisor Corrections
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-sm text-gray-800">Submit Supervisor Feedback</h4>
              <textarea
                className="w-full border border-gray-300 p-3 bg-gray-50 outline-none text-sm rounded-none"
                rows={3}
                placeholder="Type supervisor's comments here... (e.g., 'Expand on the background of the study')"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              <div className="border border-dashed border-gray-400 p-4 bg-gray-50 text-center relative cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={(e) => setFeedbackImage(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-600">
                  {feedbackImage ? feedbackImage.name : "Or attach a photo of the marked document"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyFeedback}
                  disabled={applyingCorrection || (!feedbackText && !feedbackImage)}
                  className="flex-1 bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-none"
                >
                  {applyingCorrection ? "Rewriting Chapter..." : "Apply Corrections"}
                </button>
                <button
                  onClick={() => setShowFeedbackPanel(false)}
                  className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 text-xs font-bold uppercase hover:bg-red-100 transition-colors rounded-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
