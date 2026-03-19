"use client";

import { useState, useEffect } from "react";
import AdminRoute from "@/components/AdminRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Navbar } from "@/components/Navbar";
import {
  Search, Users, Crown, ShieldAlert, Loader2, Edit3, X,
  ChevronRight, TrendingUp, Gem
} from "lucide-react";
import Link from "next/link";

interface AdminUser {
  id: string;
  uid?: string;
  email: string;
  role: string;
  subscription_status: string;
  wallet_balance: number;
  createdAt: number | { _seconds: number };
  name?: string;
}

function formatDate(ts: number | { _seconds: number }) {
  const ms = typeof ts === "number" ? ts : (ts?._seconds || 0) * 1000;
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [coinModal, setCoinModal] = useState<AdminUser | null>(null);
  const [coinAmount, setCoinAmount] = useState(0);
  const [coinReason, setCoinReason] = useState("");

  const fetchUsers = async (s?: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const url = s ? `/api/admin/users?search=${encodeURIComponent(s)}` : "/api/admin/users";
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.users) setUsers(data.users);
      else showError(data.error || "Failed to load users");
    } catch { showError("Network error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(search); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRole = async (u: AdminUser) => {
    if (!user) return;
    const newRole = u.role === "admin" ? "user" : "admin";
    setActionLoading(u.id + "_role");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: u.id, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((usr) => usr.id === u.id ? { ...usr, role: newRole } : usr));
        success(`Role updated to ${newRole}`);
      } else showError(data.error || "Failed to update role");
    } catch { showError("Network error"); }
    finally { setActionLoading(null); }
  };

  const adjustCoins = async () => {
    if (!user || !coinModal || coinAmount === 0) return;
    setActionLoading(coinModal.id + "_coins");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/users/coins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: coinModal.id, amount: coinAmount, reason: coinReason }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => u.id === coinModal.id ? { ...u, wallet_balance: (u.wallet_balance || 0) + coinAmount } : u));
        success(`Coins adjusted: ${coinAmount >= 0 ? "+" : ""}${coinAmount}`);
        setCoinModal(null);
        setCoinAmount(0);
        setCoinReason("");
      } else showError(data.error || "Failed to adjust coins");
    } catch { showError("Network error"); }
    finally { setActionLoading(null); }
  };

  const totalUsers = users.length;
  const activeSubscribers = users.filter((u) => u.subscription_status === "active").length;

  return (
    <AdminRoute>
      <div className="min-h-screen bg-[#191022] text-white font-['Space_Grotesk',sans-serif]">
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Admin Sidebar Links */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
            {[
              { href: "/admin", label: "Dashboard" },
              { href: "/admin/videos", label: "Videos" },
              { href: "/admin/users", label: "Users" },
              { href: "/admin/transactions", label: "Transactions" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${href === "/admin/users" ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-400 hover:text-white"}`}
              >
                {label} <ChevronRight className="w-3 h-3" />
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Users", value: totalUsers, icon: <Users className="w-5 h-5" />, color: "text-blue-400" },
              { label: "Active Subscribers", value: activeSubscribers, icon: <Crown className="w-5 h-5" />, color: "text-purple-400" },
              { label: "Total Coins in System", value: users.reduce((sum, u) => sum + (u.wallet_balance || 0), 0).toLocaleString(), icon: <Gem className="w-5 h-5" />, color: "text-amber-400" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="rounded-2xl border border-purple-500/20 bg-slate-900/50 p-5">
                <div className={`flex items-center gap-2 mb-1 ${color}`}>{icon}<span className="text-sm font-semibold">{label}</span></div>
                <p className="text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-black mb-4">User Management</h1>

          {/* Search */}
          <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by email..." className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
          </form>

          {/* Table */}
          <div className="rounded-2xl border border-purple-500/20 bg-slate-900/50 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/50">
                      {["User", "Role", "Subscription", "Balance", "Joined", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                              {u.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{u.name || u.email?.split("@")[0]}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${u.role === "admin" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-slate-700 text-gray-300 border-slate-600"}`}>
                            {u.role === "admin" && <ShieldAlert className="w-3 h-3" />}{u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${u.subscription_status === "active" ? "text-purple-400" : "text-gray-400"}`}>
                            {u.subscription_status === "active" && <Crown className="inline w-3 h-3 mr-1" />}
                            {u.subscription_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-amber-400 font-bold text-sm"><Gem className="w-3.5 h-3.5" />{u.wallet_balance?.toLocaleString() || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleRole(u)} disabled={!!actionLoading}
                              className="flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-gray-300 hover:bg-slate-600 transition-all">
                              {actionLoading === u.id + "_role" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Edit3 className="w-3 h-3" />}
                              {u.role === "admin" ? "→ User" : "→ Admin"}
                            </button>
                            <button onClick={() => { setCoinModal(u); setCoinAmount(0); setCoinReason(""); }}
                              className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all">
                              <Gem className="w-3 h-3" /> Coins
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Coin Adjustment Modal */}
        {coinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-purple-500/30 bg-slate-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Adjust Coins</h3>
                <button onClick={() => setCoinModal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-400 mb-4">Adjusting balance for <strong className="text-white">{coinModal.email}</strong></p>
              <p className="text-sm text-gray-400 mb-1">Current balance: <span className="text-amber-400 font-bold">{coinModal.wallet_balance?.toLocaleString()} coins</span></p>
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Amount (negative to subtract)</label>
                  <input type="number" value={coinAmount} onChange={(e) => setCoinAmount(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-white outline-none focus:border-purple-500"
                    placeholder="e.g. 500 or -100" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Reason (optional)</label>
                  <input value={coinReason} onChange={(e) => setCoinReason(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-white outline-none focus:border-purple-500"
                    placeholder="Promotional bonus, correction, etc." />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setCoinModal(null)} className="flex-1 rounded-xl bg-slate-700 py-2.5 font-semibold text-gray-300 hover:bg-slate-600">Cancel</button>
                <button onClick={adjustCoins} disabled={coinAmount === 0 || !!actionLoading}
                  className="flex-1 rounded-xl bg-[#8c25f4] py-2.5 font-bold text-white hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Apply {coinAmount >= 0 ? "+" : ""}{coinAmount} coins
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
