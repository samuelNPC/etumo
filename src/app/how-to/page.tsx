import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Use Etomu | Step-by-Step Guide",
  description: "Learn how to navigate the Etomu Workspace, bypass Turnitin in the Originality Center, and digitize your field research with the Data Collector.",
};

export default function HowToPage() {
  const steps = [
    {
      number: "01",
      title: "Initialize & Teach the AI",
      description: "Enter your approved research topic to create a Workspace. The very first step is uploading your university's research manual (PDF). The Etumo Engine will instantly extract your faculty's exact formatting rules, chapter structure, and required preliminary pages.",
      color: "text-[#4285F4]",
      bgColor: "bg-blue-50"
    },
    {
      number: "02",
      title: "Sequential Drafting & Edits",
      description: "Generate your chapters sequentially. You must finish Chapter 1 before unlocking Chapter 2 so the AI maintains perfect academic context. If your supervisor requests changes, paste their comments into the previewer. The first 2 AI rewrites are free (subsequent edits are 5,000 UGX).",
      color: "text-[#EA4335]",
      bgColor: "bg-red-50"
    },
    {
      number: "03",
      title: "Bypass Turnitin (Originality Center)",
      description: "If your work gets flagged, head to the Originality Center. You get 30 free daily text snippet rewrites. For heavy flags, upload your raw Turnitin PDF—our engine maps your exact scores and rewrites the entire document to drop AI and Plagiarism metrics to zero (15,000 UGX).",
      color: "text-[#FBBC05]",
      bgColor: "bg-yellow-50"
    },
    {
      number: "04",
      title: "Digitize Fieldwork (Data Collector)",
      description: "Stop printing paper questionnaires. Upload your approved instrument PDF, and Etumo will map the variables and deploy a mobile-friendly public link for your respondents (10,000 UGX). Watch the data roll into your private dashboard in real-time.",
      color: "text-[#34A853]",
      bgColor: "bg-green-50"
    },
    {
      number: "05",
      title: "Export & Auto-Summarize",
      description: "When you're ready to submit, securely unlock your files via MTN or Airtel Mobile Money. Download individual chapters (10,000 UGX) or the fully compiled Research Document (50,000 UGX). You can even use the Data Collector to auto-write your Chapter 4 summary based on respondent trends!",
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
