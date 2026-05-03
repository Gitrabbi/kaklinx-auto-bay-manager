'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { UserProfile, UserRole } from '@/lib/authTypes';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single<UserProfile>();

      if (error || !profile) {
        router.replace('/unauthorized');
        return;
      }

      if (allowedRoles && !allowedRoles.includes(profile.role)) {
        router.replace('/unauthorized');
        return;
      }

      setAllowed(true);
      setLoading(false);
    }

    checkAccess();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="font-semibold text-slate-700">Checking access...</p>
        </div>
      </div>
    );
  }

  return allowed ? <>{children}</> : null;
}
