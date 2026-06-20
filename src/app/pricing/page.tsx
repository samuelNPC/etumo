import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Etomu",
  description: "Claim your first research project completely free. Unlock additional premium workspaces for a flat, transparent rate.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">

      {/* --- HERO SECTION --- */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-16 px-4 sm:px-8 text-center">
        <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700">
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold uppercase tracking-widest text-blue-700 mb-6">
            Simplified Flat-Rate System
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter mb-6">
            One Free Project. Unlimited Potential.
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            Every student gets their first complete research project absolutely free. Need another? Unlock a premium workspace for a single, transparent flat fee. No hidden micro-transactions.
          </p>
        </div>
      </div>

      {/* --- MAIN COMPARISON SPLIT --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-16 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Column 1: The Free Sandbox */}
          <div className="bg-white border border-gray-200 p-8 shadow-sm">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold tracking-tight">The Free Tier</h3>
              <p className="text-sm text-gray-500 mt-1">One complete research project per student. Verified via SMS.</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "1 Complete Research Workspace (Unlocked via Mobile SMS)",
                "Enter your topic & instantly match university specifications",
                "Generate & live-preview all chapters (Chapter 1 through 5)",
                "Build & view preliminary pages (Declaration, Abstract, etc.)",
                "10 Free Supervisor Correction Sessions per project",
                "Download full master documents (Includes Evaluation Watermarks)",
                "Download individual chapters (Includes Evaluation Watermarks)"
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
              Claim Free Project
            </Link>
          </div>

          {/* Column 2: The Premium Vault */}
          <div className="bg-white border-2 border-black p-8 shadow-md relative">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-black text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3">
              No Micro-transactions
            </div>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold tracking-tight">Premium Workspace</h3>
              <p className="text-sm text-gray-500 mt-1">For your second project, or when you need official submission files.</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Unlocks a brand new Research Workspace for a new topic",
                "Removes all Etomu evaluation watermarks and branded footers",
                "Download individual chapters as clean, official DOCX files",
                "Download the master compiled project ready for submission",
                "10 Free Supervisor Correction Sessions included immediately",
                "Unlimited previewing, generation, and data retention",
                "Priority database processing during high-traffic periods"
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
              Unlock Premium (54,000 UGX)
            </Link>
          </div>

        </div>

        {/* --- THE RATE CARD TABLE --- */}
        <div className="mt-20">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Official Rate Card</h2>
            <p className="text-sm text-gray-500 mt-1">Clear, transparent pricing based in Ugandan Shillings (UGX). No hidden subscription retainers.</p>
          </div>

          <div className="overflow-x-auto border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 font-mono text-xs uppercase tracking-wider text-gray-600">
                  <th className="p-4 font-bold">Workspace & Utility Units</th>
                  <th className="p-4 font-bold">Scope / Package Inclusion</th>
                  <th className="p-4 text-right font-bold">Rate (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                <tr>
                  <td className="p-4 font-bold">First Evaluation Workspace</td>
                  <td className="p-4 text-gray-500">1 Complete Project + 10 Free Edits (Watermarked DOCX Downloads). Verified via SMS.</td>
                  <td className="p-4 text-right font-mono font-bold text-green-600">FREE</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Premium Research Workspace</td>
                  <td className="p-4 text-gray-500">Unlocks a new project with perfectly clean, un-watermarked DOCX file exports.</td>
                  <td className="p-4 text-right font-mono font-bold text-black">54,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Supervisor Correction Bundle</td>
                  <td className="p-4 text-gray-500">Top-up package that unlocks 20 additional AI rewriting sessions for supervisor feedback.</td>
                  <td className="p-4 text-right font-mono font-bold text-black">13,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Turnitin File Plagiarism Cleaning</td>
                  <td className="p-4 text-gray-500">Upload existing report; reconstructs syntax to drop similarity matches to 0% with tables intact.</td>
                  <td className="p-4 text-right font-mono font-bold text-black">15,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Turnitin File AI Detection Cleaning</td>
                  <td className="p-4 text-gray-500">Upload existing report; humanizes syntax via deep burstiness/perplexity alteration.</td>
                  <td className="p-4 text-right font-mono font-bold text-black">15,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Data Collection Tool Deployment</td>
                  <td className="p-4 text-gray-500">Deploys questionnaire tool + provisions live data collection links and AI analytics.</td>
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
              <h4 className="font-bold text-gray-900 mb-2">How does the Free Project limit work?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                To prevent abuse, we allow one free research workspace per verified Ugandan phone number (MTN or Airtel). Once you verify your number via SMS, you have full access to generate your entire draft. If you wish to start a completely different second project, you will be asked to unlock a Premium Workspace for 54,000 UGX.
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">What is the difference between Free and Premium downloads?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                When you download your document from a Free Workspace, the DOCX file will contain Etomu evaluation watermarks in the headers and footers. Premium Workspaces produce perfectly clean, official academic documents that are completely ready for immediate university submission.
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">How do Supervisor Corrections work?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                We understand that research is iterative. Every workspace (both Free and Premium) comes with 10 free supervisor correction sessions. If your faculty requests changes, you can feed their comments into the engine to safely rewrite the text. If you exhaust your 10 free edits, you can purchase a bundle of 20 additional edits for 13,000 UGX.
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">How do Mobile Money payments work?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                We accept MTN MoMo and Airtel Money natively. When you trigger an upgrade or purchase a correction bundle, a secure payment prompt will instantly push to your mobile phone. Enter your PIN to validate, and your workspace will unlock immediately.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
