"use client";

import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initializing: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess, initializing }: AuthModalProps) {
  const [authPhase, setAuthPhase] = useState<"login" | "ready">("login");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Simulate API delay for creating an account/logging in
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAuthPhase("ready");
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div className="bg-white border border-gray-300 max-w-md w-full p-8 shadow-2xl">
        
        {authPhase === "login" ? (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Save Your Workspace</h2>
            <p className="text-sm text-gray-500 mb-6">Create an account to securely store your topic and generate your chapters.</p>
            
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="University Email Address"
                className="border border-gray-300 p-3 w-full outline-none focus:border-[#d97706] rounded-none"
                required
              />
              <input
                type="password"
                placeholder="Secure Password"
                className="border border-gray-300 p-3 w-full outline-none focus:border-[#d97706] rounded-none"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white font-bold p-3 uppercase text-sm tracking-wider hover:bg-gray-800 mt-2 disabled:bg-gray-400 rounded-none transition-colors"
              >
                {loading ? "Authenticating..." : "Create Account / Login"}
              </button>
            </form>
            
            <button 
              onClick={onClose}
              className="w-full text-center mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl font-bold">✓</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Account Secured</h2>
            <p className="text-sm text-gray-500 mb-8">Your topic has been saved to your profile.</p>
            
            <button
              onClick={onSuccess}
              disabled={initializing}
              className="w-full bg-[#d97706] text-white font-bold py-4 uppercase text-sm tracking-wider hover:bg-[#b45309] transition-colors rounded-none disabled:bg-gray-400"
            >
              {initializing ? "Configuring OS..." : "Ready to Continue?"}
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}
