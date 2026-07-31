"use client";

import React, { useState, useRef } from "react";
import Parser from "srt-parser-2";
import { Upload, Download, CheckCircle, Loader2 } from "lucide-react";

export default function SubtitleTranslator() {
  const [file, setFile] = useState<File | null>(null);
  const [srtData, setSrtData] = useState<any[]>([]);
  const [translatedSrtData, setTranslatedSrtData] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError(null);
    setDownloadUrl(null);
    setTranslatedSrtData([]);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parser = new Parser();
        const parsed = parser.fromSrt(text);
        setSrtData(parsed);
      } catch (err) {
        setError("Failed to parse SRT file. Ensure it's a valid format.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleTranslate = async () => {
    if (!srtData || srtData.length === 0) return;

    setIsTranslating(true);
    setError(null);
    setProgress(0);
    setTranslatedSrtData([]);

    // Chunk size: number of subtitle blocks per API request
    const CHUNK_SIZE = 40;
    const totalChunks = Math.ceil(srtData.length / CHUNK_SIZE);
    
    let allTranslatedChunks: any[] = [];

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const chunk = srtData.slice(start, start + CHUNK_SIZE);

        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunk }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to translate chunk");
        }

        allTranslatedChunks = [...allTranslatedChunks, ...data.translatedChunk];
        
        // Calculate progress percentage
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      setTranslatedSrtData(allTranslatedChunks);
      
      // Generate Downloadable SRT
      const parser = new Parser();
      const newSrtContent = parser.toSrt(allTranslatedChunks);
      
      const blob = new Blob([newSrtContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during translation.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 flex items-center justify-center p-4">
      {/* Dynamic Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
            Subtitle Translator
          </h1>
          <p className="text-slate-400">Seamlessly translate English SRT files to Sinhala</p>
        </div>

        {/* Upload Zone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-all duration-300 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer bg-slate-950/30 group mb-6 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
        >
          <input 
            type="file" 
            accept=".srt" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <div className="p-4 bg-slate-800 rounded-full group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors mb-4">
            <Upload size={32} />
          </div>
          <p className="text-lg font-medium text-slate-200">
            {file ? file.name : "Click to upload your .srt file"}
          </p>
        </div>

        {/* Action Button */}
        {file && !downloadUrl && (
          <div className="flex flex-col items-center">
            <button 
              onClick={handleTranslate} 
              disabled={isTranslating}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform active:scale-[0.98] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isTranslating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Translating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Translate to Sinhala
                </span>
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center shadow-inner">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        {isTranslating && (
          <div className="mt-8 bg-slate-900/50 p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between text-sm font-medium mb-3 text-slate-300">
              <span>Translation Progress</span>
              <span className="text-indigo-300">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 transition-all duration-500 ease-out relative shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] animate-[progress_1s_linear_infinite]" />
              </div>
            </div>
            <p className="text-center text-slate-500 text-xs mt-4">
              Processing in batches to avoid token limits. This may take a moment.
            </p>
          </div>
        )}

        {/* Download Section */}
        {downloadUrl && (
          <div className="mt-8 flex flex-col items-center bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 p-8 rounded-2xl">
            <CheckCircle className="text-emerald-400 mb-4" size={48} />
            <h3 className="text-emerald-300 font-semibold text-xl mb-6">Translation Complete!</h3>
            <a 
              href={downloadUrl} 
              download={`translated_${file?.name}`}
              className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <Download size={22} />
              Download Translated SRT
            </a>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}} />
    </div>
  );
}
