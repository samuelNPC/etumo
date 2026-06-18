import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Limitations | Etomu",
  description: "Understand the manual steps required after generating your research project.",
};

export default function LimitationsPage() {
  const limitations = [
    {
      icon: "📐",
      title: "Conceptual Frameworks",
      description: "Etomu will not generate the visual diagram for your Conceptual Framework. Because every supervisor prefers different shapes, arrows, and relational designs (moderating vs. intervening variables), you must draw the final diagram yourself in Microsoft Word using the text variables we provide."
    },
    {
      icon: "🪪",
      title: "Personal Metadata",
      description: "For privacy and security reasons, Etomu does not ask for your Registration Number, Student Name, Supervisor's Name, or University Year. When you download the final DOCX, you must manually fill in these placeholders on the title page and declaration."
    },
    {
      icon: "📊",
      title: "Table & Chart Formatting",
      description: "While our engine structures your Chapter 4 data presentation beautifully, complex statistical tables (like ANOVA or Regression outputs) may need minor border adjustments or column resizing once opened in Microsoft Word to perfectly match your faculty's margins."
    },
    {
      icon: "✍️",
      title: "Supervisor Preferences",
      description: "Etomu writes using standard academic tone based on your uploaded manual. However, academic writing is highly subjective. If your supervisor prefers a specific phrasing style, you must use your 2 Free Supervisor Corrections to train the AI to adapt."
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-16 px-4 sm:px-8 text-center">
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter mb-4">
          System Limitations
        </h1>
        <p className="text-gray-500 font-medium max-w-lg mx-auto">
          Etomu does 90% of the heavy lifting. Here is the 10% you still need to do manually before submission.
        </p>
      </div>

      {/* Limitations Grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {limitations.map((item, index) => (
            <div key={index} className="bg-white p-8 border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 text-2xl flex items-center justify-center rounded-xl mb-6">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/how-to" className="text-sm font-bold text-[#d97706] hover:text-[#b45309] uppercase tracking-widest transition-colors">
            &larr; Read the How-To Guide
          </Link>
        </div>
      </div>
    </main>
  );
}
