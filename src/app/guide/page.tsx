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
  Sparkles,
  Lock
} from "lucide-react";

export const metadata: Metadata = {
  title: "API Key Guide - Groq & Gemini - Subtitle Translator",
  description:
    "Step-by-step guides on how to get free API keys for Groq and Google Gemini to translate subtitles using AI.",
};

export default function ApiKeyGuidePage() {
  const providers = [
    {
      id: "groq",
      name: "Groq AI (Llama 3.1 8B)",
      badge: "Ultra Fast • 100% Free Forever",
      icon: Zap,
      accentColor: "text-amber-600 bg-amber-50 border-amber-200",
      description: "Groq runs open-source models at blazing speed. Completely free with 14,400 requests per day. No credit card required.",
      link: "https://console.groq.com/keys",
      linkText: "Open Groq Console",
      steps: [
        {
          step: "01",
          title: "Visit Groq Console",
          description: "Open console.groq.com/keys in your browser and sign in with Google or GitHub (no payment info needed).",
        },
        {
          step: "02",
          title: "Click 'Create API Key'",
          description: "Click the blue 'Create API Key' button and enter any name for your key.",
        },
        {
          step: "03",
          title: "Copy Key & Translate",
          description: "Copy your key (starts with 'gsk_...') and paste it into the Groq API key field in Subtitle Translator.",
        },
      ],
    },
    {
      id: "gemini",
      name: "Google Gemini (Flash)",
      badge: "Balanced • Google AI Studio",
      icon: Sparkles,
      accentColor: "text-indigo-600 bg-indigo-50 border-indigo-200",
      description: "Google's versatile multimodal AI. Fast, accurate, and free with a standard Google account.",
      link: "https://aistudio.google.com/app/apikey",
      linkText: "Open Google AI Studio",
      steps: [
        {
          step: "01",
          title: "Visit Google AI Studio",
          description: "Go to aistudio.google.com/app/apikey and sign in with your regular Google account.",
        },
        {
          step: "02",
          title: "Click 'Create API Key'",
          description: "Click 'Create API key' and choose or create a project to generate your secret key.",
        },
        {
          step: "03",
          title: "Copy Key & Translate",
          description: "Copy your key (starts with 'AIzaSy...') and paste it into the Gemini API key field in Subtitle Translator.",
        },
      ],
    },
  ];

  const faqs = [
    {
      q: "Do any of these providers require a credit card?",
      a: "No! Both Groq and Google Gemini are 100% free without any credit card or payment information required.",
    },
    {
      q: "Which AI provider is recommended?",
      a: "Groq is the fastest and gives 14,400 free requests every day with sub-second speeds. Gemini is balanced, reliable, and powered by Google AI Studio.",
    },
    {
      q: "Where are my API keys stored?",
      a: "All API keys are stored strictly inside your browser's local storage (localStorage). They are never saved to our database or logged on our servers.",
    },
    {
      q: "Can I use the tool without any API key?",
      a: "Yes! Simply choose 'Google' as your translation engine. It is 100% free and requires zero setup or registration.",
    },
  ];

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mb-3">
          <Key size={14} className="text-blue-600" />
          AI Key Setup Guides
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight mb-2">
          How to Get Free AI API Keys
        </h1>
        <p className="text-sm font-medium text-blue-800/80 leading-relaxed">
          Choose any of our supported AI providers to unlock intelligent subtitle translation. None of these options require a credit card to get started.
        </p>
      </div>

      {/* Provider Guides */}
      <div className="space-y-8 mb-12">
        {providers.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className="bg-white border border-blue-200 rounded-2xl p-6 sm:p-7 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${p.accentColor} shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-blue-950">{p.name}</h2>
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full border border-blue-200/60">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{p.description}</p>
                  </div>
                </div>

                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs shrink-0"
                >
                  <span>{p.linkText}</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* 3 Step Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {p.steps.map((s) => (
                  <div
                    key={s.step}
                    className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                          {s.step}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-blue-950 mb-1">{s.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Privacy Card */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 shadow-xs mb-12 flex items-start gap-3.5">
        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
          <Lock size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-blue-950 mb-1">Your Keys are 100% Private</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Subtitle Translator does not store your keys in any database. Keys are kept solely within your browser’s localStorage. You can clear or update them anytime with a single click.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-12">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-blue-950">Frequently Asked Questions</h2>
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
