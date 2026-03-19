"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Clock } from "lucide-react";

export default function ExpiredLinkPage() {
  return (
    <div className="min-h-screen bg-[#191022] text-white font-['Space_Grotesk',sans-serif]">
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <Navbar />
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-3xl scale-150" />
          <Clock className="relative w-24 h-24 text-purple-400" />
        </div>
        <h1 className="text-4xl font-black mb-3">Link Expired</h1>
        <p className="text-gray-400 max-w-md mb-8 text-lg">
          This video link has expired. Signed URLs are valid for 2 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/" className="rounded-xl bg-[#8c25f4] px-6 py-3 font-bold text-white hover:brightness-110 transition-all">
            Go to Home
          </Link>
          <Link href="/browse" className="rounded-xl bg-slate-800 border border-slate-700 px-6 py-3 font-bold text-gray-300 hover:bg-slate-700 transition-all">
            Browse Videos
          </Link>
        </div>
      </div>
    </div>
  );
}
