"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const { user, userData, loading } = useAuth();
  const [feed, setFeed] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const fetchFeed = async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (user) {
          const idToken = await user.getIdToken(true);
          headers["Authorization"] = `Bearer ${idToken}`;
        }
        
        const res = await fetch("/api/videos/feed", { headers });
        const data = await res.json();
        
        if (res.ok) {
           setFeed(data.data);
        } else {
           throw new Error(data.error);
        }
        
      } catch (err: any) {
        setError("Failed to initialize dashboard matrix.");
      }
    };

    fetchFeed();
  }, [user, loading]);

  if (loading || !feed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 flex-col">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500 tracking-widest text-sm uppercase">Curating Feed</p>
      </div>
    );
  }

  const renderVideoCard = (video: any) => (
    <Link href={`/watch/${video.id || video.videoId}`} key={video.id || video.videoId} 
          className="group relative flex-shrink-0 w-80 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col">
      <div className="aspect-video bg-black relative overflow-hidden">
        {video.thumbnailUrl && <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        
        {/* Progress Bar natively mapping to watch_history logic */}
        {video.progress_seconds !== undefined && video.duration_seconds > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-gray-700 w-full">
            <div className="h-full bg-indigo-500" style={{ width: `${Math.min((video.progress_seconds / video.duration_seconds) * 100, 100)}%` }}></div>
          </div>
        )}

        {/* Access Tag overlays */}
        {video.accessType && (
           <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border ${
             video.accessType === 'free' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 
             video.accessType === 'paid' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 
             'bg-purple-500/20 text-purple-400 border-purple-500/50'
           }`}>
             {video.accessType.toUpperCase()}
           </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-grow justify-between bg-gradient-to-b from-transparent to-gray-950/50">
        <div>
           <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight mb-2 group-hover:text-indigo-400 transition-colors">{video.title}</h3>
           {video.views !== undefined && <p className="text-sm text-gray-500 font-medium">{video.views.toLocaleString()} viewers worldwide</p>}
        </div>
        {video.progress_seconds !== undefined && <p className="text-xs text-indigo-400 mt-4 uppercase tracking-wider font-bold">Resume Playback →</p>}
        {video.price_coins > 0 && video.progress_seconds === undefined && (
          <p className="text-amber-500 font-bold text-sm mt-4">{video.price_coins} Coins</p>
        )}
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden selection:bg-indigo-500/30">
      

      <main className="mx-auto max-w-7xl px-8 py-12 space-y-16">
        
        {/* Continue Watching Section */}
        {feed.continueWatching?.length > 0 && (
          <section className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <span className="w-1.5 h-8 rounded-full bg-indigo-500 block shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span> 
              Jump Back In
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x hover:scrollbar-default scrollbar-hide py-2 px-2 -mx-2 hide-scroll">
              {feed.continueWatching.map((v: any) => renderVideoCard(v))}
            </div>
          </section>
        )}

        {/* Recommended For You Section */}
        {feed.recommended?.length > 0 && (
          <section className="animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <span className="w-1.5 h-8 rounded-full bg-emerald-500 block shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span> 
              Precision Curated
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide py-2 px-2 -mx-2 hide-scroll">
              {feed.recommended.map((v: any) => renderVideoCard(v))}
            </div>
          </section>
        )}

        {/* Trending Section */}
        <section className="animate-fade-in-up" style={{animationDelay: '200ms'}}>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <span className="w-1.5 h-8 rounded-full bg-amber-500 block shadow-[0_0_15px_rgba(245,158,11,0.5)]"></span> 
            Global Trends
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide py-2 px-2 -mx-2 hide-scroll">
            {feed.trending.map((v: any) => renderVideoCard(v))}
            {feed.trending.length === 0 && <p className="text-gray-600 italic px-4 font-mono w-full text-center py-12 border border-gray-800 border-dashed rounded-xl">Global catalog is initializing. Backend ingest missing.</p>}
          </div>
        </section>

      </main>
      
      {/* Hide Scrollbar Hack */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in-up {
           0% { opacity: 0; transform: translateY(20px); }
           100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
      `}} />
    </div>
  );
}
