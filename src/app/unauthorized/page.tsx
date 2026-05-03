'use client';

import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Access Denied
        </h1>

        <p className="text-slate-500 mt-3">
          Your account does not have permission to access this area.
        </p>

        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/home"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
          >
            Go Home
          </Link>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
