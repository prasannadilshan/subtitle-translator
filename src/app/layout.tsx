import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Subtitle Translator - Free Online Subtitle Translator",
  description:
    "Free online subtitle translator. Quickly translate subtitle files to over 40 different languages using Google Translate or Gemini AI.",
  keywords: ["subtitles translator", "translate subtitles", "free srt translator", "subtitle translation tool"],
  authors: [{ name: "Subtitle Translator Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans overflow-x-hidden">
        <Navbar />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
