'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useUserProfile } from '@/hooks/useUserProfile';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export default function TopHeader({ onMenuClick }: TopHeaderProps) {
  const router = useRouter();
  const { profile, loading } = useUserProfile();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <header
      className="h-16 border-b flex items-center px-4 lg:px-6 shrink-0"
      style={{ backgroundColor: '#ffffff', borderColor: 'hsl(210 18% 89%)' }}
    >
      {/* Mobile Menu Button */}
      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 w-9 lg:hidden mr-2 hover:bg-gray-100"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Info */}
      <div className="hidden sm:block text-right mr-4">
        <p className="text-sm font-semibold text-slate-900">
          {loading
            ? 'Loading...'
            : `Welcome, ${profile?.full_name?.split(' ')[0] || 'User'}`}
        </p>

        <p className="text-xs text-slate-500 capitalize">
          {loading ? '' : profile?.role || 'staff'}
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition"
      >
        Logout
      </button>
    </header>
  );
}
