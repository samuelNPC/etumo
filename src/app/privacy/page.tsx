import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data We Collect | Etomu Privacy Policy",
  description: "Understand exactly what data Etomu collects, how we protect it, and how it is used to power your research workspace.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-16 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter mb-4">
            Data We Collect
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Effective Date: June 14, 2026 <br />
            We believe in complete transparency. Here is exactly what data we collect, why we need it, and how we protect your academic work.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 mt-12 space-y-12 animate-in fade-in duration-700 delay-100">
        
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">1. Information You Provide to Us</h2>
          <ul className="list-disc pl-5 space-y-3 text-gray-600 leading-relaxed">
            <li><strong className="text-gray-800">Account Information:</strong> When you log in via Google, we collect your email address and basic profile information to create and secure your workspace.</li>
            <li><strong className="text-gray-800">Research Data:</strong> We store the topics, chapter drafts, and text you input into the workspace or Originality Center so you don't lose your progress across sessions.</li>
            <li><strong className="text-gray-800">University Guidelines:</strong> Files you upload (PDFs or Word documents) are processed strictly to extract formatting rules and structural guidelines.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">2. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-3 text-gray-600 leading-relaxed">
            <li>To provide, maintain, and improve the Etomu workspace.</li>
            <li>To process your text through our AI models (like OpenAI) solely for the purpose of generating topics, structuring chapters, or remediating similarity issues.</li>
            <li>To sync your progress across devices using Firebase's secure database infrastructure.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">3. Third-Party AI Processing</h2>
          <p className="text-gray-600 leading-relaxed">
            To provide our core features, parts of your text are sent to third-party AI providers (such as OpenAI) via secure APIs. We do not allow these third-party providers to use your personal research data to train their public models. Your work remains yours.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">4. Data Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We use Google Firebase for authentication and database management. Your data is encrypted in transit and at rest. Access to your workspace is strictly tied to your authenticated user ID.
          </p>
        </section>

        <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-8">
          <h3 className="font-bold text-blue-900 mb-2">Have questions about your data?</h3>
          <p className="text-sm text-blue-800">
            If you wish to delete your account or have your research data permanently removed from our servers, please contact our support team.
          </p>
        </section>

      </div>
    </main>
  );
}
