import Link from "next/link";
import { AlertOctagon } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Page Not Found | VaultStream",
  description: "The requested directory does not map to any active matrix endpoints.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white selection:bg-indigo-500/30">
        <div className="flex flex-col items-center text-center max-w-lg px-6 animate-in fade-in zoom-in duration-500">
           
           <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gray-900 border border-gray-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent)] rounded-3xl"></div>
              <AlertOctagon className="h-12 w-12 text-indigo-500" />
           </div>

           <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-600 mb-4 drop-shadow-2xl">
              404
           </h1>
           <h2 className="text-2xl font-bold mb-4">Page not found</h2>
           
           <p className="text-gray-400 mb-10 text-sm max-w-sm mx-auto">
             The requested directory block does not map to any active matrix endpoints globally.
           </p>

           <Link href="/" className="rounded-xl bg-indigo-600 px-8 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]">
              Return to Core
           </Link>
        </div>
    </div>
  );
}
