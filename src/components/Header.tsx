"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Originality Center", href: "/originality" },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    setShowAuthModal(false);
    router.push("/workspace");
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

  // Reusable Brand Logo Component for both Header and Drawer
  const BrandLogo = () => (
    <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
      {/* Drop your logo.png or logo.svg into the /public folder */}
      <img src="/logo.png" alt="Etomu Logo" className="w-8 h-8 object-contain" />
      
      <span className="text-2xl font-black tracking-tighter leading-none lowercase">
        <span className="text-[#4285F4]">e</span>
        <span className="text-[#EA4335]">t</span>
        <span className="text-[#FBBC05]">o</span>
        <span className="text-[#34A853]">m</span>
        <span className="text-[#9333EA]">u</span>
      </span>
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-300 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">

          {/* New Multi-colored Logo */}
          <div className="flex items-center">
            <BrandLogo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs font-bold text-gray-600 hover:text-[#d97706] uppercase tracking-wider transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center gap-4 border-l border-gray-300 pl-8">
                <button 
                  onClick={() => router.push("/workspace")}
                  className="bg-[#d97706] text-white px-5 py-2 text-xs font-bold uppercase hover:bg-[#b45309] transition-colors rounded-none"
                >
                  Workspace
                </button>
                <button 
                  onClick={handleLogout}
                  className="border border-gray-300 text-gray-600 px-5 py-2 text-xs font-bold uppercase hover:bg-gray-100 transition-colors rounded-none"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-black text-white px-5 py-2 text-xs font-bold uppercase hover:bg-gray-800 transition-colors rounded-none"
              >
                Login
              </button>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors z-40"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open Menu"
          >
            <span className="block w-5 h-0.5 bg-black -translate-y-1"></span>
            <span className="block w-5 h-0.5 bg-black opacity-100"></span>
            <span className="block w-5 h-0.5 bg-black translate-y-1"></span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div className={`fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        
        {/* Drawer Header with Logo & Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <BrandLogo />
          <button
            className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close Menu"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="flex flex-col p-6 gap-6 mt-2 flex-grow">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-4 hover:text-[#d97706] transition-colors"
            >
              {link.name}
            </Link>
          ))}

          {/* Mobile Auth Buttons Toggle */}
          <div className="mt-auto pb-4">
            {user ? (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Logged in as {user.email?.split('@')[0]}</p>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/workspace");
                  }}
                  className="bg-[#d97706] text-white px-4 py-4 text-sm font-bold uppercase w-full hover:bg-[#b45309] transition-colors rounded-none tracking-widest mb-3"
                >
                  Go to Workspace
                </button>
                <button 
                  onClick={handleLogout}
                  className="border border-gray-300 bg-gray-50 text-gray-600 px-4 py-4 text-sm font-bold uppercase w-full hover:bg-gray-100 transition-colors rounded-none tracking-widest"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowAuthModal(true);
                }}
                className="bg-black text-white px-4 py-4 text-sm font-bold uppercase w-full hover:bg-gray-800 transition-colors rounded-none tracking-widest"
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
