"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Script from "next/script";
import { useToast } from "@/context/ToastContext";

const PACKAGES = [
  { id: 1, coins: 100, price: 99, tag: "Starter", color: "from-blue-500 to-indigo-500" },
  { id: 2, coins: 500, price: 399, tag: "Popular", color: "from-indigo-500 to-purple-500" },
  { id: 3, coins: 1000, price: 699, tag: "Premium", color: "from-emerald-500 to-teal-500" },
  { id: 4, coins: 5000, price: 2999, tag: "Whale", color: "from-amber-400 to-orange-500" },
];

export default function CoinsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { success, error } = useToast();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    // Rely on Context if available, or fetch directly for maximum accuracy
    if (userData?.wallet_balance !== undefined) {
      setBalance(userData.wallet_balance);
    } else {
      user.getIdToken(true).then(token => {
         fetch("/api/user/wallet", { headers: { "Authorization": `Bearer ${token}` } })
           .then(r => r.json())
           .then(d => d.wallet_balance !== undefined && setBalance(d.wallet_balance))
           .catch(() => {});
      });
    }
  }, [user, userData, loading, router]);

  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    setIsProcessing(true);
    try {
      const idToken = await user!.getIdToken(true);
      
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ amount_inr: pkg.price })
      });
      
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || "Order creation failure");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount, // Paise scalar
        currency: "INR",
        name: "VaultStream Inc.",
        description: `${pkg.coins} Digital Coins Exchange`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
           const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
              body: JSON.stringify({
                 razorpay_order_id: response.razorpay_order_id,
                 razorpay_payment_id: response.razorpay_payment_id,
                 razorpay_signature: response.razorpay_signature,
                 coins_to_add: pkg.coins
              })
           });
           
           if (verifyRes.ok) {
              setBalance((prev) => (prev || 0) + pkg.coins);
              success("Transaction verified and credits locked into vault.");
           } else {
              const e = await verifyRes.json();
              error(`Mathematical signature breach: ${e.error}`);
           }
        },
        theme: { color: "#6366f1" }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        error("Payment failed: " + response.error.description);
      });
      rzp.open();
      
    } catch (err: any) {
      error("Checkout sequence aborted: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || balance === null) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-gray-950">
         <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="mx-auto max-w-5xl px-6 py-20">
        
        <div className="mb-16 text-center">
           <h1 className="mb-4 text-4xl font-black md:text-5xl">Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Treasury</span></h1>
           <p className="text-gray-400">Unlock restricted vault items by provisioning digital tokens directly into your wallet.</p>
        </div>

        <div className="mb-16 flex items-center justify-center">
           <div className="inline-flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900/80 p-6 px-10 shadow-2xl backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20 text-2xl shadow-[0_0_25px_rgba(234,179,8,0.3)]">
                 🪙
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Current Balance</span>
                 <span className="text-3xl font-black text-white">{balance.toLocaleString()} Coins</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg) => (
             <div key={pkg.id} className="group relative flex flex-col rounded-3xl border border-gray-800 bg-gray-900 p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:border-gray-700 hover:shadow-2xl">
                <div className={`absolute inset-x-0 -top-px mx-auto h-1 w-24 rounded-b-full bg-gradient-to-r ${pkg.color}`}></div>
                
                <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-gray-500">{pkg.tag}</h3>
                <div className="mb-6 mt-4 flex items-center justify-center gap-2">
                   <span className="text-4xl font-black text-white">{pkg.coins}</span>
                   <span className="text-xl text-yellow-500 font-bold">🪙</span>
                </div>
                
                <div className="mb-8 flex-1">
                   <p className="text-5xl font-black tracking-tighter">
                     <span className="text-3xl text-gray-500 font-medium align-top">₹</span>
                     <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">{pkg.price}</span>
                   </p>
                </div>
                
                <button 
                  onClick={() => handlePurchase(pkg)}
                  disabled={isProcessing}
                  className={`w-full rounded-xl bg-gradient-to-r ${pkg.color} py-4 font-bold text-white shadow-lg transition opacity-90 hover:opacity-100 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:opacity-50 disabled:grayscale`}
                >
                  Acquire Tokens
                </button>
             </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
