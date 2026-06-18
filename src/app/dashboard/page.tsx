"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

// Define the structure of a Project based on how we save it
interface Project {
  id: string;
  topic: string;
  course: string;
  progress: number;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Authenticate and Fetch Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // If not logged in, kick them back to the homepage
        router.push("/");
        return;
      }

      setUser(currentUser);

      try {
        // Fetch only projects belonging to this user
        const q = query(
          collection(db, "projects"), 
          where("userId", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const fetchedProjects: Project[] = [];

        querySnapshot.forEach((doc) => {
          fetchedProjects.push({ id: doc.id, ...doc.data() } as Project);
        });

        // Sort by newest first (using the ISO string)
        fetchedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Format date nicely (e.g., "Jun 14, 2026")
  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#d97706] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 pb-20 font-sans">

      {/* --- DASHBOARD HEADER --- */}
      <div className="bg-white border-b border-gray-200 pt-12 pb-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              Welcome back.
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Logged in as <span className="text-gray-900 font-bold">{user?.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/originality"
              className="bg-white border border-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm"
            >
              Fix Similarity
            </Link>
            <Link 
              href="/data-collector"
              className="bg-white border border-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm"
            >
              Collect Data
            </Link>
            <Link 
              href="/"
              className="bg-black text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              New Project
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-10 animate-in fade-in duration-700 delay-100">

        {/* --- EXPLANATORY TOOLS SECTION --- */}
        <div className="mb-14">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Etomu Toolkit</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-col items-start hover:border-black transition-colors">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 font-black text-xl">1</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Research Workspace</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-grow">
                Enter your topic and upload your university's manual. The AI will guide you step-by-step to draft and export a perfectly formatted Word document.
              </p>
              <Link href="/" className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline mt-auto">Start Drafting &rarr;</Link>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-col items-start hover:border-black transition-colors">
              <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center mb-4 font-black text-xl">2</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Originality Center</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-grow">
                Got flagged by Turnitin? Paste your text or upload your PDF report. Our engine will rewrite your document to bypass AI and plagiarism detectors.
              </p>
              <Link href="/originality" className="text-xs font-bold text-yellow-600 uppercase tracking-widest hover:underline mt-auto">Clean Document &rarr;</Link>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-col items-start hover:border-black transition-colors">
              <div className="w-10 h-10 bg-orange-50 text-[#d97706] rounded-lg flex items-center justify-center mb-4 font-black text-xl">3</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Data Collector</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-grow">
                Stop printing questionnaires. Upload your PDF instrument to generate a live, shareable digital collection link with real-time analytics.
              </p>
              <Link href="/data-collector" className="text-xs font-bold text-[#d97706] uppercase tracking-widest hover:underline mt-auto">Deploy Link &rarr;</Link>
            </div>

          </div>
        </div>

        {/* --- MAIN CONTENT GRID: WORKSPACES --- */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Active Workspaces</h2>
            <p className="text-sm text-gray-500 mt-1">Pick up where you left off or start a new research project.</p>
          </div>
          {projects.length > 0 && (
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full hidden sm:inline-block">
              {projects.length} Active
            </span>
          )}
        </div>

        {projects.length === 0 ? (
          /* EMPTY STATE EXPLANATION */
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-8 sm:p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-orange-50 text-[#d97706] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">You have no projects yet. Start here.</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
              Initialize your first workspace by entering your approved topic. We will set up your secure database node, extract your faculty rules, and begin drafting your chapters.
            </p>
            <Link 
              href="/"
              className="inline-block bg-[#d97706] text-white font-bold py-4 px-10 rounded-xl text-xs uppercase tracking-widest hover:bg-[#b45309] transition-colors shadow-lg hover:-translate-y-1"
            >
              Create Your First Workspace
            </Link>
          </div>
        ) : (
          /* PROJECTS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                href={`/workspace?id=${project.id}`} 
                key={project.id}
                className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#d97706] transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                  <div className="h-1 bg-[#d97706] transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                </div>

                <div className="flex items-center justify-between mb-4 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    {project.course || "General Course"}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{project.progress}% Done</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-snug mb-6 flex-grow line-clamp-3">
                  {project.topic}
                </h3>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Started {formatDate(project.createdAt)}
                  </span>
                  <div className="text-[#d97706] group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
