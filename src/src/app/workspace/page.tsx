"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import LockedDocumentViewer from "@/components/LockedDocumentViewer";

interface ProjectData {
  topic: string;
  course: string;
  progress: number;
  content: {
    [key: string]: string;
  };
}

export default function WorkspacePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("preliminaryPages");
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);

  // 1. Fetch current project state from Firestore on mount
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      setLoading(true);
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
      }
    } catch (err) {
      alert("Error processing progressive context generation pipeline.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8 font-mono text-sm">Synchronizing project workspace hooks...</div>;
  if (!project) return <div className="p-8 font-mono text-sm">Project node not initialized. Return to landing page.</div>;

  // Dictionary mapping internal database keys to clean human-readable text labels
  const chapterLabels: { [key: string]: string } = {
    preliminaryPages: "Preliminary Pages",
    chapter1: "Chapter 1: Introduction",
    chapter2: "Chapter 2: Literature Review",
    chapter3: "Chapter 3: Methodology",
    chapter4: "Chapter 4: Data Presentation",
    chapter5: "Chapter 5: Conclusion",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Meta Details bar */}
      <div className="border-b border-gray-200 pb-4">
        <span className="text-xs font-mono uppercase text-[#d97706] tracking-wider font-bold">{project.course} Project Workspace</span>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{project.topic}</h2>
      </div>

      {/* Tabs navigation for shifting workspace focus */}
      <div className="flex border-b border-gray-300 overflow-x-auto scrollbar-none">
        {Object.keys(chapterLabels).map((key) => (
          <button
            key={key}
            onClick={() => setActiveChapter(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              activeChapter === key
                ? "border-[#d97706] text-[#d97706] bg-gray-50"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {chapterLabels[key]}
          </button>
        ))}
      </div>

      {/* Control bar: Generate / Pay Actions */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-300 p-4">
        <div>
          <h4 className="font-bold text-sm text-gray-800">Viewing: {chapterLabels[activeChapter]}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {project.content[activeChapter] 
              ? "Content loaded from persistent project memory." 
              : "No draft detected in your current workspace database node."}
          </p>
        </div>

        {!project.content[activeChapter] && (
          <button
            onClick={handleGenerateChapter}
            disabled={generating}
            className="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {generating ? "Chaining Memory Context..." : `Draft ${chapterLabels[activeChapter]}`}
          </button>
        )}
      </div>

      {/* Secure document render boundary */}
      <LockedDocumentViewer content={project.content[activeChapter]} />
    </div>
  );
}
