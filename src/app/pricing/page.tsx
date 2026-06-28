import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Etomu",
  description: "Draft and preview your entire research project for free. Only pay on-demand for native document downloads and advanced Turnitin remediation.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">

      {/* --- HERO SECTION --- */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-16 px-4 sm:px-8 text-center">
        <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700">
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold uppercase tracking-widest text-blue-700 mb-6">
            Pay-As-You-Go System
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter mb-6">
            Free to Draft. Pay to Export.
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            Build, test, and preview your entire research project without spending a shilling. Only pay when you are ready to download clean, official Microsoft Word files for your university submission.
          </p>
        </div>
      </div>

      {/* --- MAIN COMPARISON SPLIT --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-16 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Column 1: The Free Sandbox */}
          <div className="bg-white border border-gray-200 p-8 shadow-sm">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold tracking-tight">Free Research Sandbox</h3>
              <p className="text-sm text-gray-500 mt-1">Everything you need to conceptualize and read your drafted research.</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Unlimited Workspace Creations using Google Sign-In",
                "Upload and parse your university's exact formatting guidelines",
                "Generate & live-preview all chapters (Chapter 1 through 5) for free",
                "Download Preliminary Pages & Chapter 1 for free (Watermarked)",
                "3 Free Supervisor Correction Rewrites per project",
                "Free daily text-snippet rewrites in the Originality Center"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                  <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/workspace" className="w-full block text-center bg-gray-100 text-gray-900 font-bold py-4 hover:bg-gray-200 transition-colors">
              Start Drafting Free
            </Link>
          </div>

          {/* Column 2: The Premium Vault */}
          <div className="bg-white border-2 border-black p-8 shadow-md relative">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-black text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3">
              On-Demand Exports
            </div>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold tracking-tight">Premium Unlocks</h3>
              <p className="text-sm text-gray-500 mt-1">Convert your digital preview into a perfectly clean academic submission.</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Unlock individual chapters (14,000 UGX) as clean DOCX files",
                "Unlock Complete Master Document (54,000 UGX) for full file export",
                "Master Document export permanently unlocks unlimited corrections",
                "Removes all Etomu Evaluation watermarks and branded footers",
                "Full-file automated Turnitin Plagiarism & AI Cleaning",
                "Deploy active Data Collection tools with links and analytics"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/workspace" className="w-full block text-center bg-black text-white font-bold py-4 hover:bg-gray-800 transition-colors shadow-sm">
              View Workspaces
            </Link>
          </div>

        </div>

        {/* --- THE RATE CARD TABLE --- */}
        <div className="mt-20">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Official Premium Rate Card</h2>
            <p className="text-sm text-gray-500 mt-1">Clear, transparent pricing based in Ugandan Shillings (UGX). No hidden subscription retainers.</p>
          </div>

          <div className="overflow-x-auto border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 font-mono text-xs uppercase tracking-wider text-gray-600">
                  <th className="p-4 font-bold">Academic Utility Unit</th>
                  <th className="p-4 font-bold">Scope / Package Inclusion</th>
                  <th className="p-4 text-right font-bold">Rate (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                <tr>
                  <td className="p-4 font-bold">Project Generation & Preview</td>
                  <td className="p-4 text-gray-500">Create a workspace, generate all chapters, and preview the full text online.</td>
                  <td className="p-4 text-right font-mono font-bold text-green-600">FREE</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Complete Master Document Bundle</td>
                  <td className="p-4 text-gray-500">Download the entire un-watermarked project. Includes unlimited free corrections!</td>
                  <td className="p-4 text-right font-mono font-bold text-black">54,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Individual Chapter Unlock</td>
                  <td className="p-4 text-gray-500">Export a single premium chapter (Ch. 2-5) as a clean, isolated DOCX file.</td>
                  <td className="p-4 text-right font-mono font-bold text-black">14,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Single Supervisor Correction</td>
                  <td className="p-4 text-gray-500">Detailed AI rewrite based on feedback (First 3 edits are completely free).</td>
                  <td className="p-4 text-right font-mono font-bold text-black">5,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Turnitin File Plagiarism Cleaning</td>
                  <td className="p-4 text-gray-500">Upload entire report; reconstructs syntax to drop similarity matches to 0%.</td>
                  <td className="p-4 text-right font-mono font-bold text-black">15,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Turnitin File AI Detection Cleaning</td>
                  <td className="p-4 text-gray-500">Upload entire report; humanizes syntax via deep burstiness/perplexity alteration.</td>
                  <td className="p-4 text-right font-mono font-bold text-black">15,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Data Collection Tool Deployment</td>
                  <td className="p-4 text-gray-500">Deploys questionnaire tool + provisions data collection links and live analytics.</td>
                  <td className="p-4 text-right font-mono font-bold text-black">10,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* --- FAQ SECTION --- */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">Do I have to pay before generating my research?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Absolutely not. We believe you should see the quality before you pay a single shilling. You can create your workspace, generate every chapter, and read the entire document securely in your browser for 100% free. You only pay when you are ready to export the clean Microsoft Word file.
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">Why should I buy the Full Document (54,000 UGX) instead of single chapters?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                While you can unlock chapters individually for 14,000 UGX, exporting the Full Master Document for 54,000 UGX is significantly cheaper than buying four chapters separately. Plus, purchasing the Full Document automatically removes the fee on Supervisor Corrections, giving you unlimited free rewrites!
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">How do the Supervisor Corrections operate?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Research is an iterative process. Every free workspace comes with 3 free structural adjustments. If your supervisor requests changes, feed the comments into our engine to automatically re-align the chapter. After your 3 free edits, it costs 5,000 UGX per edit (unless you have unlocked the Full Master Document bundle, which makes all edits free).
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">How does Mobile Money payment authorization work?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                We accept MTN MoMo and Airtel Money directly on the platform. When you trigger an on-demand download or remediation unlock, a secure payment prompt will instantly push directly to your mobile number. Enter your PIN to validate, and your document downloads immediately.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
