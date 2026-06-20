"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface InstrumentData {
  questionCount: number;
  sectionCount: number;
  previewText: string;
}

export default function PublicCollectionPage({ params }: { params: { id: string } }) {
  const [instrument, setInstrument] = useState<InstrumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State to hold the user's answers (e.g., { 1: "Yes", 2: "Male", 3: "Agreed" })
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchInstrument = async () => {
      try {
        const docRef = doc(db, "instruments", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInstrument(docSnap.data() as InstrumentData);
        } else {
          setError("This research instrument does not exist or has been removed.");
        }
      } catch (err) {
        setError("Failed to load the questionnaire.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstrument();
  }, [params.id]);

  const handleAnswerChange = (questionNumber: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/submit-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrumentId: params.id,
          answers: answers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsSuccess(true);
    } catch (err: any) {
      alert(err.message || "Failed to submit responses.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#d97706] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !instrument) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center max-w-md w-full">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Instrument Not Found</h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-10 border border-gray-200 rounded-2xl shadow-xl text-center max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Response Recorded</h1>
          <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
            Thank you for participating. Your response has been securely transmitted to the researcher's database.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Powered by Etomu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-8 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Side: The Questionnaire Text */}
        <div className="w-full md:w-1/2 bg-white p-6 sm:p-8 border border-gray-200 rounded-2xl shadow-sm sticky top-8">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <span className="text-[10px] font-bold bg-[#d97706] text-white px-2 py-1 uppercase tracking-widest rounded">Academic Research</span>
            <h2 className="text-xl font-black text-gray-900 mt-4 tracking-tight">Questionnaire Reference</h2>
            <p className="text-xs text-gray-500 mt-1">Please read the questions below and fill your answers in the right panel.</p>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 h-[60vh] overflow-y-auto whitespace-pre-wrap font-serif leading-relaxed pr-2">
            {instrument.previewText}
          </div>
        </div>

        {/* Right Side: The Dynamic Answer Sheet */}
        <div className="w-full md:w-1/2 bg-white p-6 sm:p-8 border border-gray-200 rounded-2xl shadow-xl">
          <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-widest border-b border-gray-100 pb-4">
            Official Answer Sheet
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {Array.from({ length: instrument.questionCount }).map((_, idx) => {
              const qNum = idx + 1;
              return (
                <div key={qNum} className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">
                    Question {qNum}
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={`Type your answer for Q${qNum} here...`}
                    className="w-full bg-white border border-gray-300 p-3 rounded-lg outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] transition-all resize-y text-sm"
                    value={answers[qNum] || ""}
                    onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                  />
                </div>
              );
            })}

            <button
              type="submit"
              disabled={isSubmitting || Object.keys(answers).length !== instrument.questionCount}
              className="w-full bg-black text-white font-extrabold py-4 rounded-xl uppercase text-sm tracking-widest hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md mt-4"
            >
              {isSubmitting ? "Submitting securely..." : "Submit Responses"}
            </button>
            <p className="text-center text-[10px] text-gray-400 font-medium mt-4 uppercase tracking-widest">
              Please answer all {instrument.questionCount} questions to submit
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
