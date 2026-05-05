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

      {/* User Welcome (now visible on ALL screens) */}
      <div className="text-right mr-3 max-w-[150px] sm:max-w-none">
        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
          {loading
            ? 'Loading...'
            : `Welcome, ${profile?.full_name?.split(' ')[0] || 'User'}`}
        </p>

        <p className="text-[10px] sm:text-xs text-slate-500 capitalize truncate">
          {loading ? '' : profile?.role || 'staff'}
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="px-3 sm:px-4 py-2 rounded-lg bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-700 transition"
      >
        Logout
      </button>
    </header>
  );
}
