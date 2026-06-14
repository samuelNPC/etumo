"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import LockedDocumentViewer from "@/components/LockedDocumentViewer";
import GuidelineUploader from "@/components/GuidelineUploader";

// Define the shape of our dynamic structure
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

// Fallback structure if the user hasn't uploaded specific guidelines yet
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

  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("preliminaryPages");
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // 1. Fetch current project state from Firestore on mount
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

  // Determine the active structure array
  const currentStructure = project?.guidelines?.isCustomized 
    ? project.guidelines.structure 
    : defaultStructure;

  // Helper to get the human-readable label for the current active tab
  const activeChapterLabel = currentStructure.find(c => c.key === activeChapter)?.label || activeChapter;

  // 2. Trigger the serverless progressive chapter API
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
        // Optimistically update frontend UI state immediately
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

  // 3. Trigger the DOCX Export API and simulate payment paywall
  const handleDownload = async () => {
    if (!projectId || !activeChapter) return;

    // Intercept with the Paywall Modal
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

      // Force the browser to save the file silently
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

  if (loading) return <div className="p-8 font-mono text-sm">Synchronizing project workspace hooks...</div>;
  if (!project) return <div className="p-8 font-mono text-sm">Project node not initialized. Return to landing page.</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Meta Details bar */}
      <div className="border-b border-gray-200 pb-4">
        <span className="text-xs font-mono uppercase text-[#d97706] tracking-wider font-bold">{project.course} Project Workspace</span>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{project.topic}</h2>
      </div>

      {/* Conditionally render the Guideline Uploader if the university format isn't set */}
      {!project.guidelines?.isCustomized && (
        <GuidelineUploader 
          projectId={projectId as string} 
          onComplete={() => window.location.reload()} 
        />
      )}

      {/* Tabs navigation for shifting workspace focus */}
      <div className="flex border-b border-gray-300 overflow-x-auto scrollbar-none">
        {currentStructure.map((chapter) => (
          <button
            key={chapter.key}
            onClick={() => setActiveChapter(chapter.key)}
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
              className="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
            >
              {generating ? "Chaining Memory Context..." : `Draft Section`}
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="bg-[#d97706] text-white px-4 py-2 text-xs font-bold uppercase hover:bg-[#b45309] transition-colors"
            >
              Download DOCX (UGX 20,000)
            </button>
          )}
        </div>
      </div>

      {/* Secure document render boundary */}
      <LockedDocumentViewer content={project.content ? project.content[activeChapter] : ""} />
    </div>
  );
}
