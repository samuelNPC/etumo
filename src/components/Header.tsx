"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Workspace", href: "/workspace" },
    { name: "Originality Center", href: "/originality" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-300 bg-white shadow-sm">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase leading-none">
              Etumo<span className="text-[#d97706]">.</span>
            </span>
            <span className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              Finish Faster
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
          <button className="bg-black text-white px-5 py-2 text-xs font-bold uppercase hover:bg-gray-800 transition-colors">
            Login
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <span className={`block w-5 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1" : "-translate-y-1"}`}></span>
          <span className={`block w-5 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`}></span>
          <span className={`block w-5 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : "translate-y-1"}`}></span>
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-300 bg-white">
          <nav className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
               <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-bold text-gray-800 border border-transparent hover:border-gray-200 hover:bg-gray-50 p-3 uppercase tracking-wider transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <button className="bg-black text-white px-4 py-3 text-xs font-bold uppercase w-full mt-4 hover:bg-gray-800 transition-colors">
              Login
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
