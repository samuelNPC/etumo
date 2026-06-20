"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

interface Project {
  id: string;
  topic: string;
  course: string;
  progress: number;
  createdAt: string;
}

interface Instrument {
  id: string;
  questionCount: number;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);

  // Authenticate and Fetch Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      try {
        // Run both queries simultaneously for performance
        const projectsQuery = getDocs(
          query(collection(db, "projects"), where("userId", "==", currentUser.uid))
        );
        const instrumentsQuery = getDocs(
          query(collection(db, "instruments"), where("userId", "==", currentUser.uid))
        );

        const [projectsSnap, instrumentsSnap] = await Promise.all([projectsQuery, instrumentsQuery]);
        
        const fetchedProjects: Project[] = [];
        projectsSnap.forEach((doc) => {
          fetchedProjects.push({ id: doc.id, ...doc.data() } as Project);
        });

        const fetchedInstruments: Instrument[] = [];
        instrumentsSnap.forEach((doc) => {
          fetchedInstruments.push({ id: doc.id, ...doc.data() } as Instrument);
        });

        // Sort projects by newest first
        fetchedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setProjects(fetchedProjects);
        setInstruments(fetchedInstruments);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

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

  // Determine if the user is a returning active user
  const hasActivity = projects.length > 0 || instruments.length > 0;

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

        {/* --- DYNAMIC TOP SECTION --- */}
        {!hasActivity ? (
          /* SHOW EXPLANATORY TOOLKIT FOR NEW USERS */
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
        ) : (
          /* SHOW STRONG QUICK-ACTION CARDS FOR ACTIVE USERS */
          <div className="mb-14">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Research Card - Dark Slate Background */}
              <Link 
                href={projects.length > 0 ? `/workspace?id=${projects[0].id}` : "/"} 
                className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-slate-700 rounded-full mix-blend-screen filter blur-3xl opacity-30 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Active Workspace
                  </span>
                  <h3 className="text-2xl font-black mb-2">Resume Research</h3>
                  <p className="text-slate-300 text-sm max-w-sm line-clamp-2">
                    {projects.length > 0 ? projects[0].topic : "Start drafting your academic research document."}
                  </p>
                  <div className="mt-6 inline-flex items-center text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2.5 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-colors border border-white/10">
                    Open Workspace &rarr;
                  </div>
                </div>
              </Link>

              {/* Data Collector Card - Strong Orange Gradient */}
              <Link 
                href={instruments.length > 0 ? `/data-collector/${instruments[0].id}` : "/data-collector"} 
                className="bg-gradient-to-br from-[#d97706] to-[#b45309] text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
              >
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-200 mb-3 block flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Field Work
                  </span>
                  <h3 className="text-2xl font-black mb-2">Live Data Collection</h3>
                  <p className="text-orange-100 text-sm max-w-sm">
                    {instruments.length > 0 ? `Monitor live responses for Instrument ID: ${instruments[0].id.substring(0,6)}...` : "Digitize your instrument and deploy a live tracking link."}
                  </p>
                  <div className="mt-6 inline-flex items-center text-xs font-bold uppercase tracking-widest bg-black/20 px-4 py-2.5 rounded-lg backdrop-blur-sm group-hover:bg-black/30 transition-colors border border-black/10">
                    {instruments.length > 0 ? "View Analytics &rarr;" : "Deploy Link &rarr;"}
                  </div>
                </div>
              </Link>

            </div>
          </div>
        )}

        {/* --- MAIN CONTENT GRID: ALL WORKSPACES --- */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Active Workspaces</h2>
            <p className="text-sm text-gray-500 mt-1">Access all your previous research nodes below.</p>
          </div>
          {projects.length > 0 && (
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full hidden sm:inline-block">
              {projects.length} Active
            </span>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-8 sm:p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-orange-50 text-[#d97706] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">No projects yet.</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
              Initialize your first workspace by entering your approved topic.
            </p>
            <Link 
              href="/"
              className="inline-block bg-[#d97706] text-white font-bold py-4 px-10 rounded-xl text-xs uppercase tracking-widest hover:bg-[#b45309] transition-colors shadow-lg hover:-translate-y-1"
            >
              Create Workspace
            </Link>
          </div>
        ) : (
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
