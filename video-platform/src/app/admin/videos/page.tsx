"use client";

import { useState, useEffect, useCallback } from "react";
import AdminRoute from "@/components/AdminRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Navbar } from "@/components/Navbar";
import {
  Search, Trash2, Eye, EyeOff, Gem, ChevronLeft, ChevronRight,
  Loader2, Video, CheckCircle2, AlertCircle, Clock, Edit3, Save, X
} from "lucide-react";

interface AdminVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  status: string;
  accessType: string;
  views: number;
  price_coins: number;
  createdAt: number | { _seconds: number };
}

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ReactElement }> = {
  published: { label: "Published", cls: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  processing: { label: "Processing", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Clock className="w-3.5 h-3.5" /> },
  hidden: { label: "Hidden", cls: "bg-red-500/20 text-red-400 border-red-500/30", icon: <EyeOff className="w-3.5 h-3.5" /> },
};

function formatDate(ts: number | { _seconds: number }) {
  const ms = typeof ts === "number" ? ts : (ts?._seconds || 0) * 1000;
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminVideosPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [editPrice, setEditPrice] = useState<{ id: string; val: number } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const PAGE = 20;

  const fetchVideos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/videos?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.videos) { setVideos(data.videos); setTotal(data.total || 0); }
      else showError(data.error || "Failed to load videos");
    } catch { showError("Network error"); }
    finally { setLoading(false); }
  }, [user, page, statusFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const toggleStatus = async (video: AdminVideo) => {
    if (!user) return;
    const newStatus = video.status === "published" ? "hidden" : "published";
    setActionLoading(video.id + "_status");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/videos/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ videoId: video.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setVideos((prev) => prev.map((v) => v.id === video.id ? { ...v, status: newStatus } : v));
        success(`Video ${newStatus === "published" ? "published" : "hidden"}`);
      } else showError(data.error || "Failed to update status");
    } catch { showError("Network error"); }
    finally { setActionLoading(null); }
  };

  const deleteVideo = async (videoId: string) => {
    if (!user || !confirm("Soft delete this video? It will no longer appear in the feed.")) return;
    setActionLoading(videoId + "_delete");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (data.success) { setVideos((prev) => prev.filter((v) => v.id !== videoId)); success("Video deleted"); }
      else showError(data.error || "Failed to delete");
    } catch { showError("Network error"); }
    finally { setActionLoading(null); }
  };

  const savePrice = async (videoId: string, price: number) => {
    if (!user) return;
    setActionLoading(videoId + "_price");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/videos/price", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ videoId, price_coins: price }),
      });
      const data = await res.json();
      if (data.success) {
        setVideos((prev) => prev.map((v) => v.id === videoId ? { ...v, price_coins: price } : v));
        setEditPrice(null);
        success("Price updated");
      } else showError(data.error || "Failed to update price");
    } catch { showError("Network error"); }
    finally { setActionLoading(null); }
  };

  const STATUS_FILTERS = ["all", "published", "processing", "hidden"];

  return (
    <AdminRoute>
      <div className="min-h-screen bg-[#191022] text-white font-['Space_Grotesk',sans-serif]">
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black">Video Manager</h1>
              <p className="text-gray-400 text-sm mt-1">{total} total videos</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(0); }} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title..."
                className="rounded-xl bg-slate-800 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 w-72"
              />
            </form>
            <div className="flex gap-2">
              {STATUS_FILTERS.map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-all ${statusFilter === s ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-400 hover:text-white"}`}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-purple-500/20 bg-slate-900/50 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Video className="w-12 h-12 mb-3 text-gray-600" /><p>No videos found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/50">
                      {["Thumbnail", "Title", "Status", "Access", "Views", "Price (Coins)", "Created", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {videos.map((video) => {
                      const badge = STATUS_BADGE[video.status] || STATUS_BADGE.processing;
                      return (
                        <tr key={video.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <img src={video.thumbnailUrl} alt="" className="w-16 h-9 object-cover rounded-lg" />
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="font-semibold text-sm truncate">{video.title}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${badge.cls}`}>
                              {badge.icon}{badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-semibold capitalize">{video.accessType}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-sm text-gray-300"><Eye className="w-3.5 h-3.5" /> {video.views?.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3">
                            {editPrice?.id === video.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number" min={0}
                                  value={editPrice.val}
                                  onChange={(e) => setEditPrice({ id: video.id, val: Number(e.target.value) })}
                                  className="w-20 rounded-lg bg-slate-800 border border-purple-500 px-2 py-1 text-sm text-white"
                                />
                                <button onClick={() => savePrice(video.id, editPrice.val)} className="text-green-400 hover:text-green-300" disabled={actionLoading === video.id + "_price"}>
                                  {actionLoading === video.id + "_price" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setEditPrice(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setEditPrice({ id: video.id, val: video.price_coins })}
                                className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors group">
                                <Gem className="w-3.5 h-3.5" />{video.price_coins}
                                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{formatDate(video.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleStatus(video)}
                                disabled={!!actionLoading}
                                title={video.status === "published" ? "Hide" : "Publish"}
                                className={`rounded-lg p-1.5 transition-all ${video.status === "published" ? "text-amber-400 hover:bg-amber-500/10" : "text-green-400 hover:bg-green-500/10"}`}
                              >
                                {actionLoading === video.id + "_status" ? <Loader2 className="w-4 h-4 animate-spin" /> : video.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deleteVideo(video.id)}
                                disabled={!!actionLoading}
                                className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all"
                              >
                                {actionLoading === video.id + "_delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {total > PAGE && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-slate-700 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-gray-400">Page {page + 1} of {Math.ceil(total / PAGE)}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE >= total}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-slate-700 flex items-center gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
