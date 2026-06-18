"use client";

import { useState, useEffect } from "react";

interface PaymentModalProps {
  amount: number;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentModal({ amount, description, onSuccess, onCancel }: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<"input" | "processing" | "waiting_for_pin" | "success" | "failed">("input");
  const [errorMessage, setErrorMessage] = useState("");
  const [reference, setReference] = useState<string | null>(null);

  // Poll for status when waiting for PIN
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (step === "waiting_for_pin" && reference) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/pay/status?reference=${reference}`);
          const data = await res.json();

          if (data.status === "Success") {
            setStep("success");
            clearInterval(interval);
            setTimeout(() => onSuccess(), 2000); // Trigger the unlock after 2 seconds
          } else if (data.status === "Failed") {
            setStep("failed");
            setErrorMessage("Transaction failed or was cancelled by the user.");
            clearInterval(interval);
          }
          // If status is "Pending", it just loops and checks again
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 4000); // Poll every 4 seconds
    }

    return () => clearInterval(interval);
  }, [step, reference, onSuccess]);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setErrorMessage("Please enter a valid phone number (e.g., 077XXXXXXX)");
      return;
    }

    setStep("processing");
    setErrorMessage("");

    try {
      const res = await fetch("/api/pay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, amount, description })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setReference(data.reference);
      setStep("waiting_for_pin");
    } catch (err: any) {
      setStep("input");
      setErrorMessage(err.message || "Failed to initiate payment. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white max-w-md w-full p-8 shadow-2xl relative border-t-4 border-[#d97706]">
        
        {step !== "waiting_for_pin" && step !== "success" && (
          <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2 text-xl transition-colors">✕</button>
        )}

        {/* STEP 1: INPUT */}
        {step === "input" && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Checkout</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">{description}</p>

            <div className="bg-orange-50 border border-orange-200 p-4 mb-6 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-900">Total Due</span>
              <span className="text-xl font-black text-[#d97706]">{amount.toLocaleString()} UGX</span>
            </div>

            {errorMessage && <p className="text-xs font-bold text-red-600 bg-red-50 p-3 mb-4 border border-red-200">{errorMessage}</p>}

            <form onSubmit={handleInitiatePayment}>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">Mobile Money Number</label>
              <input
                type="tel"
                placeholder="077XXXXXXX or 075XXXXXXX"
                className="w-full border-2 border-gray-300 p-4 outline-none focus:border-black font-mono text-lg mb-6 transition-colors"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <button type="submit" className="w-full bg-black text-white py-4 uppercase text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors shadow-md">
                Pay Now
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-6 opacity-50">
              <span className="text-[10px] font-bold uppercase tracking-widest">Supported:</span>
              <span className="text-xs font-black">MTN MoMo</span>
              <span className="text-xs font-black">Airtel Money</span>
            </div>
          </div>
        )}

        {/* STEP 2: PROCESSING INITIATION */}
        {step === "processing" && (
          <div className="text-center py-8 animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#d97706] rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Connecting to Network...</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Generating secure transaction</p>
          </div>
        )}

        {/* STEP 3: WAITING FOR USER TO ENTER PIN */}
        {step === "waiting_for_pin" && (
          <div className="text-center py-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg className="w-10 h-10 text-[#d97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Check your phone</h3>
            <p className="text-sm text-gray-600 mb-8 font-medium leading-relaxed">
              A payment prompt has been sent to <b className="text-black">{phoneNumber}</b>. <br/> Please enter your Mobile Money PIN to complete the transaction.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-bold text-[#d97706] uppercase tracking-widest">
              <div className="w-3 h-3 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
              Waiting for confirmation...
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "success" && (
          <div className="text-center py-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h3 className="text-xl font-black text-green-700 mb-2 tracking-tight uppercase tracking-widest">Payment Received</h3>
            <p className="text-sm text-gray-600 font-medium">Unlocking your document now...</p>
          </div>
        )}

        {/* STEP 5: FAILED */}
        {step === "failed" && (
          <div className="text-center py-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-red-600">✕</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Payment Failed</h3>
            <p className="text-sm text-gray-600 mb-8 font-medium">{errorMessage}</p>
            <button onClick={() => setStep("input")} className="w-full bg-black text-white py-4 uppercase text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors shadow-md">
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
