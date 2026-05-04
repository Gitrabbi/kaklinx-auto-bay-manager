'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function normalizeGhanaPhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');

  if (cleaned.startsWith('+')) return cleaned;

  if (cleaned.startsWith('0')) {
    return `+233${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('233')) {
    return `+${cleaned}`;
  }

  return cleaned;
}

export default function LoginPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setErrorMsg('');

    const value = loginId.trim();
    const isEmail = value.includes('@');

    const { error } = isEmail
      ? await supabase.auth.signInWithPassword({
          email: value,
          password,
        })
      : await supabase.auth.signInWithPassword({
          phone: normalizeGhanaPhone(value),
          password,
        });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    router.replace('/home');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-44 h-24 rounded-2xl bg-white flex items-center justify-center overflow-hidden border shadow-sm">
            <img
              src="/kaklinx-logo.jpg"
              alt="Kaklinx Auto"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold mt-5 text-slate-900">
            KaklinxAuto Washing Bay
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Sign in with email or phone number
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email or Telephone Number
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="admin@email.com or 0241234567"
            />
            <p className="text-xs text-slate-400 mt-1">
              Phone numbers may be entered as 024..., 233..., or +233...
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
