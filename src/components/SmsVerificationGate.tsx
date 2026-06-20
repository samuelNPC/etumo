"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";

interface SmsVerificationGateProps {
  onSuccess: () => void;
  onRequirePayment: () => void; // Triggered if the number already exists
  onCancel: () => void;
}

export default function SmsVerificationGate({ onSuccess, onRequirePayment, onCancel }: SmsVerificationGateProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tracks if the backend confirmed they are eligible for the free project
  const [isEligible, setIsEligible] = useState<boolean | null>(null); 

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setIsEligible(null);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Authentication error. Please log in again.");

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phoneNumber }),
      });

      const data = await res.json();

      // IF THE DATABASE CHECK FAILS (Number already exists)
      if (res.status === 403) {
        setIsEligible(false);
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed to send verification code.");

      // Success! They are eligible and the SMS was sent.
      setIsEligible(true);
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
        
        {/* Close Button */}
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">✕</button>

        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>

        {isEligible === false ? (
          <div className="animate-in fade-in zoom-in duration-300">
             <h3 className="text-2xl font-black text-gray-900 mb-2">Limit Reached</h3>
             <p className="text-sm text-red-600 font-bold mb-6 px-2">
               This phone number has already claimed a free research workspace. You are not eligible for another free report.
             </p>
             <button 
               onClick={onRequirePayment}
               className="w-full bg-black text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-md"
             >
               Pay 54,000 UGX for New Report
             </button>
             <button 
                onClick={() => setIsEligible(null)}
                className="text-xs text-gray-500 hover:text-black uppercase tracking-widest font-bold mt-4 block w-full"
              >
                Use a different number
              </button>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-black text-gray-900 mb-2">
              {step === "phone" ? "Claim Free Project" : "You are eligible!"}
            </h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed px-4">
              {step === "phone" 
                ? "Enter the phone number you can access, we will send you an SMS to verify."
                : `You are eligible for a free research report. Enter the code sent to your phone.`}
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
                  {loading ? "Checking Database..." : "Send SMS Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="••••••"
                  maxLength={6}
                  required
                  className="w-full bg-green-50 border border-green-200 p-4 rounded-xl outline-none focus:border-black text-center font-mono text-2xl tracking-[1em] transition-colors"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={loading || otp.length < 6}
                  className="w-full bg-[#d97706] text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-[#b45309] disabled:bg-gray-400 transition-colors shadow-md"
                >
                  {loading ? "Verifying..." : "Unlock Free Workspace"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
