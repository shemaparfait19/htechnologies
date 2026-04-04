"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPinPage() {
  const [pin, setPin] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newPin = [...pin];
    // Keep only the last character entered
    newPin[index] = value.slice(-1);
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 4) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pin.join('');
    if (fullPin.length !== 5) {
      toast({ title: 'Invalid PIN', description: 'Please enter a 5-digit PIN.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      });

      if (res.ok) {
        toast({ title: 'Access Granted', description: 'Welcome to the Executive Dashboard.', variant: 'default' });
        router.push('/admin-dashboard');
      } else {
        const data = await res.json();
        toast({ title: 'Access Denied', description: data.error, variant: 'destructive' });
        setPin(['', '', '', '', '']);
        document.getElementById('pin-0')?.focus();
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to verify PIN.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Aesthetic glowing background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <ShieldAlert className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Executive Access</h1>
            <p className="text-slate-400 text-sm mt-1 text-center">
              Restricted area. Managing Director only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center gap-3">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-16 text-center text-3xl font-bold bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
                  autoFocus={index === 0}
                  disabled={loading}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || pin.join('').length !== 5}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <span className="animate-pulse">Verifying Identity...</span>
              ) : (
                <>
                  Enter Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
          <Lock className="h-3 w-3" />
          SECURE ENCLAVE ACTIVE
        </div>
      </div>
    </div>
  );
}
