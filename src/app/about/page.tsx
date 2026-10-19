import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Languages,
  Zap,
  Sparkles,
  ShieldCheck,
  Clock,
  Globe,
  ArrowRight,
  FileCheck
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - Subtitle Translator",
  description:
    "Learn how Subtitle Translator delivers fast, timestamp-preserving SRT subtitle translations in over 40 languages using Google Translate and Gemini AI.",
};

export default function AboutPage() {
  const features = [
    {
      icon: <Zap size={22} className="text-blue-600" />,
      title: "Google Translate (No AI / Free)",
      description:
        "Fast, reliable machine translation requiring no API keys or quotas. Ideal for documentaries, tutorials, and quick turnaround projects.",
    },
    {
      icon: <Sparkles size={22} className="text-blue-600" />,
      title: "Gemini 2.5 Flash (AI)",
      description:
        "Context-aware neural translation powered by Google Gemini. Accurately understands idioms, cinematic dialogues, and cultural expressions.",
    },
    {
      icon: <ShieldCheck size={22} className="text-blue-600" />,
      title: "Privacy & In-Memory Processing",
      description:
        "Your subtitle files are never written to any database or stored on our servers. When using AI mode, your API key stays strictly in your browser's local storage.",
    },
    {
      icon: <Clock size={22} className="text-blue-600" />,
      title: "Timestamp & Cue Preservation",
      description:
        "Built-in SRT parser preserves cue numbers, start/end timestamps down to the millisecond, and multi-line breaks without drift.",
    },
    {
      icon: <Globe size={22} className="text-blue-600" />,
      title: "40+ Languages Supported",
      description:
        "Translate to and from English, Sinhala, Tamil, Hindi, Spanish, French, German, Japanese, Chinese, Arabic, and dozens more.",
    },
    {
      icon: <FileCheck size={22} className="text-blue-600" />,
      title: "Concurrent Batch Processing",
      description:
        "Subtitles are partitioned into optimal batches and processed concurrently with automated retries and backoff for fail-safe execution.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Upload Your Subtitle",
      desc: "Drag and drop or select your standard SubRip (.srt) subtitle file.",
    },
    {
      num: "02",
      title: "Choose Language & Engine",
      desc: "Pick your target language and select Google Translate (free) or Gemini AI.",
    },
    {
      num: "03",
      title: "Download & Enjoy",
      desc: "Click Translate and download your formatted, translated .srt file instantly.",
    },
  ];

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mb-4">
          <Languages size={14} className="text-blue-600" />
          About Subtitle Translator
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight mb-3">
          High-Speed Subtitle Translation for Everyone
        </h1>
        <p className="text-base text-blue-800/80 leading-relaxed">
          Subtitle Translator is a privacy-first web utility built to remove language barriers in media. Translate any movie, YouTube video, or lecture subtitle in seconds.
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="mb-14">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-950">
            Why Use Subtitle Translator?
          </h2>
          <p className="text-xs sm:text-sm text-blue-800/70 mt-1">
            Engineered for reliability, speed, and strict subtitle format integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-blue-400 transition-colors"
            >
              <div className="p-2.5 bg-blue-50 rounded-xl w-fit mb-3 border border-blue-100">
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-blue-950 mb-1.5">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-14">
        <h2 className="text-xl font-bold text-blue-950 mb-6 text-center">
          How It Works in 3 Simple Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs mb-3">
                {step.num}
              </div>
              <h4 className="text-sm font-bold text-blue-950 mb-1">{step.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600 rounded-2xl p-8 text-center text-white shadow-sm flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-2">Ready to Translate Your Subtitles?</h2>
        <p className="text-sm text-blue-100 max-w-lg mb-6">
          Get started right away. No account or credit card required. Free Google Translate and AI translation available.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-xs"
        >
          <span>Open Translator</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
