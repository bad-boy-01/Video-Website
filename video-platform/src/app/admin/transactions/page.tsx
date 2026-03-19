"use client";

import React, { useState, useEffect } from "react";
import AdminRoute from "@/components/AdminRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Navbar } from "@/components/Navbar";
import {
  ArrowUpCircle, ShoppingCart, Crown, TrendingUp, Loader2,
  AlertCircle, Download, ChevronRight, DollarSign, Gem
} from "lucide-react";
import Link from "next/link";

interface AdminTransaction {
  id: string;
  userEmail: string;
  type: string;
  amount_coins: number;
  amount_real?: number;
  status: string;
  createdAt: number;
}

const TX_ICONS: Record<string, React.ReactElement> = {
  coin_deposit: <ArrowUpCircle className="w-4 h-4 text-green-400" />,
  video_purchase: <ShoppingCart className="w-4 h-4 text-blue-400" />,
  subscription_payment: <Crown className="w-4 h-4 text-purple-400" />,
  admin_adjustment: <TrendingUp className="w-4 h-4 text-amber-400" />,
};
const TX_LABELS: Record<string, string> = {
  coin_deposit: "Coin Deposit",
  video_purchase: "Video Purchase",
  subscription_payment: "Subscription",
  admin_adjustment: "Admin Adjustment",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "coin_deposit", label: "Coin Deposits" },
  { value: "video_purchase", label: "Video Purchases" },
  { value: "subscription_payment", label: "Subscriptions" },
];
const STATUS_FILTERS = ["all", "completed", "pending", "failed"];

function exportCSV(transactions: AdminTransaction[]) {
  const headers = ["ID", "User", "Type", "Coins", "Real Amount", "Status", "Date"];
  const rows = transactions.map((t) => [
    t.id, t.userEmail, TX_LABELS[t.type] || t.type,
    t.amount_coins, t.amount_real || "", t.status,
    t.createdAt ? formatDate(t.createdAt) : "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `transactions_${Date.now()}.csv`;
  a.click();
}

export default function AdminTransactionsPage() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetch_ = async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams();
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/admin/transactions?${params}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.transactions) setTransactions(data.transactions);
        else showError(data.error || "Failed to load transactions");
      } catch { showError("Network error"); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [user, typeFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalRevenue = transactions.filter((t) => t.type === "coin_deposit" && t.status === "completed").reduce((s, t) => s + (t.amount_real || 0), 0);
  const totalCoins = transactions.filter((t) => t.type === "coin_deposit" && t.status === "completed").reduce((s, t) => s + (t.amount_coins || 0), 0);
  const activeSubs = transactions.filter((t) => t.type === "subscription_payment" && t.status === "completed").length;

  return (
    <AdminRoute>
      <div className="min-h-screen bg-[#191022] text-white font-['Space_Grotesk',sans-serif]">
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Admin Nav */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
            {[
              { href: "/admin", label: "Dashboard" },
              { href: "/admin/videos", label: "Videos" },
              { href: "/admin/users", label: "Users" },
              { href: "/admin/transactions", label: "Transactions" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className={`shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${href === "/admin/transactions" ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-400 hover:text-white"}`}>
                {label} <ChevronRight className="w-3 h-3" />
              </Link>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: "text-green-400" },
              { label: "Total Coins Sold", value: totalCoins.toLocaleString(), icon: <Gem className="w-5 h-5" />, color: "text-amber-400" },
              { label: "Subscription Payments", value: activeSubs, icon: <Crown className="w-5 h-5" />, color: "text-purple-400" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="rounded-2xl border border-purple-500/20 bg-slate-900/50 p-5">
                <div className={`flex items-center gap-2 mb-1 ${color}`}>{icon}<span className="text-sm font-semibold">{label}</span></div>
                <p className="text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h1 className="text-2xl font-black">Transaction Log</h1>
            <button onClick={() => exportCSV(transactions)}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-700 transition-all">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TYPE_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setTypeFilter(f.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${typeFilter === f.value ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-400 hover:text-white"}`}
              >{f.label}</button>
            ))}
            <span className="text-gray-600">|</span>
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all ${statusFilter === s ? "bg-slate-600 text-white" : "bg-slate-800 text-gray-400 hover:text-white"}`}
              >{s}</button>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-purple-500/20 bg-slate-900/50 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <AlertCircle className="w-12 h-12 mb-3 text-gray-600" /><p>No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/50">
                      {["User", "Type", "Coins", "Amount ₹", "Status", "Date"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-300 max-w-[180px] truncate">{tx.userEmail}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                            {TX_ICONS[tx.type] || null}{TX_LABELS[tx.type] || tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold text-sm ${tx.type === "coin_deposit" || tx.type === "admin_adjustment" ? "text-green-400" : "text-red-400"}`}>
                            {tx.type === "coin_deposit" || tx.type === "admin_adjustment" ? "+" : "-"}{tx.amount_coins?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{tx.amount_real != null ? `₹${tx.amount_real}` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tx.status === "completed" ? "bg-green-500/10 text-green-400" : tx.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{tx.createdAt ? formatDate(tx.createdAt) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
