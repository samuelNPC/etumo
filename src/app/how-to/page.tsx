import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Use Etomu | Step-by-Step Guide",
  description: "Learn how to use Etomu to generate topics, format your university research, and bypass AI detectors.",
};

export default function HowToPage() {
  const steps = [
    {
      number: "01",
      title: "Initialize Your Workspace",
      description: "Start by entering your approved research topic, or let our AI matrix generate high-quality, course-aligned topics for you. Once selected, Etomu builds a secure database node for your project.",
      color: "text-[#4285F4]",
      bgColor: "bg-blue-50"
    },
    {
      number: "02",
      title: "Upload University Guidelines",
      description: "This is the most crucial step. Upload your university's specific formatting handbook (PDF/Word). Our engine learns your required fonts, spacing, margins, and citation styles to ensure your final export is flawless.",
      color: "text-[#EA4335]",
      bgColor: "bg-red-50"
    },
    {
      number: "03",
      title: "Draft & Structure Chapters",
      description: "Navigate through your project structure in the left sidebar. Etomu intelligently drafts your Literature Review, Methodology, and more based on your specific topic and uploaded rules.",
      color: "text-[#FBBC05]",
      bgColor: "bg-yellow-50"
    },
    {
      number: "04",
      title: "Originality Remediation",
      description: "Got flagged by Turnitin? Paste your paragraphs into our Originality Center. Our engine will restructure the text to pass similarity and AI checks while maintaining perfect academic tone.",
      color: "text-[#34A853]",
      bgColor: "bg-green-50"
    },
    {
      number: "05",
      title: "Export to DOCX",
      description: "Once a chapter is complete, click download. You will receive a perfectly formatted, ready-to-print Microsoft Word document that satisfies your supervisor's exact requirements.",
      color: "text-[#9333EA]",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-16 px-4 sm:px-8 text-center">
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter mb-4">
          How Etomu Works
        </h1>
        <p className="text-gray-500 font-medium max-w-lg mx-auto">
          From a blank idea to a submission-ready research document in 5 simple steps.
        </p>
      </div>

      {/* Timeline Steps */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 mt-16">
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white p-6 sm:p-8 border border-gray-200 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-6 items-start animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
              
              <div className={`shrink-0 w-16 h-16 rounded-2xl ${step.bgColor} ${step.color} flex items-center justify-center font-black text-2xl tracking-tighter`}>
                {step.number}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {step.description}
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-black rounded-3xl p-10 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Ready to start researching?</h2>
          <Link href="/" className="inline-block bg-white text-black font-bold py-4 px-8 rounded-xl uppercase tracking-widest text-sm hover:bg-gray-100 transition-colors shadow-md">
            Create Your Workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
