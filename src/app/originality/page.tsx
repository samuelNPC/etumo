import OriginalityCenter from "@/components/OriginalityCenter";

export default function OriginalityPage() {
  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-8 mt-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Similarity & AI Remediation</h1>
        <p className="text-gray-500 mt-1 text-sm">Upload flagged documents to isolate and rewrite problematic text structures.</p>
      </div>
      
      {/* This mounts the engine component we built earlier */}
      <OriginalityCenter />
    </main>
  );
}
