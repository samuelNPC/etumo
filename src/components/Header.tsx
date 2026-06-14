"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Workspace", href: "/workspace" },
    { name: "Originality Center", href: "/originality" },
  ];

  // When a user logs in via the Header, just close the modal and push them to their workspace
  const handleLoginSuccess = () => {
    setShowAuthModal(false);
    router.push("/workspace");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-300 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          
          {/* Cleaned Up Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase leading-none">
                Etumo
              </span>
            </Link>
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
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-black text-white px-5 py-2 text-xs font-bold uppercase hover:bg-gray-800 transition-colors rounded-none"
            >
              Login
            </button>
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

      {/* Mobile Drawer Overlay (Blurred Backdrop) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu (Sliding from Right) */}
      <div className={`fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        {/* Drawer Header & Close Button */}
        <div className="flex justify-end p-4 border-b border-gray-100">
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
        <nav className="flex flex-col p-6 gap-6 mt-2">
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
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              setShowAuthModal(true);
            }}
            className="bg-black text-white px-4 py-4 text-sm font-bold uppercase w-full mt-4 hover:bg-gray-800 transition-colors rounded-none tracking-widest"
          >
            Login
          </button>
        </nav>
      </div>

      {/* Global Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
        initializing={false}
      />
    </>
  );
}
