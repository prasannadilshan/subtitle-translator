import React from "react";
import type { Metadata } from "next";
import { Mail, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us - Subtitle Translator",
  description:
    "Get in touch with the Subtitle Translator team for inquiries, bug reports, feature requests, or language additions.",
};

export default function ContactPage() {
  const CONTACT_EMAIL = "support@subtitletranslator.app";

  const faqs = [
    {
      q: "Where do I obtain a Gemini API key?",
      a: "You can create a free API key at Google AI Studio (aistudio.google.com). Once copied, paste it into the Gemini API Key field in the translator settings. It remains strictly stored in your browser.",
    },
    {
      q: "Are my subtitle files uploaded or stored on your servers?",
      a: "No. Subtitle files are parsed and translated completely in-memory during the session. We never write, store, or log your subtitle content on any server.",
    },
    {
      q: "Can I request a new language?",
      a: "Yes! Use the contact form to submit a language request with the language name and ISO code. We are constantly expanding our supported language registry.",
    },
  ];

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mb-3">
          <Mail size={14} className="text-blue-600" />
          Get In Touch
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight mb-2">
          Contact Our Support Team
        </h1>
        <p className="text-sm font-medium text-blue-800/80 leading-relaxed">
          Have a question, feedback, or a feature request? Send us a message or reach out via email.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Contact Info Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit mb-3 border border-blue-100">
              <Mail size={20} />
            </div>
            <h3 className="text-sm font-bold text-blue-950 mb-1">Direct Email</h3>
            <p className="text-xs text-slate-500 mb-2">
              For direct inquiries and developer communication:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 break-all"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit mb-3 border border-blue-100">
              <Clock size={20} />
            </div>
            <h3 className="text-sm font-bold text-blue-950 mb-1">Response Time</h3>
            <p className="text-xs text-slate-500">
              We typically reply within 24 to 48 business hours.
            </p>
          </div>

          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-3 border border-emerald-100">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-sm font-bold text-blue-950 mb-1">Privacy Guarantee</h3>
            <p className="text-xs text-slate-500">
              We never share your contact details or message content with any third parties.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <ContactForm />
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-blue-950">Frequently Asked Questions</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {faqs.map((faq, i) => (
            <div key={i} className="space-y-1.5">
              <h4 className="text-xs font-bold text-blue-900">{faq.q}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
