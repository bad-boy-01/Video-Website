'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { User, Bell, Lock, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) setDisplayName(user.displayName || '');
    if (userData) {
      setBio(userData.bio || '');
      if (userData.emailNotifications !== undefined) {
        setEmailNotifications(userData.emailNotifications);
      }
    }
  }, [user, userData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName, bio, emailNotifications })
      });

      if (res.ok) {
        setMessage({ text: 'Settings updated successfully.', type: 'success' });
      } else {
        setMessage({ text: 'Failed to update settings.', type: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      alert('Failed to send password reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your profile, preferences, and security.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl font-medium ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Settings Form */}
          <div className="md:col-span-2 space-y-8">
            {/* Profile Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><User className="text-indigo-500" /> Public Profile</h2>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-bold tracking-wider text-gray-400 uppercase">Email Address</label>
                  <input type="email" disabled value={user?.email || ''} className="w-full p-4 bg-gray-950 rounded-xl border border-gray-800 text-gray-500 cursor-not-allowed outline-none" />
                  <p className="text-xs text-gray-500 mt-2">Your email address is used for login and cannot be changed here.</p>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-bold tracking-wider text-gray-400 uppercase">Display Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-4 bg-gray-950 rounded-xl border border-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="Enter a new alias" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-bold tracking-wider text-gray-400 uppercase">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-4 bg-gray-950 rounded-xl border border-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-32" placeholder="Tell us a little about yourself..." />
                </div>

                <hr className="border-gray-800 my-8" />

                {/* Preferences Section */}
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><Bell className="text-indigo-500" /> Preferences</h2>
                <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
                  <div>
                    <h3 className="font-bold text-gray-200">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive updates about new content and promotions.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-8 py-4 rounded-xl font-bold transition-all w-full mt-6">
                  {saving ? 'Saving Changes...' : 'Save All Settings'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar / Extra Settings */}
          <div className="space-y-6">
            {/* Security Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3"><Lock className="text-indigo-500" /> Security</h2>
              <p className="text-sm text-gray-400 mb-6">Need to update your password? We will send a secure reset link to your email.</p>
              <button onClick={handlePasswordReset} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all border border-gray-700 hover:border-gray-600">
                Send Reset Link
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-950/20 border border-red-900/50 rounded-3xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-red-500"><AlertTriangle /> Danger Zone</h2>
              <p className="text-sm text-gray-400 mb-6">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button onClick={() => alert('Account deletion is currently disabled for safety.')} className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-500 font-medium py-3 px-4 rounded-xl transition-all border border-red-900/50 hover:border-red-500/50">
                Delete Account
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}