"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  // Track Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    setShowAuthModal(false);
    router.push("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path: string) => pathname === path;

  const BrandLogo = () => (
    <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
      <img src="/logo.png" alt="Etomu Logo" className="w-10 h-10 object-contain" />
      <span className="text-3xl sm:text-4xl font-black tracking-tighter leading-none lowercase">
        <span className="text-[#4285F4]">e</span>
        <span className="text-[#EA4335]">t</span>
        <span className="text-[#FBBC05]">o</span>
        <span className="text-[#34A853]">m</span>
        <span className="text-[#9333EA]">u</span>
      </span>
    </Link>
  );

  const AnimatedMenuButton = ({ isOpen, onClick }: { isOpen: boolean, onClick: () => void }) => (
    <button
      className="md:hidden flex flex-col justify-center items-center w-10 h-10 group focus:outline-none"
      onClick={onClick}
      aria-label="Toggle Menu"
    >
      <span className={`block w-6 h-[2px] bg-black rounded-full transition-transform duration-300 ease-in-out origin-center ${isOpen ? "translate-y-[6px] rotate-45" : "-translate-y-1.5"}`}></span>
      <span className={`block w-6 h-[2px] bg-black rounded-full transition-opacity duration-300 ease-in-out ${isOpen ? "opacity-0" : "opacity-100"}`}></span>
      <span className={`block w-6 h-[2px] bg-black rounded-full transition-transform duration-300 ease-in-out origin-center ${isOpen ? "-translate-y-[6px] -rotate-45" : "translate-y-1.5"}`}></span>
    </button>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">

          <BrandLogo />

          <nav className="hidden md:flex gap-8 items-center">
            <Link href="/" className={`text-sm transition-colors ${isActive("/") ? "text-black font-bold" : "text-gray-600 font-semibold hover:text-black"}`}>Home</Link>
            <Link href="/dashboard" className={`text-sm transition-colors ${isActive("/dashboard") ? "text-black font-bold" : "text-gray-600 font-semibold hover:text-black"}`}>My Projects</Link>

            <div className="relative group py-4">
              <button className={`flex items-center gap-1 text-sm transition-colors ${isActive("/originality") || isActive("/data-collector") ? "text-black font-bold" : "text-gray-600 font-semibold hover:text-black"}`}>
                Research Tools
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              <div className="absolute top-12 left-0 w-48 bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                <Link href="/originality" className={`block px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${isActive("/originality") ? "text-black font-bold bg-gray-50" : "text-gray-700"}`}>Originality Center</Link>
                <Link href="/data-collector" className={`block px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${isActive("/data-collector") ? "text-[#d97706] font-bold bg-orange-50/50" : "text-gray-700"}`}>Data Collector</Link>
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-4 border-l border-gray-300 pl-8">
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="text-sm font-bold text-gray-800 hover:text-[#d97706] transition-colors"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-600 px-5 py-2.5 text-sm font-bold hover:bg-gray-200 transition-colors rounded-lg"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l border-gray-300 pl-8">
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="bg-black text-white px-6 py-2.5 text-sm font-bold hover:bg-gray-800 transition-colors rounded-lg"
                >
                  Login
                </button>
              </div>
            )}
          </nav>

          <AnimatedMenuButton isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        </div>
      </header>

      {/* Static spacer to prevent content from hiding behind the fixed header */}
      <div className="h-16 w-full" aria-hidden="true" />

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl ${
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}>

        <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16">
          <BrandLogo />
          <AnimatedMenuButton isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(false)} />
        </div>

        <nav className="flex flex-col px-6 py-4 flex-grow overflow-y-auto">
          <div className="flex flex-col">
            <Link href="/" className={`text-lg py-4 border-b border-gray-200 transition-colors ${isActive("/") ? "font-bold text-black" : "font-normal text-gray-700"}`}>Home</Link>
            <Link href="/dashboard" className={`text-lg py-4 border-b border-gray-200 transition-colors ${isActive("/dashboard") ? "font-bold text-black" : "font-normal text-gray-700"}`}>My Projects</Link>
            <Link href="/originality" className={`text-lg py-4 border-b border-gray-200 transition-colors ${isActive("/originality") ? "font-bold text-black" : "font-normal text-gray-700"}`}>Originality Center</Link>
            <Link href="/data-collector" className={`text-lg py-4 border-b border-gray-200 transition-colors ${isActive("/data-collector") ? "font-bold text-[#d97706]" : "font-normal text-gray-700"}`}>Data Collector</Link>
          </div>

          <div className="flex flex-col gap-5 pt-6">
            <Link href="/about" className="text-base font-medium text-gray-500 hover:text-black">About</Link>
            <Link href="/how-to" className="text-base font-medium text-gray-500 hover:text-black">How to use</Link>
            <Link href="/privacy" className="text-base font-medium text-gray-500 hover:text-black">Data we collect</Link>
            <Link href="/terms" className="text-base font-medium text-gray-500 hover:text-black">Terms</Link>
          </div>

          <div className="mt-auto pt-8 pb-4">
            {user ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-500 mb-2">Signed in as {user.email?.split('@')[0]}</p>
                <button 
                  onClick={() => router.push("/workspace")}
                  className="bg-black text-white px-4 py-4 text-base font-bold w-full rounded-lg transition-colors"
                >
                  Enter Workspace
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-800 px-4 py-4 text-base font-bold w-full rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowAuthModal(true);
                }}
                className="bg-black text-white px-4 py-4 text-base font-bold w-full rounded-lg transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </nav>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
        initializing={false}
      />
    </>
  );
}
