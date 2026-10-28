"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Captions, Menu, X, Sun } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Translator", href: "/" },
    { name: "API Key Guide", href: "/guide" },
    { name: "About", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-3.5 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform flex items-center justify-center">
            <Captions size={18} className="stroke-[2.2]" />
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">
            Subtitle Translator
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-full border border-slate-100">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badge & Theme Icon */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
            <Sun size={17} />
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-2 border-t border-slate-100 mt-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2 flex items-center justify-between px-3.5">
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
