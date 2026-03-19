'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const token = await user.getIdToken();
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName })
      });
      alert('Vault profile optimized successfully.');
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-black mb-8">Account Settings</h1>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-bold tracking-wider text-gray-400 uppercase">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-4 bg-gray-950 rounded-xl border border-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder={user?.displayName || 'Enter a new alias'} />
          </div>
          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition-all w-full md:w-auto">{saving ? 'Synchronizing...' : 'Save Configuration'}</button>
        </form>
      </div>
    </div>
  );
}