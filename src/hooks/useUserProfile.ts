'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { UserProfile } from '@/lib/authTypes';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (userError) setError(`Auth error: ${userError.message}`);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, worker_id, phone')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile load error:', error.message);
        setError(`Profile load error: ${error.message}`);
        setProfile(null);
      } else {
        setError(null);
        setProfile(data);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  return { profile, loading, error };
}
