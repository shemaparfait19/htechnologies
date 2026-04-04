"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Key } from 'lucide-react';

export default function AdminSettingsPage() {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      toast({ title: 'Mismatch', description: 'New PIN and Confirm PIN do not match.', variant: 'destructive' });
      return;
    }
    if (newPin.length !== 5 || oldPin.length !== 5) {
      toast({ title: 'Invalid Length', description: 'PIN must be exactly 5 digits.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPin, newPin }),
      });

      if (res.ok) {
        toast({ title: 'PIN Updated', description: 'Your executive PIN has been successfully changed.', variant: 'default' });
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        const data = await res.json();
        toast({ title: 'Update Failed', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update PIN', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center gap-3">
          <div className="h-10 w-10 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Security Settings</h2>
            <p className="text-sm text-slate-400">Manage your executive PIN access</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Current PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                placeholder="•••••"
                required
              />
            </div>

            <div className="h-px w-full bg-slate-800/50 my-6"></div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                placeholder="•••••"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Must be exactly 5 digits.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                placeholder="•••••"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || newPin.length !== 5 || oldPin.length !== 5}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center shadow-lg shadow-rose-900/20"
            >
              {loading ? 'Updating...' : 'Save New PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
