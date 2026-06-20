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
  
  // State for responses and UI flow
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [activeQ, setActiveQ] = useState<number>(1);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
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

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [activeQ]: value,
    }));
  };

  const openQuestion = (qNum: number) => {
    setActiveQ(qNum);
    setIsPopupOpen(true);
  };

  const handleSaveAndClose = () => {
    // Closes popup to return to the main layout as requested
    setIsPopupOpen(false);
    
    // Auto-advance the active pointer in the background so if they hit a generic "continue" it goes to the next
    if (activeQ < (instrument?.questionCount || 0)) {
      setActiveQ(activeQ + 1);
    }
  };

  const handleSkip = () => {
    // Keeps popup open, but transitions to the next question
    if (activeQ < (instrument?.questionCount || 0)) {
      setActiveQ(activeQ + 1);
    } else {
      setIsPopupOpen(false); // If they skip the last question, just close it
    }
  };

  const handleSubmitFinal = async () => {
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
        <div className="bg-white p-10 border border-gray-200 rounded-xl shadow-sm text-center max-w-md w-full">
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

  const answeredCount = Object.keys(answers).filter(k => answers[Number(k)]?.trim() !== "").length;
  const isComplete = answeredCount === instrument.questionCount;

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-32">
      
      {/* 🚨 THE QUESTION LAYOUT (Main Screen) */}
      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        
        <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-2xl shadow-sm mb-6">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <span className="text-[10px] font-bold bg-[#d97706] text-white px-2 py-1 uppercase tracking-widest rounded">Academic Research</span>
            <h2 className="text-xl font-black text-gray-900 mt-4 tracking-tight">Questionnaire Reference</h2>
            <p className="text-xs text-gray-500 mt-1">Please read the questions below, then tap the corresponding button in the answer grid to record your response.</p>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-serif leading-relaxed">
            {instrument.previewText}
          </div>
        </div>

        {/* The Answer Grid */}
        <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Answer Sheet</h3>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {answeredCount} / {instrument.questionCount} Answered
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {Array.from({ length: instrument.questionCount }).map((_, idx) => {
              const qNum = idx + 1;
              const hasAnswer = answers[qNum] && answers[qNum].trim() !== "";
              
              return (
                <button
                  key={qNum}
                  onClick={() => openQuestion(qNum)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm border ${
                    hasAnswer 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : "bg-white border-gray-300 text-gray-700 hover:border-black"
                  }`}
                >
                  {hasAnswer ? `✓ Q${qNum}` : `Q${qNum}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Submit Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Progress</p>
            <p className="text-sm font-black text-gray-900">{Math.round((answeredCount / instrument.questionCount) * 100)}% Completed</p>
          </div>
          <button
            onClick={handleSubmitFinal}
            disabled={!isComplete || isSubmitting}
            className="w-full sm:w-auto flex-1 sm:flex-none bg-black text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest disabled:bg-gray-300 transition-colors shadow-md"
          >
            {isSubmitting ? "Submitting..." : isComplete ? "Submit All Responses" : `Answer all ${instrument.questionCount} to submit`}
          </button>
        </div>
      </div>

      {/* 🚨 THE FOCUSED QUESTION POPUP MODAL */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-[#d97706] uppercase tracking-widest bg-orange-50 px-2 py-1 rounded">Active Input</span>
                <h3 className="text-lg font-black text-gray-900 mt-1">Question {activeQ}</h3>
              </div>
              <button 
                onClick={() => setIsPopupOpen(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-black transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4 font-medium">Type your answer for Question {activeQ} based on the reference document.</p>
              <textarea
                autoFocus
                rows={5}
                placeholder={`Your answer for Q${activeQ}...`}
                className="w-full bg-gray-50 border border-gray-300 p-4 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none text-base sm:text-sm shadow-inner"
                value={answers[activeQ] || ""}
                onChange={(e) => handleAnswerChange(e.target.value)}
              />
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3">
              <button 
                onClick={handleSkip}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Skip Question
              </button>
              <button 
                onClick={handleSaveAndClose}
                className="flex-1 bg-[#d97706] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors shadow-md"
              >
                Save & Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
