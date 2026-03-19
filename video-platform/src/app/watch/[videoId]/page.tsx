"use client";

import { use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Hls from "hls.js";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useToast } from "@/context/ToastContext";

interface PageProps {
  params: Promise<{ videoId: string }>
}

function WatchContent({ videoId }: { videoId: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [video, setVideo] = useState<any>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isHlsUrl, setIsHlsUrl] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { success, error } = useToast();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(`/login`);
      return;
    }

    const fetchVideo = async () => {
      try {
        const idToken = await user.getIdToken(true);
        const res = await fetch(`/api/videos/${videoId}`, {
          headers: { "Authorization": `Bearer ${idToken}` }
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to fetch video stream.");

        setVideo(data.video);

        if (data.accessDenied) {
           setAccessDenied(true);
        } else {
           setAccessDenied(false);
           setErrorMsg(null);
           setPlaybackUrl(data.playbackUrl);
           setIsHlsUrl(data.isHLS || false);
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    };
    fetchVideo();
  }, [user, loading, videoId, router, refreshKey]);

  const handlePurchase = async () => {
    if (!user || !video) return;
    setIsPurchasing(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/videos/purchase", {
         method: "POST",
         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
         body: JSON.stringify({ videoId })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      
      success("Asset authorization successful. Credentials deposited.");
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      error("Authorization loop failed: " + err.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Engine Setup
  useEffect(() => {
    if (playbackUrl && videoRef.current) {
       const videoEl = videoRef.current;
       let hlsInstance: Hls | null = null;

       if (isHlsUrl && Hls.isSupported()) {
          hlsInstance = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 30 });
          hlsInstance.loadSource(playbackUrl);
          hlsInstance.attachMedia(videoEl);
          
          hlsInstance.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hlsInstance?.startLoad();
              else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hlsInstance?.recoverMediaError();
              else hlsInstance?.destroy();
            }
          });
       } else {
          // Fallback to Native (Safari HLS) or standard MP4
          videoEl.src = playbackUrl;
       }

       return () => {
          if (hlsInstance) hlsInstance.destroy();
       };
    }
  }, [playbackUrl, isHlsUrl]);

  // Telemetry Tracker
  useEffect(() => {
    if (!user || accessDenied || !playbackUrl) return;
    
    const interval = setInterval(() => {
       if (videoRef.current && !videoRef.current.paused) {
          const progress = Math.floor(videoRef.current.currentTime);
          
          setDoc(doc(db, "watch_history", `${user.uid}_${videoId}`), {
             userId: user.uid,
             videoId: videoId,
             progress_seconds: progress,
             lastWatchedAt: serverTimestamp()
          }, { merge: true }).catch(() => { /* silent telemetry failure */ });
       }
    }, 10000); // Pulse every 10 seconds locally exactly as requested
    
    return () => clearInterval(interval);
  }, [user, videoId, accessDenied, playbackUrl]);

  if (loading || (!video && !errorMsg)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30 pt-10">
      <div className="mx-auto max-w-6xl px-6">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-white transition-colors">
          ← Back to Catalog
        </button>

        {errorMsg ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400 font-bold">
            {errorMsg}
          </div>
        ) : accessDenied ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/60 p-8 text-center backdrop-blur-md shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent)]"></div>
             
             <svg className="mb-4 h-16 w-16 text-gray-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0h.01M12 9v4m-9 4h18a2 2 0 002-2v-3.5a2 2 0 00-2-2h-3v-1a5 5 0 00-10 0v1H3a2 2 0 00-2 2V19a2 2 0 002 2z" />
             </svg>
             
             <h2 className="text-2xl font-black text-white mb-2">Vault Encrypted</h2>
             <p className="text-gray-400 mb-8 max-w-sm leading-relaxed">This video requires superior licensing clearance. Purchase individual access to view instantly.</p>
             
             <button 
               onClick={handlePurchase}
               disabled={isPurchasing}
               className="rounded-xl shadow-[0_10px_30px_-10px_rgba(245,158,11,0.5)] bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3.5 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0"
             >
               {isPurchasing ? "Decrypting..." : `Purchase for ${video?.price_coins} Coins`}
             </button>
          </div>
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-gray-800 bg-black shadow-[0_15px_60px_-15px_rgba(0,0,0,1)]">
             <video
               ref={videoRef}
               controls
               autoPlay
               className="h-full w-full object-contain"
               crossOrigin="anonymous"
             />
          </div>
        )}

        {video && (
          <div className="mt-8 border-b border-gray-800 pb-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-4">
                <h1 className="text-3xl font-black leading-tight sm:text-4xl">{video.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                   <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${video.accessType === 'free' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : video.accessType === 'paid' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                     {video.accessType}
                   </span>
                   {video.tags?.map((t: string) => (
                      <span key={t} className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-900 border border-gray-800 rounded-md">
                        #{t}
                      </span>
                   ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm font-semibold text-gray-400">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {(video.views || 0).toLocaleString()} Views
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchPage({ params }: PageProps) {
  // Unpack the Next.js 15 asynchronous segment promises strictly!
  const paramsObj = use(params);
  return <WatchContent videoId={paramsObj.videoId} />;
}
