'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function WalletPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch('/api/user/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
      setLoading(false);
    };
    fetchTransactions();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">Loading vault history...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Digital Wallet & Ledger</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-6 text-gray-300 uppercase tracking-wider text-sm">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions located in the vault ledger.</p>
          ) : (
            <ul className="space-y-4">
              {transactions.map((tx: any) => (
                <li key={tx.id} className="flex items-center justify-between border-b border-gray-800 pb-4 last:border-0"><span className="text-gray-300">{tx.description}</span><span className={`font-bold ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount} Coins</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}