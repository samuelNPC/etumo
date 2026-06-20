"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";

interface SmsVerificationGateProps {
  onSuccess: () => void;
}

export default function SmsVerificationGate({ onSuccess }: SmsVerificationGateProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Authentication error. Please log in again.");

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send verification code.");

      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Authentication error.");

      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Invalid verification code.");

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300 border border-gray-100 relative overflow-hidden">
        
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>

        <h3 className="text-2xl font-black text-gray-900 mb-2">
          {step === "phone" ? "Claim Free Project" : "Verify SMS Code"}
        </h3>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed px-4">
          {step === "phone" 
            ? "Every student is entitled to one free automated research project. Verify your phone number via SMS to secure yours."
            : `We sent a 6-digit text message to ${phoneNumber}. Please enter it below.`}
        </p>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <input
              type="tel"
              placeholder="e.g., 0784655792"
              required
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-black text-center font-bold tracking-widest transition-colors"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={loading || !phoneNumber}
              className="w-full bg-black text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-md"
            >
              {loading ? "Connecting..." : "Send SMS Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="••••••"
              maxLength={6}
              required
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-black text-center font-mono text-2xl tracking-[1em] transition-colors"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={loading || otp.length < 6}
              className="w-full bg-[#d97706] text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-[#b45309] disabled:bg-gray-400 transition-colors shadow-md"
            >
              {loading ? "Verifying..." : "Unlock Workspace"}
            </button>
            <button 
              type="button"
              onClick={() => setStep("phone")}
              className="text-xs text-gray-400 hover:text-black uppercase tracking-widest font-bold mt-2"
            >
              &larr; Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
