"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Search, ChevronDown, ChevronUp, HelpCircle, Mail } from "lucide-react";

const FAQ_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      { q: "How do I create an account?", a: "Click 'Sign Up' on the top navigation. You can register using your email address or sign in with Google for instant access." },
      { q: "How do I browse available videos?", a: "Visit /browse to explore the full catalog. Use filters for category, access type, and sorting to find exactly what you're looking for." },
      { q: "What types of content are available?", a: "VaultStream offers free content, paid videos (purchasable with coins), and premium subscription-exclusive titles in categories like Action, Tech, Comedy, and more." },
    ],
  },
  {
    title: "Coins & Payments",
    items: [
      { q: "How do I buy coins?", a: "Go to /coins and select a coin package. Payments are processed securely via Razorpay. Coins are instantly credited to your wallet." },
      { q: "How do I use coins to watch a video?", a: "On any paid video's watch page, click 'Unlock with Coins'. The coins will be deducted from your wallet and you'll get permanent access to the video." },
      { q: "Are refunds available?", a: "Coin purchases are non-refundable as they are digital goods. If you experience a payment issue, contact our support team with your transaction ID." },
      { q: "Is Razorpay safe to use?", a: "Yes. Razorpay is a PCI DSS Level 1 certified payment gateway. VaultStream never stores your card details." },
    ],
  },
  {
    title: "Video Streaming",
    items: [
      { q: "Why is my video buffering?", a: "Buffering is usually caused by a slow internet connection. We recommend a minimum 10 Mbps connection for HD streaming. Try refreshing the page or lowering quality." },
      { q: "What formats does VaultStream support?", a: "VaultStream uses HLS (HTTP Live Streaming) for adaptive bitrate streaming, along with direct MP4/WEBM playback for non-HLS videos." },
      { q: "How long are video playback links valid?", a: "Secure signed URLs for video playback are valid for 2 hours. If your link expires, simply revisit the watch page to get a fresh URL." },
      { q: "Can I download videos?", a: "Downloads are not currently supported. All content is streamed for digital rights protection." },
    ],
  },
  {
    title: "Account & Security",
    items: [
      { q: "How do I change my password?", a: "Go to Settings → Security tab and click 'Send Reset Email'. We'll email you a secure password reset link." },
      { q: "How do I update my display name?", a: "Go to Settings → Profile tab, update your Display Name, and click 'Save Changes'." },
      { q: "Can I delete my account?", a: "To delete your account and all associated data, please contact support at support@vaultstream.app. We will process your request within 7 days." },
      { q: "How is my data protected?", a: "All data is stored securely in Google Firebase with industry-standard encryption. We never share your personal data with third parties." },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-700/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left gap-4"
      >
        <span className="font-semibold text-white">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-purple-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="pb-4 text-gray-400 text-sm leading-relaxed animate-in slide-in-from-top-2 fade-in">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState("");

  const filtered = FAQ_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((sec) => sec.items.length > 0);

  return (
    <div className="min-h-screen bg-[#191022] text-white font-['Space_Grotesk',sans-serif]">
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <Navbar />

      {/* Hero */}
      <section className="py-16 px-6 text-center bg-gradient-to-b from-purple-900/10 to-transparent">
        <HelpCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h1 className="text-4xl font-black mb-3">Help Center</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">Find answers to common questions about VaultStream.</p>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for answers..."
            className="w-full rounded-2xl bg-slate-800 border border-slate-700 pl-12 pr-5 py-4 text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
          />
        </div>
      </section>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-semibold">No results for &quot;{search}&quot;</p>
            <p className="text-sm mt-2">Try a different search term.</p>
          </div>
        ) : (
          filtered.map((section) => (
            <div key={section.title} className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-4">{section.title}</h2>
              <div className="rounded-2xl border border-purple-500/20 bg-slate-900/50 px-6">
                {section.items.map((item) => (
                  <AccordionItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-slate-900/80 p-8 text-center">
          <Mail className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Still need help?</h3>
          <p className="text-gray-400 mb-5 text-sm">Our team is here to help. Send us a message and we&apos;ll get back to you within 24 hours.</p>
          <a
            href="mailto:support@vaultstream.app"
            className="inline-flex items-center gap-2 rounded-xl bg-[#8c25f4] px-6 py-3 font-bold text-white hover:brightness-110 transition-all"
          >
            <Mail className="w-4 h-4" /> support@vaultstream.app
          </a>
        </div>
      </div>
    </div>
  );
}
