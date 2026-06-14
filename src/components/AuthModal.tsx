"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initializing: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess, initializing }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "ready">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Email/Password Auth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        setMode("ready");
      } else if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        setMode("ready");
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("Password reset email sent. Check your inbox.");
        setMode("login");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/email-already-in-use") setError("This email is already registered.");
      else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") setError("Incorrect email or password.");
      else if (err.code === "auth/user-not-found") setError("No account found with this email.");
      else if (err.code === "auth/weak-password") setError("Password should be at least 6 characters.");
      else setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setMode("ready");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else {
        setError("Google authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div className="bg-white border border-gray-300 max-w-md w-full p-8 shadow-2xl relative">
        
        {mode !== "ready" ? (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              {mode === "login" && "Welcome Back"}
              {mode === "signup" && "Save Your Workspace"}
              {mode === "forgot" && "Reset Password"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {mode === "login" && "Log in to access your saved research projects."}
              {mode === "signup" && "Create an account to securely store your topic and chapters."}
              {mode === "forgot" && "Enter your email to receive a reset link."}
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-500 p-3 text-red-700 text-xs font-bold">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 bg-green-50 border border-green-500 p-3 text-green-700 text-xs font-bold">
                {successMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="University Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 p-3 w-full outline-none focus:border-black rounded-none"
                required
              />
              
              {mode !== "forgot" && (
                <input
                  type="password"
                  placeholder="Secure Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 p-3 w-full outline-none focus:border-black rounded-none"
                  required
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white font-bold p-3 uppercase text-sm tracking-wider hover:bg-gray-800 mt-2 disabled:bg-gray-400 rounded-none transition-colors"
              >
                {loading ? "Processing..." : mode === "login" ? "Login" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </button>
            </form>

            {/* Google Authentication Section */}
            {mode !== "forgot" && (
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <hr className="flex-1 border-gray-300" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or</span>
                  <hr className="flex-1 border-gray-300" />
                </div>
                
                <button
                  type="button" // Important: prevents triggering the form submit
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full border border-gray-300 bg-white text-black font-bold p-3 uppercase text-sm tracking-wider hover:bg-gray-50 flex items-center justify-center gap-3 transition-colors disabled:bg-gray-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            )}

            {/* Navigation Toggles */}
            <div className="mt-6 flex flex-col gap-3 text-center">
              {mode === "login" && (
                <>
                  <button onClick={() => setMode("forgot")} className="text-xs font-bold text-gray-500 hover:text-black uppercase transition-colors">
                    Forgot Password?
                  </button>
                  <button onClick={() => setMode("signup")} className="text-xs font-bold text-[#d97706] hover:text-[#b45309] uppercase transition-colors">
                    Need an account? Sign up
                  </button>
                </>
              )}
              {mode === "signup" && (
                <button onClick={() => setMode("login")} className="text-xs font-bold text-gray-500 hover:text-black uppercase transition-colors">
                  Already have an account? Login
                </button>
              )}
              {mode === "forgot" && (
                <button onClick={() => setMode("login")} className="text-xs font-bold text-gray-500 hover:text-black uppercase transition-colors">
                  Back to Login
                </button>
              )}
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2 transition-colors"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl font-bold">✓</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Account Secured</h2>
            <p className="text-sm text-gray-500 mb-8">Your session is active and your topic is saved.</p>
            
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
