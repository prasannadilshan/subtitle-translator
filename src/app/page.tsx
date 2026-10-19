"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Parser from "srt-parser-2";
import {
  Upload,
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
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_CODE, getLanguageByCode } from "@/lib/languages";
import { TranslationEngine } from "@/lib/translation/types";

type ChunkStatus = "pending" | "translating" | "success" | "error";

interface ChunkState {
  index: number;
  originalData: any[];
  translatedData: any[] | null;
  status: ChunkStatus;
  error?: string;
  retries: number;
}

const LOCAL_STORAGE_API_KEY = "gemini_user_api_key";

export default function SubtitleTranslator() {
  const [file, setFile] = useState<File | null>(null);
  const [chunks, setChunks] = useState<ChunkState[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  // Settings: Engine & Target Language (Default is English)
  const [targetLang, setTargetLang] = useState<string>(DEFAULT_LANGUAGE_CODE);
  const [engine, setEngine] = useState<TranslationEngine>("google");

  // User provided API Key (stored only in browser localStorage)
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Searchable language picker state
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const CONCURRENCY_LIMIT = 5;
  const CHUNK_SIZE = 40;
  const MAX_RETRIES = 3;

  // Load API key from browser localStorage on client mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(LOCAL_STORAGE_API_KEY);
      if (savedKey) {
        setApiKey(savedKey);
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
  }, []);

  // Save or remove API key from browser localStorage
  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (globalError && globalError.toLowerCase().includes("api key")) {
      setGlobalError(null);
    }
    try {
      if (val.trim()) {
        localStorage.setItem(LOCAL_STORAGE_API_KEY, val.trim());
      } else {
        localStorage.removeItem(LOCAL_STORAGE_API_KEY);
      }
    } catch (e) {
      console.warn("Could not write to localStorage:", e);
    }
  };

  const selectedLanguage = useMemo(() => getLanguageByCode(targetLang), [targetLang]);

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
    setFile(null);
    setChunks([]);
    setDownloadUrl(null);
    setGlobalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfigChange = (newLang: string, newEngine: TranslationEngine) => {
    setTargetLang(newLang);
    setEngine(newEngine);

    if (newEngine === "google" && globalError && globalError.toLowerCase().includes("api key")) {
      setGlobalError(null);
    }

    if (chunks.length > 0 && !isTranslating) {
      setDownloadUrl(null);
      setChunks((prev) =>
        prev.map((c) => ({
          ...c,
          status: "pending",
          translatedData: null,
          error: undefined,
          retries: 0,
        }))
      );
    }
  };

  const translateChunk = async (chunk: ChunkState): Promise<void> => {
    setChunks((prev) =>
      prev.map((c) => (c.index === chunk.index ? { ...c, status: "translating" } : c))
    );

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chunk: chunk.originalData,
          targetLang,
          engine,
          apiKey: engine === "gemini" ? apiKey.trim() || undefined : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to translate chunk");

      setChunks((prev) =>
        prev.map((c) =>
          c.index === chunk.index
            ? { ...c, status: "success", translatedData: data.translatedChunk, error: undefined }
            : c
        )
      );
    } catch (err: any) {
      let currentRetries = 0;
      setChunks((prev) => {
        const currentChunk = prev.find((c) => c.index === chunk.index);
        currentRetries = currentChunk ? currentChunk.retries : chunk.retries;

        if (currentRetries < MAX_RETRIES) {
          return prev.map((c) => (c.index === chunk.index ? { ...c, retries: c.retries + 1 } : c));
        } else {
          return prev.map((c) =>
            c.index === chunk.index ? { ...c, status: "error", error: err.message } : c
          );
        }
      });

      if (currentRetries < MAX_RETRIES) {
        const delayMs = (currentRetries + 1) * 2000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return translateChunk({ ...chunk, retries: currentRetries + 1 });
      }
    }
  };

  const processQueue = async (chunksToProcess: ChunkState[]) => {
    setIsTranslating(true);
    setDownloadUrl(null);
    setGlobalError(null);

    const queue = [...chunksToProcess];
    const activePromises = new Set<Promise<void>>();

    while (queue.length > 0 || activePromises.size > 0) {
      if (queue.length > 0 && activePromises.size < CONCURRENCY_LIMIT) {
        const chunk = queue.shift()!;
        const promise = translateChunk(chunk).finally(() => {
          activePromises.delete(promise);
        });
        activePromises.add(promise);
      } else {
        await Promise.race(activePromises);
      }
    }

    setIsTranslating(false);
  };

  const handleStartTranslation = () => {
    if (!file) {
      fileInputRef.current?.click();
      return;
    }

    if (engine === "gemini" && !apiKey.trim()) {
      setGlobalError(
        "Please enter your Gemini API key to translate in AI mode, or switch to Google Translate."
      );
      apiKeyInputRef.current?.focus();
      return;
    }

    const pendingChunks = chunks.filter((c) => c.status === "pending" || c.status === "error");
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
    <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 flex flex-col justify-center">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-950 mb-1">
          Translate Subtitles
        </h1>
        <p className="text-sm font-medium text-blue-800/80">
          Upload an SRT file and translate it into your chosen language.
        </p>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2.5 shadow-xs">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
          <span>{globalError}</span>
        </div>
      )}

      {/* 2. Upload Place (First) */}
      <div className="mb-4">
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
            className={`border-2 border-dashed border-blue-300 hover:border-blue-600 bg-white hover:bg-blue-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors shadow-xs ${
              isTranslating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="p-3.5 bg-blue-600 text-white rounded-full mb-3 shadow-xs">
              <Upload size={22} />
            </div>
            <p className="text-sm font-semibold text-blue-950 mb-1">
              Click to upload your .srt file
            </p>
            <p className="text-xs text-blue-700/70">Supports standard SubRip (.srt) subtitle files</p>
          </div>
        ) : (
          <div className="border border-blue-200 rounded-xl p-4 bg-white shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-xs">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-950 truncate max-w-[240px] sm:max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs font-medium text-blue-700/70">
                  {totalCues} subtitle lines ({totalChunks} batches)
                </p>
              </div>
            </div>

            {!isTranslating && !downloadUrl && (
              <button
                type="button"
                onClick={handleResetFile}
                className="p-1.5 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Remove file"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Translation Settings Card (Under the Upload Place) */}
      <div className="mb-5 bg-white border border-blue-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Target Language Selection */}
        <div className="relative" ref={langDropdownRef}>
          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
            Target Language
          </label>
          <button
            type="button"
            disabled={isTranslating}
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-left text-sm transition-colors hover:border-blue-400 ${
              isTranslating ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-blue-600" />
              <span className="font-semibold text-blue-950">{selectedLanguage.name}</span>
              <span className="text-xs text-blue-700/70">({selectedLanguage.nativeName})</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-blue-500 transition-transform ${isLangOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Language Dropdown Popover */}
          {isLangOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-blue-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-2 border-b border-blue-100 bg-blue-50/30">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-blue-200">
                  <Search size={14} className="text-blue-400" />
                  <input
                    type="text"
                    placeholder="Search language..."
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-blue-950 placeholder-blue-400 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm text-left transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.name}</span>
                        <span className={isSelected ? "text-blue-100" : "text-blue-700/60"}>
                          ({lang.nativeName})
                        </span>
                      </div>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
                {filteredLanguages.length === 0 && (
                  <div className="p-3 text-center text-xs text-blue-700/70">No matching languages found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Engine Selector */}
        <div>
          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
            Translation Engine
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleConfigChange(targetLang, "google")}
              disabled={isTranslating}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs sm:text-sm transition-colors ${
                engine === "google"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs font-semibold"
                  : "bg-blue-50/50 text-blue-950 border-blue-200 hover:bg-blue-100/70 hover:border-blue-300 font-medium"
              } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Zap size={16} className={engine === "google" ? "text-white" : "text-blue-600"} />
              <span>Google Translate</span>
            </button>

            <button
              type="button"
              onClick={() => handleConfigChange(targetLang, "gemini")}
              disabled={isTranslating}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs sm:text-sm transition-colors ${
                engine === "gemini"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs font-semibold"
                  : "bg-blue-50/50 text-blue-950 border-blue-200 hover:bg-blue-100/70 hover:border-blue-300 font-medium"
              } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Sparkles size={16} className={engine === "gemini" ? "text-white" : "text-blue-600"} />
              <span>Gemini Flash</span>
            </button>
          </div>
        </div>

        {/* Gemini API Key Field (Visible when Gemini is selected) */}
        {engine === "gemini" && (
          <div className="pt-3 border-t border-blue-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Key size={13} className="text-blue-600" />
                Gemini API Key <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold underline"
                >
                  <HelpCircle size={12} />
                  {showGuide ? "Hide Guide" : "How to get a key?"}
                </button>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  AI Studio <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <div className="relative">
              <input
                ref={apiKeyInputRef}
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Paste your Gemini API key (AIzaSy...)"
                disabled={isTranslating}
                className={`w-full bg-blue-50/30 border text-blue-950 placeholder-blue-300 text-xs sm:text-sm rounded-lg p-2.5 pr-10 focus:outline-none focus:bg-white font-mono ${
                  globalError && !apiKey.trim()
                    ? "border-red-500 focus:border-red-500"
                    : "border-blue-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-700 p-1"
                title={showApiKey ? "Hide key" : "Show key"}
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <p className="text-[11px] text-blue-700/70 mt-1.5">
              Stored only in your browser (localStorage). Never stored on our servers.
            </p>

            {/* Expandable Quick Guide */}
            {showGuide && (
              <div className="mt-3 p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/60">
                  <span className="font-bold text-blue-950">Quick 4-Step API Key Guide</span>
                  <Link href="/guide" className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline">
                    Full tutorial &rarr;
                  </Link>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
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
                    and log in with any Google account.
                  </li>
                  <li>
                    Click the blue <strong>"Create API key"</strong> button.
                  </li>
                  <li>
                    Select or create a project, then copy the key (starts with <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono text-[10px]">AIzaSy...</code>).
                  </li>
                  <li>
                    Paste the key into the input field above. It is stored safely in your browser.
                  </li>
                </ol>

                <div className="pt-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-md text-[11px] shadow-xs transition-colors"
                  >
                    <span>Open Google AI Studio</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Action Button (Always Visible) */}
      <div className="space-y-3">
        {errorCount > 0 && !isTranslating && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>{errorCount} batch(es) failed.</span>
            </div>
            <button
              type="button"
              onClick={() => generateDownload()}
              className="underline hover:text-amber-900 font-semibold"
            >
              Download anyway
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleStartTranslation}
          disabled={isTranslating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-blue-300 disabled:text-white/80 disabled:cursor-not-allowed cursor-pointer"
        >
          {isTranslating ? (
            <>
              <Loader2 className="animate-spin" size={17} />
              <span>
                Translating to {selectedLanguage.name} ({completedCount}/{totalChunks})...
              </span>
            </>
          ) : errorCount > 0 ? (
            <>
              <RefreshCw size={17} />
              <span>Retry Failed Batches</span>
            </>
          ) : (
            <span>Translate to {selectedLanguage.name}</span>
          )}
        </button>
      </div>

      {/* 5. Progress Bar */}
      {(isTranslating || (completedCount > 0 && !downloadUrl)) && (
        <div className="mt-4 p-4 bg-white border border-blue-200 rounded-xl shadow-xs">
          <div className="flex justify-between text-xs font-semibold text-blue-950 mb-2">
            <span>
              Progress: {completedCount} / {totalChunks} batches
            </span>
            <span className="text-blue-600 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 6. Translation Complete & Download */}
      {downloadUrl && (
        <div className="mt-4 p-5 bg-white border border-blue-200 rounded-xl shadow-xs text-center space-y-3">
          <div className="inline-flex p-2.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
            <CheckCircle size={28} />
          </div>
          <div>
            <h2 className="text-base font-bold text-blue-950">Translation Complete!</h2>
            <p className="text-xs text-blue-700/70 mt-0.5">
              Translated to {selectedLanguage.name} using{" "}
              {engine === "google" ? "Google Translate" : "Gemini AI"}
            </p>
          </div>

          <a
            href={downloadUrl}
            download={`translated_${selectedLanguage.code}_${file?.name || "subtitles.srt"}`}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Download size={18} />
            <span>Download Translated SRT</span>
          </a>

          <button
            type="button"
            onClick={handleResetFile}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors pt-1 font-semibold"
          >
            Translate another file
          </button>
        </div>
      )}
    </main>
  );
}
