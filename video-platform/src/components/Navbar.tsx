"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/firebase/auth";
import {
  Search, UserCircle, History, Gem, ShieldAlert, LogOut,
  VideoIcon, Heart, Wallet, Settings, HelpCircle, Crown, Zap
} from "lucide-react";

export function Navbar() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await logout();
    router.push("/login");
  };

  const isPro = userData?.subscription_status === "active";
  const close = () => setIsDropdownOpen(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <h1 className="text-2xl font-black tracking-tighter">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Vault</span>
            <span className="text-white">Stream</span>
          </h1>
        </Link>

        {/* Search Bar */}
        <div className="hidden flex-1 sm:block max-w-xl">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            <input
              name="q"
              type="text"
              placeholder="Search premium content..."
              className="w-full rounded-full border border-gray-800 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-purple-500 focus:bg-gray-900 focus:ring-2 focus:ring-purple-500/20"
              autoComplete="off"
            />
          </form>
        </div>

        {/* Right Nav */}
        <div className="flex shrink-0 items-center justify-end gap-4">
          {user ? (
            <>
              {userData?.role === "admin" && (
                <Link href="/admin" className="hidden text-sm font-semibold text-gray-400 hover:text-white transition-colors sm:block">
                  Admin Hub
                </Link>
              )}

              <Link href="/coins" className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 transition-colors hover:bg-amber-500/20">
                <span className="text-amber-400 text-lg leading-none">🪙</span>
                <span className="text-sm font-bold text-amber-50">{userData?.wallet_balance?.toLocaleString() || 0}</span>
              </Link>

              {/* Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#8c25f4] text-sm font-bold text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950"
                  aria-label="User Menu"
                >
                  {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  {isPro && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-black">PRO</span>
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-60 origin-top-right rounded-2xl border border-gray-800 bg-gray-900 py-2 shadow-2xl animate-in slide-in-from-top-2 fade-in">
                    <div className="border-b border-gray-800 px-4 py-2.5 mb-2">
                      <p className="truncate text-sm font-semibold text-white">{userData?.name || user.email?.split("@")[0]}</p>
                      <p className="truncate text-xs text-gray-400">{user.email}</p>
                      {isPro && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-xs font-bold text-purple-300">
                          <Crown className="w-3 h-3" /> VaultStream Pro
                        </span>
                      )}
                    </div>

                    <Link onClick={close} href="/browse" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
                      <VideoIcon className="h-4 w-4" /> Browse Videos
                    </Link>

                    <Link onClick={close} href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
                      <UserCircle className="h-4 w-4" /> My Profile
                    </Link>

                    <Link onClick={close} href="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
                      <Heart className="h-4 w-4" /> My Wishlist
                    </Link>

                    <Link onClick={close} href="/history" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
                      <History className="h-4 w-4" /> Watch History
                    </Link>

                    <Link onClick={close} href="/wallet" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
                      <Wallet className="h-4 w-4" /> Wallet & Transactions
                    </Link>

                    <Link onClick={close} href="/coins" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-gray-800 hover:text-amber-300">
                      <Gem className="h-4 w-4" /> Buy Coins
                    </Link>

                    <Link onClick={close} href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>

                    <Link onClick={close} href="/help" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
                      <HelpCircle className="h-4 w-4" /> Help Center
                    </Link>

                    {!isPro && (
                      <Link onClick={close} href="/subscribe" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-purple-400 transition-colors hover:bg-purple-500/10 hover:text-purple-300">
                        <Zap className="h-4 w-4" /> Go Pro
                      </Link>
                    )}

                    {userData?.role === "admin" && (
                      <Link onClick={close} href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-gray-800 hover:text-indigo-300">
                        <ShieldAlert className="h-4 w-4" /> Admin Hub
                      </Link>
                    )}

                    <div className="my-2 border-t border-gray-800" />

                    <button onClick={handleSignOut} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="rounded-full bg-[#8c25f4] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-purple-600/20 transition-transform hover:-translate-y-0.5 hover:brightness-110">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
