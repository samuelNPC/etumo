"use client";

import { useState } from "react";

export default function Home() {
  const [course, setCourse] = useState("");
  const [interest, setInterest] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Added error state

  const generateTopics = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Reset error state on new submission
    setTopics([]);  // Clear previous topics

    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course,
          faculty: "Business", // Hardcoded for this test
          interest,
        }),
      });

      const data = await response.json();
      
      // Check if the server returned an error status or error message
      if (!response.ok || data.error) {
        setError(data.error || `Server Error: ${response.status}`);
      } else if (data.topics) {
        setTopics(data.topics);
      }
    } catch (err: any) {
      console.error("Failed to fetch topics", err);
      // Catch network errors or JSON parsing failures
      setError(err.message || "A critical network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-8 mt-12">
      <h1 className="text-4xl font-bold mb-2">The evolution of academic research starts here.</h1>
      <p className="text-gray-600 mb-8">Instant Turnitin refinement and faculty-aligned chapter generation.</p>

      {/* NEW: Error Display Box */}
      {error && (
        <div className="mb-6 border border-red-500 bg-red-50 p-4 text-red-700 text-sm font-bold shadow-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="border border-gray-300 p-6 bg-gray-50">
        <form onSubmit={generateTopics} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="What is your course? (e.g., Procurement)"
            className="border border-gray-400 p-3 w-full bg-white outline-none"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="What is your research interest? (e.g., Digital Systems)"
            className="border border-gray-400 p-3 w-full bg-white outline-none"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#d97706] text-white font-bold p-3 w-full hover:bg-[#b45309] transition-colors disabled:bg-gray-400"
          >
            {loading ? "Generating Topics..." : "Get Started Now"}
          </button>
        </form>
      </div>

      {/* Render the generated topics dynamically */}
      {topics.length > 0 && (
        <div className="mt-8 border border-gray-300 p-6">
          <h3 className="font-bold text-xl mb-4">Your Generated Topics:</h3>
          <ul className="flex flex-col gap-3">
            {topics.map((topic, index) => (
              <li key={index} className="border border-gray-200 p-4 bg-white shadow-sm">
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
