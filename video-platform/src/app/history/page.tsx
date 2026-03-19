"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { History, PlayCircle, Clock } from "lucide-react";
import Image from "next/image";

interface HistoryItem {
  videoId: string;
  progress_seconds: number;
  lastWatchedAt: number;
  video: {
    title: string;
    thumbnailUrl: string;
    duration_seconds: number;
    accessType: string;
    tags: string[];
  };
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/user/history", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setHistory(data.history || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [user, loading, router]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}m ${sec}s`;
  };

  const formatDate = (millis: number) => {
    if (!millis) return "Unknown";
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(millis));
  };

  if (loading || isLoading) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-gray-950">
         <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
           <h1 className="text-3xl font-black md:text-4xl flex items-center gap-3">
             <History className="text-indigo-500 h-8 w-8" />
             Watch History
           </h1>
        </div>

        {error && (
           <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400 font-bold">
              Archival Fetch Error: {error}
           </div>
        )}

        {!error && history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-gray-800 border-dashed bg-gray-900/30">
             <div className="h-24 w-24 rounded-full bg-gray-900 flex items-center justify-center mb-6 shadow-xl">
               <History className="h-10 w-10 text-gray-600" />
             </div>
             <h2 className="text-2xl font-bold text-gray-300 mb-2">Clean Slate</h2>
             <p className="text-gray-500 max-w-sm">Your telemetry archive is empty. Begin streaming content to map progress vectors.</p>
             <Link href="/" className="mt-8 rounded-xl bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors">
               Explore Catalog
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {history.map((item, idx) => {
              const progressPercentage = item.video.duration_seconds > 0 
                 ? Math.min((item.progress_seconds / item.video.duration_seconds) * 100, 100) 
                 : 0;
                 
              return (
                 <Link href={`/watch/${item.videoId}`} key={`${item.videoId}-${idx}`} className="group flex flex-col rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                    
                    <div className="relative aspect-video bg-black overflow-hidden">
                       {item.video.thumbnailUrl && (
                         <Image src={item.video.thumbnailUrl} alt={item.video.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                       
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <PlayCircle className="h-14 w-14 text-white drop-shadow-2xl" strokeWidth={1.5} />
                       </div>

                       <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                         <span className="rounded-md bg-gray-950/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-gray-800 shadow-xl">
                           {formatTime(item.progress_seconds)} / {formatTime(item.video.duration_seconds)}
                         </span>
                         
                         {item.video.accessType && (
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                             item.video.accessType === "free" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                             item.video.accessType === "paid" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                             "bg-purple-500/20 text-purple-300 border-purple-500/30"
                           }`}>
                             {item.video.accessType}
                           </span>
                         )}
                       </div>

                       {/* Progress Bar mapping */}
                       <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                         <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ width: `${progressPercentage}%` }}></div>
                       </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-gray-900 to-gray-950">
                       <h3 className="text-base font-bold text-gray-100 line-clamp-2 leading-snug mb-3 group-hover:text-indigo-400 transition-colors">
                         {item.video.title}
                       </h3>
                       
                       <div className="mt-auto pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500 font-medium">
                         <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDate(item.lastWatchedAt)}</span>
                         <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded-md">
                           Resume at {formatTime(item.progress_seconds)}
                         </span>
                       </div>
                    </div>
                 </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
