"use client";

import { useAuth } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import { useToast } from "@/context/ToastContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud, Film, Users, ShieldAlert, Activity, CheckCircle2, EyeOff } from "lucide-react";

interface AdminStats {
  totalVideos: number;
  publishedVideos: number;
  totalUsers: number;
  totalTransactions: number;
}

interface RecentVideo {
  id: string;
  title: string;
  status: string;
  createdAt: number | null;
  thumbnailUrl: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch telemetry array concurrently and map to component state
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setStats(data.stats);
      setRecentVideos(data.recentVideos);
    } catch (err: any) {
      error("Admin core data fetch aborted: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleVideoStatus = async (videoId: string, newStatus: string) => {
     if (!user) return;
     try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/videos/status", {
           method: "POST",
           headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
           body: JSON.stringify({ videoId, status: newStatus })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        
        success(d.message);
        // Soft refresh precisely the modified object logic map locally to avoid re-polling whole DB arrays
        setRecentVideos(prev => prev.map(v => v.id === videoId ? { ...v, status: newStatus } : v));
     } catch (err: any) {
        error("Action failed: " + err.message);
     }
  };

  const formatDate = (millis: number | null) => {
    if (!millis) return "Unrecorded";
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(millis));
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">
        <div className="mx-auto max-w-7xl px-6 py-12">
           
           <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
              <h1 className="text-3xl font-black md:text-4xl flex items-center gap-3">
                 <ShieldAlert className="text-indigo-500 h-10 w-10" />
                 Global Control Node
              </h1>
              
              <Link href="/admin/upload" className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500">
                 <UploadCloud className="h-5 w-5" /> Push New Content
              </Link>
           </div>
           
           {/* Navigation Tabs Header */}
           <div className="mb-10 flex gap-4 border-b border-gray-800 pb-px overflow-x-auto scrollbar-hide">
              <div className="border-b-2 border-indigo-500 pb-3 font-bold text-white px-2 cursor-pointer">Live Dashboard</div>
              <Link href="/admin/upload" className="border-b-2 border-transparent pb-3 font-bold text-gray-500 hover:text-gray-300 px-2 transition-colors">Asset Uploader</Link>
              <div className="border-b-2 border-transparent pb-3 font-bold text-gray-500 px-2 cursor-not-allowed opacity-50">User Operations (Locked)</div>
           </div>

           {isLoading ? (
             <div className="flex items-center justify-center py-20">
               <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
             </div>
           ) : (
             <>
               {/* Telemetry Stat Array Cards */}
               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
                  <StatCard title="Total Assets" value={stats?.totalVideos || 0} icon={<Film className="h-6 w-6 text-indigo-400" />} color="bg-indigo-500/10 border-indigo-500/20" />
                  <StatCard title="Live Published" value={stats?.publishedVideos || 0} icon={<CheckCircle2 className="h-6 w-6 text-emerald-400" />} color="bg-emerald-500/10 border-emerald-500/20" />
                  <StatCard title="Registered Nodes" value={stats?.totalUsers || 0} icon={<Users className="h-6 w-6 text-amber-400" />} color="bg-amber-500/10 border-amber-500/20" />
                  <StatCard title="Ledger Tx Count" value={stats?.totalTransactions || 0} icon={<Activity className="h-6 w-6 text-purple-400" />} color="bg-purple-500/10 border-purple-500/20" />
               </div>
               
               {/* Active Ingests Table Ledger */}
               <div className="rounded-3xl border border-gray-800 bg-gray-900/50 backdrop-blur-md overflow-hidden shadow-2xl">
                  <div className="border-b border-gray-800 px-8 py-5 flex items-center justify-between bg-gray-900/80">
                      <h2 className="text-xl font-bold">Recent Asset Ingests</h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-950/50 text-xs font-bold uppercase tracking-widest text-gray-500">
                           <tr>
                              <th className="px-8 py-4">Title Asset</th>
                              <th className="px-8 py-4">State</th>
                              <th className="px-8 py-4">Ingest Stamp</th>
                              <th className="px-8 py-4 text-right">Moderator Overrides</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                           {recentVideos.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-8 py-16 text-center text-gray-500 italic">No network ingests discovered. Empty database payload.</td>
                              </tr>
                           ) : recentVideos.map(video => (
                              <tr key={video.id} className="hover:bg-gray-800/30 transition-colors">
                                 <td className="px-8 py-4 font-bold max-w-xs truncate">{video.title}</td>
                                 <td className="px-8 py-4">
                                     <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${
                                       video.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                       video.status === 'hidden' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                       'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                     }`}>
                                       {video.status}
                                     </span>
                                 </td>
                                 <td className="px-8 py-4 text-gray-400 font-medium">{formatDate(video.createdAt)}</td>
                                 <td className="px-8 py-4 text-right flex items-center justify-end gap-3">
                                     {video.status !== 'published' && (
                                        <button onClick={() => toggleVideoStatus(video.id, 'published')} className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                                        </button>
                                     )}
                                     {video.status !== 'hidden' && (
                                        <button onClick={() => toggleVideoStatus(video.id, 'hidden')} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-red-950/30 hover:border-red-500/30">
                                            <EyeOff className="h-3.5 w-3.5" /> Hide
                                        </button>
                                     )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
             </>
           )}
        </div>
      </div>
    </AdminRoute>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
   return (
      <div className={`flex flex-col rounded-2xl border bg-gray-900/40 p-6 backdrop-blur-sm shadow-xl ${color}`}>
         <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</span>
            <div className={`p-2 rounded-lg bg-gray-950 shadow-inner`}>{icon}</div>
         </div>
         <span className="text-4xl font-black text-white">{value.toLocaleString()}</span>
      </div>
   );
}
