"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { logout } from "@/lib/firebase/auth";
import { useToast } from "@/context/ToastContext";
import { UserCircle, Mail, Key, LogOut, Wallet, ShieldCheck, Calendar, Type } from "lucide-react";

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { success, error } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (userData?.name) setDisplayName(userData.name);
  }, [userData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { name: displayName.trim() });
      success("Profile identity seamlessly updated in registry.");
      setIsEditing(false);
    } catch (err: any) {
      error("Registry modification failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown initialization";
    const d = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', day: 'numeric' }).format(d);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-10 text-4xl font-black md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Identity Matrix</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Identity Card */}
          <div className="md:col-span-1 rounded-3xl border border-gray-800 bg-gray-900/60 p-8 shadow-2xl backdrop-blur-md flex flex-col items-center">
             <div className="h-32 w-32 rounded-full border-4 border-gray-800 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl font-black text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] mb-6">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
             </div>
             
             <h2 className="text-xl font-bold mb-1 truncate w-full text-center">{userData?.name || "Anonymous Operative"}</h2>
             <p className="text-sm text-gray-500 mb-6 truncate w-full text-center">{user.email}</p>
             
             <div className="w-full space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-gray-800/50 px-4 py-3">
                   <ShieldCheck className={`h-5 w-5 ${userData?.role === 'admin' ? 'text-red-400' : 'text-emerald-400'}`} />
                   <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Access Clearance</span>
                      <span className="text-sm font-semibold capitalize text-gray-200">{userData?.role || 'user'}</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-3 rounded-xl bg-gray-800/50 px-4 py-3">
                   <Calendar className="h-5 w-5 text-indigo-400" />
                   <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Initialization Date</span>
                      <span className="text-sm font-semibold text-gray-200">{formatDate(userData?.createdAt)}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Operations Layout */}
          <div className="md:col-span-2 space-y-8">
             
             {/* Subscriptions & Wealth Dashboard */}
             <div className="grid grid-cols-2 gap-4">
               <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6 flex flex-col justify-center shadow-xl">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                     <Wallet className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Treasury Balance</span>
                  <div className="flex items-center gap-2">
                     <span className="text-3xl font-black text-white">{userData?.wallet_balance?.toLocaleString() || 0}</span>
                     <span className="text-xl">🪙</span>
                  </div>
               </div>
               
               <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6 flex flex-col justify-center shadow-xl">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                     <Key className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Global Subscription</span>
                  <div>
                    <span className={`inline-flex px-3 py-1 text-sm font-bold uppercase rounded-md border ${userData?.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {userData?.subscription_status || 'Inactive'}
                    </span>
                  </div>
               </div>
             </div>

             {/* Profile Modifications */}
             <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2"><UserCircle className="text-indigo-500" /> Identity Configuration</h3>
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-indigo-400 hover:text-white transition-colors">Modify Parameters</button>
                  )}
                </div>
                
                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div>
                      <label className="mb-1 block text-sm font-bold uppercase tracking-widest text-gray-500">Display Identity</label>
                      <div className="relative">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={isSaving}
                          className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-3 pl-10 pr-4 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2">
                       <button type="button" onClick={() => { setIsEditing(false); setDisplayName(userData?.name || ""); }} className="rounded-xl border border-gray-700 bg-gray-800 px-6 py-2.5 text-sm font-bold text-gray-300 transition-colors hover:bg-gray-700">Cancel</button>
                       <button type="submit" disabled={isSaving} className="rounded-xl border border-transparent bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-colors hover:bg-indigo-500 disabled:opacity-50">
                         {isSaving ? "Synchronizing..." : "Commit Changes"}
                       </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                     <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Display Identity</span>
                        <span className="text-lg font-medium">{userData?.name || "Not initialized."}</span>
                     </div>
                     <div className="flex flex-col pt-4 border-t border-gray-800/50">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Secure Email Gateway</span>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-lg font-medium text-gray-300">{user.email}</span>
                        </div>
                     </div>
                  </div>
                )}
             </div>

             {/* Danger Zone */}
             <div className="rounded-3xl border border-red-500/20 bg-red-950/20 p-8 shadow-xl">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-red-500"><LogOut className="text-red-500" /> Danger Zone</h3>
                <p className="text-gray-400 text-sm mb-6">Terminate your active session endpoint on this node apparatus.</p>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-colors hover:bg-red-500"
                >
                   <LogOut className="h-4 w-4" /> Trigger Session Termination
                </button>
             </div>

          </div>
        </div>

      </div>
    </div>
  );
}
