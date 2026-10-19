import React from "react";
import Link from "next/link";
import { Mail, Globe, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-blue-100 bg-white text-slate-600 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {/* Brand Info */}
          <div>
            <h3 className="font-bold text-sm text-blue-950 mb-2">Subtitle Translator</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fast, privacy-focused SRT subtitle translation. Supporting over 40 languages with Google Translate and Gemini AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-xs text-blue-900 uppercase tracking-wider mb-2">
              Navigation
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Translator Tool
                </Link>
              </li>
              <li>
                <Link href="/guide" className="hover:text-blue-600 transition-colors">
                  API Key Guide
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Privacy */}
          <div>
            <h4 className="font-semibold text-xs text-blue-900 uppercase tracking-wider mb-2">
              Contact & Support
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Mail size={14} className="text-blue-600 shrink-0" />
                <a
                  href="mailto:support@subtitletranslator.app"
                  className="hover:text-blue-600 transition-colors"
                >
                  support@subtitletranslator.app
                </a>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Shield size={13} className="text-emerald-600 shrink-0" />
                <span>Files processed in-memory. Zero file storage.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-blue-50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} Subtitle Translator. All rights reserved.</p>
          <p className="text-[11px]">Designed for high-speed subtitle localization.</p>
        </div>
      </div>
    </footer>
  );
}
