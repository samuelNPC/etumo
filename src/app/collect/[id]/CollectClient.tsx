"use client";

import { useEffect, useState } from "react";

interface InstrumentData {
  questionCount: number;
  sectionCount: number;
  previewText: string;
  deadline?: string; // 🚨 ADDED DEADLINE PROPERTY
}

interface ParsedQuestion {
  id: number;
  text: string;
}

interface CollectClientProps {
  instrumentId: string;
  instrument: InstrumentData;
}

export default function CollectClient({ instrumentId, instrument }: CollectClientProps) {
  const [preamble, setPreamble] = useState<string>("");
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [activeQuestion, setActiveQuestion] = useState<ParsedQuestion | null>(null);
  const [tempAnswer, setTempAnswer] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Parse the pre-fetched text immediately on load
  useEffect(() => {
    if (instrument?.previewText) {
      parseQuestionnaireText(instrument.previewText, instrument.questionCount);
    }
  }, [instrument]);

  const parseQuestionnaireText = (text: string, count: number) => {
    const firstQMatch = text.match(/\b1\.\s/);
    
    if (!firstQMatch) {
      setPreamble(text);
      setQuestions(Array.from({ length: count }).map((_, i) => ({ id: i + 1, text: `Question ${i + 1}` })));
      return;
    }

    setPreamble(text.substring(0, firstQMatch.index).trim());
    let remainingText = text.substring(firstQMatch.index!);
    const parsed: ParsedQuestion[] = [];

    for (let i = 1; i <= count; i++) {
      const nextQ = i + 1;
      const nextRegex = new RegExp(`\\n${nextQ}\\.\\s`);
      const nextMatch = remainingText.match(nextRegex);

      if (nextMatch) {
        parsed.push({ id: i, text: remainingText.substring(0, nextMatch.index).trim() });
        remainingText = remainingText.substring(nextMatch.index!).trim();
      } else {
        parsed.push({ id: i, text: remainingText.trim() });
        break;
      }
    }
    setQuestions(parsed);
  };

  const openQuestionModal = (q: ParsedQuestion) => {
    setTempAnswer(answers[q.id] || "");
    setActiveQuestion(q);
  };

  const saveAnswer = () => {
    if (activeQuestion) {
      setAnswers(prev => ({ ...prev, [activeQuestion.id]: tempAnswer.trim() }));
      setActiveQuestion(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submit-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrumentId,
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Powered by Etomu Engine</p>
        </div>
      </div>
    );
  }

  // 🚨 ADDED: CHECK IF DEADLINE HAS PASSED
  const isClosed = instrument.deadline ? new Date() > new Date(instrument.deadline) : false;

  if (isClosed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-10 border border-gray-200 rounded-2xl shadow-xl text-center max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Survey Closed</h1>
          <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
            The researcher has officially closed data collection for this instrument. Thank you for your interest!
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Powered by Etomu Engine</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter(k => answers[Number(k)] !== "").length;
  const isComplete = answeredCount === instrument.questionCount;

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-32">
      
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <span className="text-[10px] font-bold bg-[#d97706] text-white px-2 py-1 uppercase tracking-widest rounded">Academic Research</span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-3 tracking-tight">Questionnaire Reference</h2>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(answeredCount / instrument.questionCount) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">{answeredCount} of {instrument.questionCount} Answered</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        
        {preamble && (
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-6">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Instructions
            </h3>
            <div className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed font-serif">
              {preamble.replace(/#.*?Questionnaire/, '').trim()} 
            </div>
          </div>
        )}

        {questions.map((q) => {
          const hasAnswer = !!answers[q.id];
          return (
            <div 
              key={q.id} 
              onClick={() => openQuestionModal(q)}
              className={`bg-white border p-5 rounded-2xl shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${hasAnswer ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${hasAnswer ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-[#d97706]'}`}>
                  {hasAnswer ? 'Answered ✓' : 'Pending'}
                </span>
                <span className="text-xs font-bold text-gray-400">Q{q.id}</span>
              </div>
              
              <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug font-serif">
                {q.text}
              </h4>

              {hasAnswer && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 font-medium truncate">
                  {answers[q.id]}
                </div>
              )}
              
              {!hasAnswer && (
                <button className="mt-4 w-full bg-gray-50 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">
                  Tap to Answer
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 sm:p-6 z-20">
        <div className="max-w-3xl mx-auto flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={!isComplete || isSubmitting}
            className="w-full bg-black text-white font-extrabold py-4 rounded-xl uppercase text-xs sm:text-sm tracking-widest hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:-translate-y-1 disabled:hover:-translate-y-0"
          >
            {isSubmitting ? "Submitting..." : isComplete ? "Submit Responses" : "Answer all questions to submit"}
          </button>
        </div>
      </div>

      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question {activeQuestion.id}</span>
              <button 
                onClick={() => setActiveQuestion(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 font-serif leading-snug">
                {activeQuestion.text}
              </h3>
              
              <textarea
                autoFocus
                rows={4}
                placeholder="Type your answer here..."
                className="w-full bg-gray-50 border border-gray-300 p-4 rounded-xl outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] transition-all text-base sm:text-lg resize-y"
                value={tempAnswer}
                onChange={(e) => setTempAnswer(e.target.value)}
              />
            </div>

            <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveQuestion(null)}
                className="bg-gray-100 text-gray-700 font-bold py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
              >
                Skip / Close
              </button>
              <button 
                onClick={saveAnswer}
                disabled={!tempAnswer.trim()}
                className="bg-[#d97706] text-white font-bold py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-[#b45309] disabled:bg-gray-300 transition-all shadow-md"
              >
                Save Answer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
