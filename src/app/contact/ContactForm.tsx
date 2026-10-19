"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate smooth submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white border border-blue-200 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="text-lg font-bold text-blue-950 mb-1">Message Sent Successfully</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mb-6">
          Thank you for getting in touch, <span className="font-semibold">{name}</span>. We will review your message and respond to <span className="font-semibold">{email}</span> as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSubmitted(false);
            setName("");
            setEmail("");
            setMessage("");
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
      <h2 className="text-lg font-bold text-blue-950 mb-1">Send Us a Message</h2>
      <p className="text-xs text-slate-500 mb-4">
        Fill out the form below and we will get back to you shortly.
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Name & Email Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full bg-blue-50/30 border border-blue-200 text-blue-950 placeholder-blue-300 text-xs sm:text-sm rounded-lg p-2.5 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-blue-50/30 border border-blue-200 text-blue-950 placeholder-blue-300 text-xs sm:text-sm rounded-lg p-2.5 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Topic */}
      <div>
        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
          Subject / Topic
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-blue-50/30 border border-blue-200 text-blue-950 text-xs sm:text-sm rounded-lg p-2.5 focus:outline-none focus:bg-white focus:border-blue-600"
        >
          <option value="general">General Inquiry</option>
          <option value="bug">Report an Issue / Bug</option>
          <option value="language">Request a New Language</option>
          <option value="feedback">Feedback & Suggestions</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
          Your Message <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please describe your question or issue in detail..."
          className="w-full bg-blue-50/30 border border-blue-200 text-blue-950 placeholder-blue-300 text-xs sm:text-sm rounded-lg p-2.5 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-y"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        <Send size={16} />
        <span>{isSubmitting ? "Sending message..." : "Send Message"}</span>
      </button>
    </form>
  );
}
