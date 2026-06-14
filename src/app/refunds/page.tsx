import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Etomu",
  description: "Understand Etomu's refund policy regarding AI generation, document exports, and Mobile Money payments.",
};

export default function RefundsPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-16 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter mb-4">
            Refund Policy
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Because Etomu relies on high-end AI processing and immediate digital delivery, our refund policy is strict but fair.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 mt-12 space-y-12 animate-in fade-in duration-700 delay-100">
        
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The General Rule: No Refunds</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Due to the digital nature of Etomu and the hard costs associated with processing text through advanced AI models (API compute costs), <strong className="text-gray-900">all payments are final and non-refundable</strong> once a generation, remediation, or document export process has been initiated.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Prices for document downloads (e.g., UGX 20,000) and Originality Center processing (e.g., UGX 25,000) are clearly displayed before you are asked to confirm the Mobile Money transaction. By clicking proceed, you agree to this charge.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Exceptions to the Rule</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We will gladly issue a refund or account credit under the following rare technical circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-3 text-gray-600 leading-relaxed">
            <li><strong className="text-gray-800">Double Charges:</strong> If our payment gateway accidentally charges your Mobile Money account twice for the exact same document export.</li>
            <li><strong className="text-gray-800">Critical System Failure:</strong> If you paid to export a document or remediate text, the money was deducted, but the Etomu servers crashed and completely failed to deliver your output. (Note: Output that you simply "do not like" does not qualify as a system failure).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Academic Outcomes</h2>
          <p className="text-gray-600 leading-relaxed">
            We do not issue refunds based on academic outcomes. Etomu provides formatting and structural assistance; we cannot guarantee specific grades, supervisor approvals, or 0% scores on third-party AI detectors. You pay for the computing process, not the university grade.
          </p>
        </section>

        <section className="bg-gray-100 p-6 rounded-2xl border border-gray-200 mt-8">
          <h3 className="font-bold text-gray-900 mb-2">How to Request a Review</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you believe you were affected by a technical failure or double charge, please reach out to our support team within 48 hours of the transaction.
          </p>
          <a href="mailto:support@etomu.com" className="inline-block bg-black text-white font-bold py-3 px-6 rounded-lg text-sm hover:bg-gray-800 transition-colors shadow-sm">
            Contact Support
          </a>
        </section>

      </div>
    </main>
  );
}
