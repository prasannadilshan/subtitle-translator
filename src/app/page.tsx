"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Parser from "srt-parser-2";
import {
  Upload,
  UploadCloud,
  Download,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Globe,
  ChevronDown,
  Search,
  Check,
  FileText,
  Zap,
  Sparkles,
  X,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  HelpCircle,
  Square,
  Play,
  Pencil,
  Trash2,
  CheckCircle2,
  Captions,
  ArrowRight,
  ShieldCheck,
  Infinity
} from "lucide-react";
import Link from "next/link";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_CODE, getLanguageByCode } from "@/lib/languages";
import { TranslationEngine } from "@/lib/translation/types";
import { translateWithGeminiClient } from "@/lib/translation/providers/geminiClient";

type ChunkStatus = "pending" | "translating" | "success" | "error";

interface ChunkState {
  index: number;
  originalData: any[];
  translatedData: any[] | null;
  status: ChunkStatus;
  error?: string;
  retries: number;
}

const STORAGE_KEYS: Record<string, string> = {
  gemini: "gemini_user_api_key",
  groq: "groq_user_api_key",
};

export default function SubtitleTranslator() {
  const [file, setFile] = useState<File | null>(null);
  const [chunks, setChunks] = useState<ChunkState[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [limitReachedEngine, setLimitReachedEngine] = useState<TranslationEngine | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<{
    chunkIndex: number;
    secondsLeft: number;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const isAbortedRef = useRef<boolean>(false);

  // Settings: Engine & Target Language (Empty initially to require user selection)
  const [targetLang, setTargetLang] = useState<string>("");
  const [engine, setEngine] = useState<TranslationEngine>("google");

  // User provided API Keys per provider (stored safely in browser localStorage)
  const [apiKeys, setApiKeys] = useState<{ [key in TranslationEngine]?: string }>({
    google: "",
    groq: "",
    gemini: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [keyInputValue, setKeyInputValue] = useState("");

  // Searchable language picker state
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const CHUNK_SIZE = 25;
  const MAX_RETRIES = 4;

  // Load API keys from browser localStorage on client mount
  useEffect(() => {
    try {
      setApiKeys({
        google: "",
        groq: localStorage.getItem("groq_user_api_key") || "",
        gemini: localStorage.getItem("gemini_user_api_key") || "",
      });
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
  }, []);

  const currentApiKey = apiKeys[engine] || "";

  // Save or remove API key from browser localStorage for active engine
  const handleApiKeyChange = (val: string) => {
    setApiKeys((prev) => ({ ...prev, [engine]: val }));
    if (
      globalError &&
      (globalError.toLowerCase().includes("api key") || globalError.toLowerCase().includes("limit"))
    ) {
      setGlobalError(null);
      setLimitReachedEngine(null);
    }
    const storageKey = STORAGE_KEYS[engine];
    if (storageKey) {
      try {
        if (val.trim()) {
          localStorage.setItem(storageKey, val.trim());
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        console.warn("Could not write to localStorage:", e);
      }
    }
  };

  const handleSaveKey = () => {
    const trimmed = keyInputValue.trim();
    if (!trimmed) return;
    handleApiKeyChange(trimmed);
    setIsEditingKey(false);
  };

  const handleRemoveKey = (targetEngine: TranslationEngine) => {
    setApiKeys((prev) => ({ ...prev, [targetEngine]: "" }));
    setKeyInputValue("");
    setIsEditingKey(false);
    const storageKey = STORAGE_KEYS[targetEngine];
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn("Could not remove from localStorage:", e);
      }
    }
  };

  const selectedLanguage = useMemo(() => (targetLang ? getLanguageByCode(targetLang) : null), [targetLang]);

  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return SUPPORTED_LANGUAGES;
    const q = langSearch.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [langSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setGlobalError(null);
    setDownloadUrl(null);
    setChunks([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parser = new Parser();
        const parsed = parser.fromSrt(text);

        if (!parsed || parsed.length === 0) {
          throw new Error("No subtitle entries found in this SRT file.");
        }

        const totalChunks = Math.ceil(parsed.length / CHUNK_SIZE);
        const initialChunks: ChunkState[] = [];
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          initialChunks.push({
            index: i,
            originalData: parsed.slice(start, start + CHUNK_SIZE),
            translatedData: null,
            status: "pending",
            retries: 0,
          });
        }
        setChunks(initialChunks);
      } catch (err: any) {
        setGlobalError(err.message || "Failed to parse SRT file. Please ensure it is a valid format.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleResetFile = () => {
    isAbortedRef.current = true;
    setIsTranslating(false);
    setRetryCountdown(null);
    setFile(null);
    setChunks([]);
    setDownloadUrl(null);
    setGlobalError(null);
    setLimitReachedEngine(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStopTranslation = () => {
    isAbortedRef.current = true;
    setIsTranslating(false);
    setRetryCountdown(null);
    // Return any chunk that was actively translating back to pending
    setChunks((prev) =>
      prev.map((c) => (c.status === "translating" ? { ...c, status: "pending" } : c))
    );
  };

  const handleConfigChange = (newLang: string, newEngine: TranslationEngine) => {
    const langChanged = newLang !== targetLang;
    setTargetLang(newLang);
    setEngine(newEngine);
    setIsEditingKey(false);
    setKeyInputValue("");

    if (
      globalError &&
      (globalError.toLowerCase().includes("api key") ||
        globalError.toLowerCase().includes("limit") ||
        globalError.toLowerCase().includes("language") ||
        globalError.toLowerCase().includes("srt"))
    ) {
      setGlobalError(null);
      setLimitReachedEngine(null);
    }

    if (chunks.length > 0 && !isTranslating) {
      setDownloadUrl(null);
      if (langChanged) {
        setChunks((prev) =>
          prev.map((c) => ({
            ...c,
            status: "pending",
            translatedData: null,
            error: undefined,
            retries: 0,
          }))
        );
      } else {
        // If only engine changed, preserve completed chunks and set remaining to pending
        setChunks((prev) =>
          prev.map((c) =>
            c.status !== "success"
              ? { ...c, status: "pending", error: undefined, retries: 0 }
              : c
          )
        );
      }
    }
  };

  const waitWithCountdown = async (
    seconds: number,
    reason: string,
    chunkIndex: number
  ): Promise<boolean> => {
    for (let s = seconds; s > 0; s--) {
      if (isAbortedRef.current) {
        setRetryCountdown(null);
        return false;
      }
      setRetryCountdown({
        chunkIndex,
        secondsLeft: s,
        message: `${reason}. Retrying in ${s}s...`,
      });
      await new Promise((r) => setTimeout(r, 1000));
    }
    setRetryCountdown(null);
    return !isAbortedRef.current;
  };

  const handleQuickSwitchToEngine = (targetEngine: TranslationEngine) => {
    isAbortedRef.current = true;
    setIsTranslating(false);
    setLimitReachedEngine(null);
    setGlobalError(null);
    setRetryCountdown(null);
    setEngine(targetEngine);

    setChunks((prev) => {
      const updated = prev.map((c) =>
        c.status !== "success" ? { ...c, status: "pending" as const, error: undefined, retries: 0 } : c
      );
      const pending = updated.filter((c) => c.status !== "success");
      if (pending.length > 0) {
        setTimeout(() => {
          isAbortedRef.current = false;
          processQueue(pending, targetEngine);
        }, 100);
      }
      return updated;
    });
  };

  const translateChunk = async (
    chunk: ChunkState,
    activeEngine: TranslationEngine = engine
  ): Promise<void> => {
    if (isAbortedRef.current) return;

    setChunks((prev) =>
      prev.map((c) => (c.index === chunk.index ? { ...c, status: "translating" } : c))
    );

    const effectiveApiKey = apiKeys[activeEngine] || "";

    try {
      let translatedData: any[] | null = null;

      if (activeEngine === "gemini") {
        // Direct Client-Side translation (0 server requests)
        const targetLanguage = getLanguageByCode(targetLang);
        translatedData = await translateWithGeminiClient(
          chunk.originalData,
          targetLanguage.name,
          effectiveApiKey
        );
      } else {
        // Google or Groq via backend route
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chunk: chunk.originalData,
            targetLang,
            engine: activeEngine,
            apiKey: activeEngine !== "google" ? effectiveApiKey.trim() || undefined : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          const err = new Error(data.error || "Failed to translate chunk");
          (err as any).isKeyError = !!data.isKeyError;
          (err as any).isQuotaExhausted = !!data.isQuotaExhausted;
          (err as any).statusCode = res.status;
          (err as any).retryAfter = typeof data.retryAfter === "number" ? data.retryAfter : undefined;
          throw err;
        }
        translatedData = data.translatedChunk;
      }

      if (isAbortedRef.current) return;

      setChunks((prev) =>
        prev.map((c) =>
          c.index === chunk.index
            ? { ...c, status: "success", translatedData, error: undefined }
            : c
        )
      );
    } catch (err: any) {
      if (isAbortedRef.current) return;

      // 1. Invalid or unauthorized API key -> Stop immediately and ask user to check key
      if (err.isKeyError) {
        isAbortedRef.current = true;
        setIsTranslating(false);
        setRetryCountdown(null);
        setGlobalError(
          err.message || "Your API key is invalid or unauthorized. Please verify your key in settings."
        );
        setChunks((prev) =>
          prev.map((c) => (c.index === chunk.index ? { ...c, status: "pending" } : c))
        );
        return;
      }

      // 2. Speed limit (429) or transient error:
      // Automatic retry after time interval with live countdown
      const currentRetries = chunk.retries || 0;
      setChunks((prev) =>
        prev.map((c) => (c.index === chunk.index ? { ...c, retries: currentRetries + 1 } : c))
      );

      if (err.statusCode === 429 || err.isQuotaExhausted) {
        setLimitReachedEngine(activeEngine);
      }

      // Time interval:
      // If the API provided an exact retryAfter seconds (e.g. from Groq retry-after header),
      // wait that exact duration so we don't spam the quota window prematurely.
      let delaySeconds: number;
      let reason: string;

      if (err.statusCode === 429 || err.isQuotaExhausted) {
        if (typeof err.retryAfter === "number" && err.retryAfter > 0) {
          delaySeconds = Math.min(err.retryAfter, 60);
        } else {
          delaySeconds = Math.min(10 + currentRetries * 3, 25);
        }
        reason = "Speed limit reached";
      } else {
        delaySeconds = Math.min(3 + currentRetries * 2, 10);
        reason = "Connection glitch";
      }

      const shouldRetry = await waitWithCountdown(delaySeconds, reason, chunk.index);
      if (shouldRetry && !isAbortedRef.current) {
        return translateChunk({ ...chunk, retries: currentRetries + 1 }, activeEngine);
      }
    }
  };

  const processQueue = async (
    chunksToProcess: ChunkState[],
    activeEngine: TranslationEngine = engine
  ) => {
    isAbortedRef.current = false;
    setIsTranslating(true);
    setDownloadUrl(null);
    setGlobalError(null);
    setRetryCountdown(null);

    // Concurrency settings:
    // Gemini: 1 (pacing: 600ms)
    // Groq: 1 (pacing: 800ms) -> Sequential requests guarantee we stay within Groq TPM limits
    // Google: 3 (pacing: 0ms)
    const concurrency = activeEngine === "google" ? 3 : 1;
    const pacingMs = activeEngine === "gemini" ? 600 : activeEngine === "google" ? 0 : 800;

    const queue = [...chunksToProcess];
    const activePromises = new Set<Promise<void>>();

    while ((queue.length > 0 || activePromises.size > 0) && !isAbortedRef.current) {
      if (queue.length > 0 && activePromises.size < concurrency) {
        const chunk = queue.shift()!;
        const promise = translateChunk(chunk, activeEngine).finally(() => {
          activePromises.delete(promise);
        });
        activePromises.add(promise);

        if (pacingMs > 0 && queue.length > 0) {
          await new Promise((r) => setTimeout(r, pacingMs));
        }
      } else {
        await Promise.race(activePromises);
      }
    }

    setRetryCountdown(null);
    setIsTranslating(false);
  };

  const handleStartTranslation = () => {
    if (!file) {
      setGlobalError("Please upload an .srt subtitle file to begin translation.");
      return;
    }

    if (!targetLang) {
      setGlobalError("Please select a target language to translate your subtitles.");
      return;
    }

    if (engine !== "google" && !currentApiKey.trim()) {
      const engineName = engine === "groq" ? "Groq" : "Gemini";
      setGlobalError(
        `Please enter your ${engineName} API key to translate with this engine, or switch to Google Translate.`
      );
      return;
    }

    setGlobalError(null);
    const pendingChunks = chunks.filter((c) => c.status !== "success");
    if (pendingChunks.length > 0) {
      processQueue(pendingChunks);
    }
  };

  useEffect(() => {
    if (chunks.length > 0 && !isTranslating) {
      const allDone = chunks.every((c) => c.status === "success");
      if (allDone && !downloadUrl && chunks.length > 0) {
        generateDownload();
      }
    }
  }, [chunks, isTranslating]);

  const generateDownload = () => {
    const allTranslatedData = chunks.flatMap((c) =>
      c.status === "success" && c.translatedData ? c.translatedData : c.originalData
    );
    const parser = new Parser();
    const newSrtContent = parser.toSrt(allTranslatedData);
    const blob = new Blob([newSrtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
  };

  const completedCount = chunks.filter((c) => c.status === "success").length;
  const errorCount = chunks.filter((c) => c.status === "error").length;
  const totalChunks = chunks.length;
  const totalCues = chunks.reduce((acc, c) => acc + c.originalData.length, 0);
  const progress = totalChunks > 0 ? Math.round((completedCount / totalChunks) * 100) : 0;

  return (
    <main className="relative flex-1 w-full px-4 sm:px-6 py-10 sm:py-14 flex flex-col items-center justify-start overflow-hidden">
      {/* Decorative Ambient Background Shapes (Solid tints, zero purple, zero gradients) */}
      <div className="absolute -left-36 top-16 w-80 sm:w-96 h-80 sm:h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -right-36 top-20 w-80 sm:w-96 h-80 sm:h-96 bg-sky-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Tilted amber cube top-left */}
      <div className="hidden md:block absolute left-[12%] top-64 w-5 h-5 bg-amber-200/80 rounded rotate-12 shadow-2xs pointer-events-none -z-10" />
      {/* Emerald outline ring right */}
      <div className="hidden md:block absolute right-[12%] top-80 w-6 h-6 border-2 border-emerald-300/70 rounded-full pointer-events-none -z-10" />
      {/* Soft blue dot accent */}
      <div className="hidden md:block absolute left-[8%] top-96 w-3 h-3 bg-blue-300/50 rounded-full pointer-events-none -z-10" />

      {/* Top-Right Playful Annotation with Curved Arrow */}
      <div className="hidden lg:flex flex-col items-center absolute top-8 right-[15%] pointer-events-none select-none -z-10">
        <span className="text-[11px] font-semibold rotate-6 text-blue-500 tracking-wide text-center leading-tight">
          Better<br />Subtitles,<br />Global Reach
        </span>
        <svg
          className="w-9 h-9 text-blue-400 mt-1 rotate-6"
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 22 4 C 16 12, 10 18, 6 26 M 6 26 L 13 25 M 6 26 L 8 19" />
        </svg>
      </div>

      {/* Hero Title & Subtitle (Centered, NO msg icon, NO purple, NO gradients) */}
      <div className="text-center max-w-xl mx-auto mb-8 relative z-10">
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight">
          Translate <span className="text-blue-600">Subtitles</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-medium mt-2 max-w-md mx-auto">
          Upload an SRT file and translate it into your chosen language.
        </p>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-4 sm:p-8 md:p-9 space-y-5 sm:space-y-6 relative z-10">
        {/* Global Error Banner */}
        {globalError && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 flex items-center justify-between">
              <span>{globalError}</span>
              <button
                type="button"
                onClick={() => setGlobalError(null)}
                className="text-red-400 hover:text-red-700 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 1. Upload SRT File */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              <UploadCloud size={12} />
            </div>
            <span>
              <span className="text-blue-600 font-bold">1.</span> Upload SRT File
            </span>
          </div>

          <input
            type="file"
            accept=".srt"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isTranslating}
            className="hidden"
          />

          {!file ? (
            <div
              onClick={() => !isTranslating && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/50 rounded-2xl py-9 px-6 flex flex-col items-center justify-center text-center transition-all ${
                isTranslating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-2.5">
                <UploadCloud size={32} className="stroke-[1.8]" />
              </div>
              <p className="text-sm font-bold text-slate-800">Drag & drop your SRT file here</p>
              <p className="text-xs text-slate-400 mt-0.5">or click to browse</p>
            </div>
          ) : (
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                    {totalCues} subtitle lines • {totalChunks} batches • {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {!isTranslating && !downloadUrl && (
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0 ml-2 cursor-pointer"
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Target Language */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              <Globe size={12} />
            </div>
            <span>
              <span className="text-blue-600 font-bold">2.</span> Target Language
            </span>
          </div>

          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              disabled={isTranslating}
              onClick={() => setIsLangOpen(!isLangOpen)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left text-sm transition-all ${
                !selectedLanguage
                  ? "bg-slate-50/70 border-slate-200 hover:border-blue-400"
                  : "bg-blue-50/30 border-blue-200 hover:border-blue-400"
              } ${isTranslating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe size={18} className={selectedLanguage ? "text-blue-600" : "text-slate-400"} />
                {selectedLanguage ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-slate-900">{selectedLanguage.name}</span>
                    <span className="text-xs text-slate-500 font-medium">({selectedLanguage.nativeName})</span>
                  </div>
                ) : (
                  <span className="font-medium text-slate-500">Select target language...</span>
                )}
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform shrink-0 ml-2 ${isLangOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Language Popover */}
            {isLangOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200">
                    <Search size={14} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search language..."
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                  {filteredLanguages.map((lang) => {
                    const isSelected = lang.code === targetLang;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          handleConfigChange(lang.code, engine);
                          setIsLangOpen(false);
                          setLangSearch("");
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{lang.name}</span>
                          <span className={isSelected ? "text-blue-100" : "text-slate-400"}>
                            ({lang.nativeName})
                          </span>
                        </div>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                  {filteredLanguages.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching languages found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Translation Engine */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              <Zap size={12} />
            </div>
            <span>
              <span className="text-blue-600 font-bold">3.</span> Translation Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleConfigChange(targetLang, "google")}
              disabled={isTranslating}
              className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                engine === "google"
                  ? "bg-blue-50/50 border-blue-500 shadow-2xs ring-1 ring-blue-500"
                  : "bg-white border-slate-200 hover:border-slate-300"
              } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">Google</p>
                  <p className="text-[11px] text-slate-500 truncate">Fast & accurate</p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                  engine === "google" ? "border-blue-600" : "border-slate-300"
                }`}
              >
                {engine === "google" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
              </div>
            </button>

            {/* Groq AI */}
            <button
              type="button"
              onClick={() => handleConfigChange(targetLang, "groq")}
              disabled={isTranslating}
              className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                engine === "groq"
                  ? "bg-blue-50/50 border-blue-500 shadow-2xs ring-1 ring-blue-500"
                  : "bg-white border-slate-200 hover:border-slate-300"
              } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-xl shrink-0">
                  <Zap size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">Groq AI</p>
                  <p className="text-[11px] text-slate-500 truncate">Ultra Fast • Free Key</p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                  engine === "groq" ? "border-blue-600" : "border-slate-300"
                }`}
              >
                {engine === "groq" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
              </div>
            </button>

            {/* Gemini */}
            <button
              type="button"
              onClick={() => handleConfigChange(targetLang, "gemini")}
              disabled={isTranslating}
              className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                engine === "gemini"
                  ? "bg-blue-50/50 border-blue-500 shadow-2xs ring-1 ring-blue-500"
                  : "bg-white border-slate-200 hover:border-slate-300"
              } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">Gemini</p>
                  <p className="text-[11px] text-slate-500 truncate">Balanced • Free Key</p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                  engine === "gemini" ? "border-blue-600" : "border-slate-300"
                }`}
              >
                {engine === "gemini" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
              </div>
            </button>
          </div>

          {/* API Key Box for Groq & Gemini */}
          {engine !== "google" && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Key size={13} className="text-blue-600" />
                  {engine === "groq" ? "Groq API Key" : "Gemini API Key"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold underline cursor-pointer"
                  >
                    <HelpCircle size={12} />
                    {showGuide ? "Hide Guide" : "How to get a key?"}
                  </button>
                  <a
                    href={
                      engine === "groq"
                        ? "https://console.groq.com/keys"
                        : "https://aistudio.google.com/app/apikey"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                  >
                    {engine === "groq" ? "Groq Console" : "AI Studio"}
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {currentApiKey.trim() && !isEditingKey ? (
                /* Saved Key Display with Edit & Remove */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50/80 border border-slate-200 rounded-2xl gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                      <CheckCircle2 size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {engine === "groq" ? "Groq API Key" : "Gemini API Key"}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Saved
                        </span>
                      </div>
                      <p className="font-mono text-xs text-slate-700 truncate mt-0.5">
                        {showApiKey
                          ? currentApiKey
                          : `${currentApiKey.slice(0, 4)}••••••••••••••••${currentApiKey.slice(-4)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                      title={showApiKey ? "Hide key" : "Reveal key"}
                    >
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKeyInputValue(currentApiKey);
                        setIsEditingKey(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      title="Edit API key"
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveKey(engine)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      title="Remove API key"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Input Field */
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={apiKeyInputRef}
                        type={showApiKey ? "text" : "password"}
                        value={keyInputValue}
                        onChange={(e) => setKeyInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveKey();
                        }}
                        placeholder={
                          engine === "groq"
                            ? "Paste your Groq API key (gsk_...)"
                            : "Paste your Gemini API key (AIzaSy...)"
                        }
                        disabled={isTranslating}
                        className={`w-full bg-slate-50/50 border text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl p-3 pr-10 focus:outline-none focus:bg-white font-mono ${
                          globalError && !keyInputValue.trim()
                            ? "border-red-500 focus:border-red-500"
                            : "border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        title={showApiKey ? "Hide key" : "Show key"}
                      >
                        {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveKey}
                      disabled={!keyInputValue.trim() || isTranslating}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-2xs shrink-0 cursor-pointer ${
                        keyInputValue.trim()
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Save
                    </button>

                    {isEditingKey && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingKey(false);
                          setKeyInputValue("");
                        }}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors shrink-0 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500">
                Stored only in your browser (localStorage). Never saved on our servers.
              </p>

              {/* Expandable Quick Guide */}
              {showGuide && (
                <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-slate-900">
                      Quick Key Guide for {engine === "groq" ? "Groq" : "Gemini"}
                    </span>
                    <Link
                      href="/guide"
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
                    >
                      Full tutorial &rarr;
                    </Link>
                  </div>

                  {engine === "groq" && (
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
                      <li>
                        Visit{" "}
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-semibold underline"
                        >
                          console.groq.com/keys
                        </a>{" "}
                        and sign in with Google or GitHub (no credit card required).
                      </li>
                      <li>Click the <strong>&quot;Create API Key&quot;</strong> button.</li>
                      <li>
                        Copy your key (starts with <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">gsk_...</code>).
                      </li>
                      <li>Paste the key into the input field above.</li>
                    </ol>
                  )}

                  {engine === "gemini" && (
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
                      <li>
                        Visit{" "}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-semibold underline"
                        >
                          Google AI Studio
                        </a>{" "}
                        and sign in with your Google account.
                      </li>
                      <li>Click the blue <strong>&quot;Create API key&quot;</strong> button.</li>
                      <li>
                        Select or create a project, then copy the key (starts with <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">AIzaSy...</code>).
                      </li>
                      <li>Paste the key into the input field above.</li>
                    </ol>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Action Button (Translate to Language ->) */}
        <div className="pt-2">
          {isTranslating ? (
            <div className="flex items-center gap-2 sm:gap-2.5 w-full">
              <div className="flex-1 min-w-0 bg-blue-50 border border-blue-200 text-blue-950 font-semibold py-3 sm:py-4 px-3 sm:px-5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs overflow-hidden">
                <Loader2 className="animate-spin text-blue-600 shrink-0" size={16} />
                <span className="truncate">
                  {retryCountdown !== null
                    ? retryCountdown.message
                    : `Translating to ${selectedLanguage?.name || "target language"} (${completedCount}/${totalChunks})...`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleStopTranslation}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3 sm:py-4 px-3.5 sm:px-6 rounded-2xl text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                title="Stop translation"
              >
                <Square size={13} className="fill-white shrink-0" />
                <span>Stop</span>
              </button>
            </div>
          ) : completedCount > 0 && completedCount < totalChunks ? (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleStartTranslation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl text-sm sm:text-base transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={16} className="fill-white" />
                <span>
                  Resume Translation ({completedCount}/{totalChunks})
                </span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={generateDownload}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-3 px-4 rounded-xl text-xs transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>Download partial translated subtitles ({completedCount} batches)</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartTranslation}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 px-6 rounded-2xl text-sm sm:text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>
                {selectedLanguage
                  ? `Translate to ${selectedLanguage.name}`
                  : "Translate Subtitles"}
              </span>
              <ArrowRight size={18} />
            </button>
          )}
        </div>

        {/* 5. Progress Bar & Recommendation */}
        {(isTranslating || (completedCount > 0 && !downloadUrl) || limitReachedEngine) && (
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl shadow-2xs">
            {(isTranslating || (completedCount > 0 && !downloadUrl)) && (
              <>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-2">
                  <span>
                    Progress: {completedCount} / {totalChunks} batches
                  </span>
                  <span className="text-blue-600 font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {retryCountdown && (
                  <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
                    <Loader2 size={13} className="animate-spin text-amber-600 shrink-0" />
                    <span>{retryCountdown.message}</span>
                  </div>
                )}
              </>
            )}

            {/* Fast Switch Recommendation (Near Progress Bar) */}
            {limitReachedEngine && (
              <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-slate-700 animate-in fade-in duration-200 ${
                  isTranslating || (completedCount > 0 && !downloadUrl)
                    ? "mt-3 pt-3 border-t border-slate-200"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe size={15} className="text-blue-600 shrink-0" />
                  <span>
                    {limitReachedEngine !== "google" ? (
                      <>
                        Need fast translation? Switch to{" "}
                        <strong className="font-semibold text-slate-900">Google Translate</strong> to
                        continue immediately without waiting.
                      </>
                    ) : (
                      <>
                        Need fast translation? Switch to{" "}
                        <strong className="font-semibold text-slate-900">Groq AI</strong> to
                        continue immediately.
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {limitReachedEngine !== "google" ? (
                    <button
                      type="button"
                      onClick={() => handleQuickSwitchToEngine("google")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Globe size={13} />
                      <span>Switch to Google Translate</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQuickSwitchToEngine("groq")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Zap size={13} />
                      <span>Switch to Groq AI</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLimitReachedEngine(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. Translation Complete & Download */}
        {downloadUrl && (
          <div className="p-6 bg-slate-50/80 border border-slate-200 rounded-2xl text-center space-y-3.5 animate-in fade-in">
            <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
              <CheckCircle size={30} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Translation Complete!</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Translated to {selectedLanguage ? selectedLanguage.name : "target language"} using{" "}
                {engine === "google" ? "Google Translate" : engine === "groq" ? "Groq AI" : "Gemini AI"}
              </p>
            </div>

            <a
              href={downloadUrl}
              download={`translated_${selectedLanguage ? selectedLanguage.code : "out"}_${file?.name || "subtitles.srt"}`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={18} />
              <span>Download Translated SRT</span>
            </a>

            <div>
              <button
                type="button"
                onClick={handleResetFile}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-semibold cursor-pointer"
              >
                Translate another file
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4 Bottom Feature Highlights (Like reference image) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12 max-w-3xl mx-auto w-full relative z-10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Fast & Accurate</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
              High quality translation with advanced AI.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Secure</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
              Your files are processed in memory. No storage.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Globe size={18} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Multiple Languages</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
              Support for 40+ languages with natural results.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Infinity size={18} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Simple & Easy</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
              Just upload, select and translate.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
