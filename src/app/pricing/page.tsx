import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Etomu",
  description: "Simple, transparent pricing. Build your research for free, and only pay for document exports and bulk AI remediation.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* --- HERO SECTION --- */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-16 px-4 sm:px-8 text-center">
        <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700">
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold uppercase tracking-widest text-blue-700 mb-6">
            Pay As You Go
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter mb-6">
            Simple, transparent pricing.
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            Build your entire research structure for free. Only pay when you need to export a perfectly formatted document or bypass heavy AI detectors.
          </p>
        </div>
      </div>

      {/* --- PRICING CARDS --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-16 animate-in fade-in duration-700 delay-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Free Tier */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Workspace Draft</h3>
            <div className="mb-6">
              <span className="text-4xl font-black text-gray-900">Free</span>
              <span className="text-gray-500 font-medium ml-2">forever</span>
            </div>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Everything you need to start researching, generate topics, and structure your chapters.
            </p>
            <ul className="flex flex-col gap-4 mb-8 flex-grow">
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <svg className="w-5 h-5 text-[#34A853] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Unlimited Topic Generation
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <svg className="w-5 h-5 text-[#34A853] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                AI Chapter Structuring
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <svg className="w-5 h-5 text-[#34A853] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                20 Free Text Remediations / day
              </li>
            </ul>
            <Link href="/" className="w-full block text-center bg-gray-100 text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">
              Start Building
            </Link>
          </div>

          {/* Card 2: Document Export (The Core Monetization) */}
          <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-xl flex flex-col h-full relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Export to DOCX</h3>
            <div className="mb-6">
              <span className="text-4xl font-black text-gray-900">20,000</span>
              <span className="text-gray-500 font-medium ml-2">UGX / export</span>
            </div>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Unlock a perfectly formatted Microsoft Word document tailored to your university's guidelines.
            </p>
            <ul className="flex flex-col gap-4 mb-8 flex-grow">
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <svg className="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Strict Institutional Formatting
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <svg className="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Ready-to-print DOCX file
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <svg className="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Instant Mobile Money Checkout
              </li>
            </ul>
            <Link href="/workspace" className="w-full block text-center bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-md">
              Go to Workspace
            </Link>
          </div>

          {/* Card 3: Originality Pro */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Originality Pro</h3>
            <div className="mb-6 flex flex-col">
              <div>
                <span className="text-4xl font-black text-[#d97706]">10k</span>
                <span className="text-gray-500 font-medium ml-2">UGX / 100 uses</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Exhausted your 20 free daily limits? Unlock bulk text humanization to bypass heavy AI detectors.
            </p>
            <ul className="flex flex-col gap-4 mb-8 flex-grow">
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <svg className="w-5 h-5 text-[#d97706] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                100 Fast Text Remediations
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <svg className="w-5 h-5 text-[#d97706] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Advanced Turnitin Bypass
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <svg className="w-5 h-5 text-[#d97706] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Human-level Tone restructuring
              </li>
            </ul>
            <Link href="/originality" className="w-full block text-center bg-[#d97706] text-white font-bold py-4 rounded-xl hover:bg-[#b45309] transition-colors shadow-md">
              Unlock Pro
            </Link>
          </div>

        </div>

        {/* --- ADD ON SECTION --- */}
        <div className="mt-12 bg-blue-50 border border-blue-100 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Have a complete document already?</h3>
            <p className="text-gray-600 font-medium">
              Upload your entire PDF or Word document in the Originality Center. We will fix the similarity and AI detection across the entire file at once for just <strong className="text-gray-900">25,000 UGX</strong>.
            </p>
          </div>
          <Link href="/originality" className="shrink-0 bg-[#4285F4] text-white font-bold py-4 px-8 rounded-xl hover:bg-[#3367D6] transition-colors shadow-md">
            Upload Document
          </Link>
        </div>

        {/* --- FAQ SECTION --- */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2">How do I pay?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                We accept all major Mobile Money networks in Uganda (MTN MoMo and Airtel Money). When you click export or upgrade, a secure prompt will appear on your phone to approve the transaction.
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2">Is the daily free limit really free?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yes. Every user gets 20 free text remediations per day in the Originality Center to help you fix small paragraphs. The counter automatically resets at midnight.
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2">What happens if my download fails after paying?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your workspace saves everything to your account. If your internet disconnects during a download, you can log back in and re-download that specific document without being charged twice. If you encounter a system failure, our support team will manually provide your document or issue a refund.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
