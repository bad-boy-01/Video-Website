"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Navbar } from "@/components/Navbar";
import { Heart, Loader2, VideoOff, X, Eye, Gem, Crown, LockKeyhole } from "lucide-react";
import Link from "next/link";

interface WishlistVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  accessType: "free" | "paid" | "subscription";
  views: number;
  price_coins: number;
  tags: string[];
  duration_seconds: number;
}

const ACCESS_BADGE: Record<string, { label: string; cls: string }> = {
  free: { label: "FREE", cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
  subscription: { label: "PRO", cls: "bg-purple-500/20 text-purple-300 border border-purple-500/30" },
  paid: { label: "PAID", cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
};

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [videos, setVideos] = useState<WishlistVideo[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchWishlist = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/user/wishlist", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.videos) setVideos(data.videos);
        else showError(data.error || "Failed to load wishlist");
      } catch {
        showError("Network error loading wishlist");
      } finally {
        setPageLoading(false);
      }
    };
    fetchWishlist();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeFromWishlist = async (videoId: string) => {
    if (!user) return;
    setRemoving(videoId);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (data.success) {
        setVideos((prev) => prev.filter((v) => v.id !== videoId));
        success("Removed from wishlist");
      } else {
        showError(data.error || "Failed to remove");
      }
    } catch {
      showError("Network error");
    } finally {
      setRemoving(null);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#191022] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191022] text-white font-['Space_Grotesk',sans-serif]">
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-7 h-7 text-red-400 fill-red-400" />
          <h1 className="text-3xl font-black">My Wishlist</h1>
          <span className="ml-1 rounded-full bg-purple-600/20 border border-purple-500/30 px-3 py-0.5 text-sm font-bold text-purple-300">
            {videos.length}
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <VideoOff className="w-16 h-16 mb-4 text-gray-600" />
            <p className="text-xl font-bold text-gray-400">Your wishlist is empty</p>
            <p className="text-sm mt-2 mb-6">Save videos you want to watch later</p>
            <Link
              href="/browse"
              className="rounded-xl bg-[#8c25f4] px-6 py-3 font-bold text-white hover:brightness-110 transition-all"
            >
              Browse Videos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((video) => {
              const badge = ACCESS_BADGE[video.accessType];
              return (
                <div key={video.id} className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden hover:border-purple-500/40 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10">
                  {/* Remove Button */}
                  <button
                    onClick={(e) => { e.preventDefault(); removeFromWishlist(video.id); }}
                    disabled={removing === video.id}
                    className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/40 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from wishlist"
                  >
                    {removing === video.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>

                  <Link href={`/watch/${video.id}`}>
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className={`absolute top-2 left-2 rounded-md px-2 py-0.5 text-xs font-bold flex items-center gap-1 ${badge.cls}`}>
                        {video.accessType === "subscription" && <Crown className="w-3 h-3" />}
                        {video.accessType === "paid" && <LockKeyhole className="w-3 h-3" />}
                        {badge.label}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">{video.title}</h3>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {video.views?.toLocaleString()}</span>
                        {video.accessType === "paid" && (
                          <span className="flex items-center gap-1 text-amber-400 font-bold"><Gem className="w-3 h-3" /> {video.price_coins}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
