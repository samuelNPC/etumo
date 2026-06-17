import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Etumo",
  description: "Draft your research for free. Only pay on-demand for native document downloads, supervisor corrections, and full Turnitin remediation.",
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
            Draft for free. Pay on demand.
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            Build, test, and preview your entire project workspace without spending a shilling. Unlock native Microsoft Word files and advanced remediation only when you are ready.
          </p>
        </div>
      </div>

      {/* --- MAIN COMPARISON SPLIT --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-16 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Column 1: The Free Sandbox */}
          <div className="bg-white border border-gray-200 p-8 shadow-sm">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold tracking-tight">Free Research Hub</h3>
              <p className="text-sm text-gray-500 mt-1">Everything you need to conceptualize and draft your research report.</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              {[
                "Enter your topic & instantly match university specifications",
                "Upload and parse customized institutional formatting guidelines",
                "Generate & live-preview chapters (Chapter 1 through Chapter 5)",
                "Build & view preliminary pages (Declaration, Abstract, etc.)",
                "Upload & analyze raw Turnitin PDF files to check similarity scores",
                "Upload and view custom questionnaires or interview guides",
                "30 Free text-box similarity and AI humanizations every single day",
                "2 Free comprehensive AI Supervisor Corrections per research topic"
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
              Open Free Sandbox
            </Link>
          </div>

          {/* Column 2: The Premium Vault */}
          <div className="bg-white border-2 border-black p-8 shadow-md relative">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-black text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3">
              On-Demand Unlocks
            </div>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold tracking-tight">Premium Features</h3>
              <p className="text-sm text-gray-500 mt-1">Convert your digital draft into an official academic submission.</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Download individual chapters as clean, standalone DOCX files",
                "Download preliminary pages and research tools separately",
                "Compile and download your entire project into a master document",
                "Full-file automated Turnitin Plagiarism/Similarity syntax restructuring",
                "Full-file automated Turnitin AI Detection humanization",
                "Deploy active Data Collection tools with links, analytics, and summaries",
                "Extended Supervisor Corrections to patch structural feedback on demand",
                "Bulk text-box humanization packages with standard free usage top-ups"
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
                  <td className="p-4 font-bold">Master Document Compilation</td>
                  <td className="p-4 text-gray-500">Download whole project draft into a complete, university-formatted DOCX file</td>
                  <td className="p-4 text-right font-mono font-bold text-black">50,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Turnitin File Plagiarism Cleaning</td>
                  <td className="p-4 text-gray-500">Upload entire report; reconstructs syntax to drop n-gram matches to 0% with tables intact</td>
                  <td className="p-4 text-right font-mono font-bold text-black">15,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Turnitin File AI Detection Cleaning</td>
                  <td className="p-4 text-gray-500">Upload entire report; humanizes syntax via deep burstiness/perplexity alteration</td>
                  <td className="p-4 text-right font-mono font-bold text-black">15,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Individual Chapter Download</td>
                  <td className="p-4 text-gray-500">Export any single finished chapter as an isolated Microsoft Word document</td>
                  <td className="p-4 text-right font-mono font-bold text-black">10,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Data Collection Tool Deployment</td>
                  <td className="p-4 text-gray-500">Deploys questionnaire tool + provisions data collection links, metrics analytics, & AI summary</td>
                  <td className="p-4 text-right font-mono font-bold text-black">10,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Bulk Text Box Removals Pack</td>
                  <td className="p-4 text-gray-500">Unlocks 100 deep-tier manual text humanizations (includes a bonus +20 free uses)</td>
                  <td className="p-4 text-right font-mono font-bold text-black">10,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Preliminary Pages / Instruments Download</td>
                  <td className="p-4 text-gray-500">Download isolated Abstract, Declaration, or custom Interview guides into Word format</td>
                  <td className="p-4 text-right font-mono font-bold text-black">5,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Extended Supervisor Review Corrections</td>
                  <td className="p-4 text-gray-500">Applies detailed rewrite updates based on supervisor comments (First 2 edits are free per topic)</td>
                  <td className="p-4 text-right font-mono font-bold text-black">5,000</td>
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
              <h4 className="font-bold text-gray-900 mb-2">How does Mobile Money payment authorization work?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                We accept MTN MoMo and Airtel Money directly on the platform. When you trigger an on-demand download or remediation unlock, a secure payment prompt will instantly push directly to your mobile number. Enter your PIN to validate, and your document downloads immediately.
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">Am I double-charged if my network drop breaks a download?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Never. Every financial transaction updates your workspace metadata state in Firestore. If your connection drops in Kabale or anywhere across the country after payment confirmation, the file asset remains unlocked permanently inside your portal to download whenever your data clears.
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">How do the free supervisor corrections operate?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                We understand that research is iterative. Every unique research project workspace includes two full structural adjustments for free. If your faculty head requests changes on text structures or methodology nodes, feed the comments into our engine to automatically re-align the drafted chapters without spending an extra shilling.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
