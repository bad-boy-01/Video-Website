'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function SubscribePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/payment/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });
      const data = await res.json();
      if (res.ok) {
        // Redirect to Stripe/Razorpay checkout URL securely returned from backend
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-4xl font-black mb-4">Subscribe to VaultStream Premium</h1>
      <p className="text-gray-400 mb-8 max-w-md text-center">Unlock exclusive and restricted vault contents today.</p>
      <button onClick={handleSubscribe} disabled={loading || !user} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition">
        {loading ? 'Processing...' : 'Subscribe Now'}
      </button>
    </div>
  );
}