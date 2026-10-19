import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Key,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Zap,
  Lock
} from "lucide-react";

export const metadata: Metadata = {
  title: "How to Get a Free Gemini API Key - Subtitle Translator",
  description:
    "Step-by-step guide on how to get a free Google Gemini API key from Google AI Studio to translate subtitles using AI.",
};

export default function ApiKeyGuidePage() {
  const steps = [
    {
      step: "01",
      title: "Go to Google AI Studio",
      description:
        "Open your browser and visit Google AI Studio's API Key management page at aistudio.google.com/app/apikey. Sign in with any standard Google (Gmail) account.",
      actionLink: "https://aistudio.google.com/app/apikey",
      actionText: "Open Google AI Studio",
    },
    {
      step: "02",
      title: "Click 'Create API Key'",
      description:
        "On the dashboard, click the blue 'Create API key' button. If prompted to select a Google Cloud project, choose an existing project or click 'Create project in new project'.",
    },
    {
      step: "03",
      title: "Copy Your API Key",
      description:
        "A popup will display your newly generated secret key (it begins with 'AIzaSy...'). Click the 'Copy' icon to copy the key to your clipboard.",
    },
    {
      step: "04",
      title: "Paste into Subtitle Translator",
      description:
        "Return to Subtitle Translator, select 'Gemini Flash' as your translation engine, and paste your key into the Gemini API Key input field. Your key is saved locally in your browser only.",
    },
  ];

  const faqs = [
    {
      q: "Is the Gemini API key really free?",
      a: "Yes. Google provides a generous free tier for Google AI Studio with up to 15 requests per minute, which is more than enough to translate full movies and videos without paying anything.",
    },
    {
      q: "Where is my API key stored?",
      a: "Your key is saved exclusively in your browser's localStorage. It is never transmitted to, saved on, or logged by our servers.",
    },
    {
      q: "Do I need an API key for Google Translate?",
      a: "No! Google Translate mode is 100% free and does not require any API key or registration.",
    },
    {
      q: "What should I do if my key stops working?",
      a: "Make sure you copied the full key starting with 'AIzaSy' without trailing spaces. You can also generate a new key anytime in Google AI Studio.",
    },
  ];

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mb-3">
          <Key size={14} className="text-blue-600" />
          API Key Guide
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight mb-2">
          How to Get a Free Gemini API Key
        </h1>
        <p className="text-sm font-medium text-blue-800/80 leading-relaxed">
          Follow this quick 4-step tutorial to create a free API key in Google AI Studio and unlock deep contextual AI subtitle translation.
        </p>
      </div>

      {/* Direct AI Studio Callout Card */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 sm:p-7 shadow-xs mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-950">Quick Link to Google AI Studio</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Official Google developer console where keys are generated for free.
            </p>
          </div>
        </div>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm transition-colors shadow-xs shrink-0"
        >
          <span>Open AI Studio</span>
          <ExternalLink size={15} />
        </a>
      </div>

      {/* Step by Step Cards */}
      <div className="space-y-4 mb-12">
        <h2 className="text-xl font-bold text-blue-950 mb-4">Step-by-Step Instructions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div
              key={s.step}
              className="bg-white border border-blue-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {s.step}
                  </span>
                  {s.actionLink && (
                    <a
                      href={s.actionLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {s.actionText} <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <h3 className="text-sm font-bold text-blue-950 mb-1.5">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Privacy Card */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 shadow-xs mb-12 flex items-start gap-3.5">
        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
          <Lock size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-blue-950 mb-1">Your Key is 100% Safe</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike other web tools, Subtitle Translator does not save your API key to any backend database. The key resides entirely within your local browser storage (localStorage). When translating, it is transmitted securely directly to the Google Gemini API to process your subtitle text.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-12">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-blue-950">API Key FAQs</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {faqs.map((faq, i) => (
            <div key={i} className="space-y-1">
              <h4 className="text-xs font-bold text-blue-900">{faq.q}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Return to Translator CTA */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors shadow-xs"
        >
          <span>Return to Subtitle Translator</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
