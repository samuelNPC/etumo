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
          <div className="w-10 h-10 border-4 border-[#4285F4] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 pb-20 font-sans">
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="bg-white border-b border-gray-200 pt-12 pb-12 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              Welcome back.
            </h1>
            <p className="text-gray-500 font-medium">
              Logged in as <span className="text-gray-900 font-bold">{user?.email}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/originality"
              className="bg-white border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm"
            >
              Originality Center
            </Link>
            <Link 
              href="/"
              className="bg-[#4285F4] text-white font-bold py-3 px-6 rounded-xl text-sm hover:bg-[#3367D6] transition-colors shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-12 animate-in fade-in duration-700 delay-100">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your Workspaces</h2>
          <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
            {projects.length} Active
          </span>
        </div>

        {projects.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-[#4285F4] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Start by generating a new research topic or initializing a workspace with an existing idea.
            </p>
            <Link 
              href="/"
              className="inline-block bg-black text-white font-bold py-3 px-8 rounded-xl text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-md"
            >
              Create Workspace
            </Link>
          </div>
        ) : (
          /* PROJECTS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                href={`/workspace?id=${project.id}`} 
                key={project.id}
                className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-black transition-all duration-300 flex flex-col h-full cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    {project.course || "General Course"}
                  </span>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 leading-snug mb-6 flex-grow line-clamp-3">
                  {project.topic}
                </h3>
                
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div 
                      className="bg-[#34A853] h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    Created {formatDate(project.createdAt)}
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
