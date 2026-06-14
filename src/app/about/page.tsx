import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Etomu",
  description: "Learn about Etomu's mission to revolutionize academic research and help students write better, faster.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter mb-6">
            Research is hard. <br className="hidden sm:block" />
            <span className="text-[#4285F4]">Formatting shouldn't be.</span>
          </h1>
          <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Etomu was built to solve a simple problem: students and researchers spend too much time fighting with document formatting, originality scores, and writer's block, and not enough time actually researching.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-16 space-y-16 animate-in fade-in duration-700 delay-100">
        
        <div className="bg-white p-8 sm:p-12 border border-gray-200 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We are building the ultimate operating system for academic research. Whether you are a final-year university student tackling your dissertation, or an academic writer managing multiple projects, Etomu brings topic generation, chapter structuring, and Turnitin-safe remediation into one seamless workspace.
          </p>
          <p className="text-gray-600 leading-relaxed">
            No more switching between ten different tabs. No more losing points because your margins or APA citations were wrong. We automate the heavy lifting so you can focus on the ideas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-[#4285F4] rounded-full flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Speed</h3>
            <p className="text-sm text-gray-500">Go from a blank page to a fully structured document layout in seconds.</p>
          </div>
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 bg-green-50 text-[#34A853] rounded-full flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Integrity</h3>
            <p className="text-sm text-gray-500">Built-in remediation tools to help you maintain originality and bypass AI detectors ethically.</p>
          </div>
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 bg-purple-50 text-[#9333EA] rounded-full flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Precision</h3>
            <p className="text-sm text-gray-500">Upload your university guidelines once, and let our engine format every chapter perfectly.</p>
          </div>
        </div>

      </div>
    </main>
  );
}
