'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateDistanceMeters, getCurrentLocation } from '@/lib/locationUtils';

export default function WorkerClockPage() {
  const { profile, loading: profileLoading } = useUserProfile();

  const [worksite, setWorksite] = useState<any>(null);
  const [activeLog, setActiveLog] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [clockOutReason, setClockOutReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isWorker = profile?.role === 'worker';
  const staffName = profile?.full_name || 'Staff';
  const staffRole = profile?.role || 'staff';

  useEffect(() => {
    if (profile?.id) {
      loadInitialData();
    }
  }, [profile?.id, profile?.worker_id]);

  async function loadInitialData() {
    if (!profile?.id) return;

    setLoading(true);
    setErrorMsg('');
    setMessage('');

    const { data: siteData, error: siteError } = await supabase
      .from('worksite_settings')
      .select('*')
      .limit(1)
      .single();

    if (siteError) {
      setErrorMsg(siteError.message);
      setLoading(false);
      return;
    }

    setWorksite(siteData);

    let query = supabase
      .from('attendance_logs')
      .select('*')
      .eq('status', 'clocked_in')
      .order('created_at', { ascending: false })
      .limit(1);

    if (isWorker && profile.worker_id) {
      query = query.eq('worker_id', profile.worker_id);
    } else {
      query = query.eq('staff_user_id', profile.id);
    }

    const { data: logData } = await query.maybeSingle();

    setActiveLog(logData || null);
    setLoading(false);
  }

  async function checkLocation() {
    if (!worksite) {
      setErrorMsg('Worksite settings not found.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const current = await getCurrentLocation();

      const calculatedDistance = calculateDistanceMeters(
        current.latitude,
        current.longitude,
        Number(worksite.latitude),
        Number(worksite.longitude)
      );

      setDistance(calculatedDistance);

      const withinRadius =
        calculatedDistance <= Number(worksite.allowed_radius_meters || 100);

      setLocationAllowed(withinRadius);

      if (withinRadius) {
        setMessage('Location verified. You are within the worksite area.');
      } else {
        setErrorMsg(
          `You are ${Math.round(calculatedDistance)} meters away from the worksite. Clock-in is only allowed within ${worksite.allowed_radius_meters} meters.`
        );
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Unable to access your location.');
    }

    setLoading(false);
  }

  async function clockIn() {
    if (!profile?.id) {
      setErrorMsg('Your login profile could not be found.');
      return;
    }

    if (isWorker && !profile.worker_id) {
      setErrorMsg('Your profile is not linked to a worker record. Please contact admin.');
      return;
    }

    if (!worksite) {
      setErrorMsg('Worksite settings not found.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const current = await getCurrentLocation();

      const calculatedDistance = calculateDistanceMeters(
        current.latitude,
        current.longitude,
        Number(worksite.latitude),
        Number(worksite.longitude)
      );

      const withinRadius =
        calculatedDistance <= Number(worksite.allowed_radius_meters || 100);

      if (!withinRadius) {
        setDistance(calculatedDistance);
        setLocationAllowed(false);
        setErrorMsg(
          `Clock-in denied. You are ${Math.round(calculatedDistance)} meters away from the worksite.`
        );
        setLoading(false);
        return;
      }

      const payload = isWorker
        ? {
            worker_id: profile.worker_id,
            user_id: profile.id,
            staff_user_id: profile.id,
            staff_name: staffName,
            staff_role: staffRole,
            clock_in_time: new Date().toISOString(),
            clock_in_lat: current.latitude,
            clock_in_lng: current.longitude,
            clock_in_method: 'self',
            status: 'clocked_in',
          }
        : {
            worker_id: null,
            user_id: profile.id,
            staff_user_id: profile.id,
            staff_name: staffName,
            staff_role: staffRole,
            clock_in_time: new Date().toISOString(),
            clock_in_lat: current.latitude,
            clock_in_lng: current.longitude,
            clock_in_method: 'self',
            status: 'clocked_in',
          };

      const { data, error } = await supabase
        .from('attendance_logs')
        .insert(payload)
        .select()
        .single();

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setActiveLog(data);
      setDistance(calculatedDistance);
      setLocationAllowed(true);
      setMessage('Clock-in successful.');
    } catch (error: any) {
      setErrorMsg(error.message || 'Unable to access your location.');
    }

    setLoading(false);
  }

  async function clockOut() {
    if (!activeLog) {
      setErrorMsg('No active clock-in record found.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const current = await getCurrentLocation();

      const { error } = await supabase
        .from('attendance_logs')
        .update({
          clock_out_time: new Date().toISOString(),
          clock_out_lat: current.latitude,
          clock_out_lng: current.longitude,
          clock_out_method: 'self',
          clock_out_reason: clockOutReason || null,
          status: 'clocked_out',
        })
        .eq('id', activeLog.id);

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setActiveLog(null);
      setClockOutReason('');
      setMessage('Clock-out successful.');
    } catch (error: any) {
      setErrorMsg(error.message || 'Unable to access your location.');
    }

    setLoading(false);
  }

  if (profileLoading) {
    return (
      <div className="bg-white rounded-3xl border shadow p-6">
        Loading your attendance page...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border shadow p-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Clock In / Clock Out
        </h2>

        <p className="text-slate-500 text-sm mt-1">
          Welcome, {staffName}. You can clock in only when you are within the approved worksite area.
        </p>

        {worksite && (
          <div className="mt-5 grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border rounded-2xl p-4">
              <p className="text-xs text-slate-500">Worksite</p>
              <p className="font-bold text-slate-900">{worksite.site_name}</p>
            </div>

            <div className="bg-slate-50 border rounded-2xl p-4">
              <p className="text-xs text-slate-500">Allowed Radius</p>
              <p className="font-bold text-slate-900">
                {worksite.allowed_radius_meters} meters
              </p>
            </div>

            <div className="bg-slate-50 border rounded-2xl p-4">
              <p className="text-xs text-slate-500">Current Status</p>
              <p className="font-bold text-slate-900">
                {activeLog ? 'Clocked In' : 'Not Clocked In'}
              </p>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-sm">
          {message}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-3xl border shadow p-6">
        <h3 className="font-bold text-slate-900">Location Verification</h3>

        <p className="text-sm text-slate-500 mt-1">
          Check your current distance from the worksite before clocking in.
        </p>

        <button
          onClick={checkLocation}
          disabled={loading}
          className="mt-4 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold px-5 py-3 rounded-xl"
        >
          {loading ? 'Checking...' : 'Check My Location'}
        </button>

        {distance !== null && (
          <div className="mt-4 bg-slate-50 border rounded-2xl p-4">
            <p className="text-sm text-slate-500">Distance from worksite</p>
            <p
              className={`text-2xl font-extrabold mt-1 ${
                locationAllowed ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {Math.round(distance)} meters
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border shadow p-6">
        {!activeLog ? (
          <>
            <h3 className="font-bold text-slate-900">Clock In</h3>

            <p className="text-sm text-slate-500 mt-1">
              Click below to clock in. Your location will be checked again before the clock-in is accepted.
            </p>

            <button
              onClick={clockIn}
              disabled={loading}
              className="mt-4 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-bold px-5 py-3 rounded-xl"
            >
              {loading ? 'Processing...' : 'Clock In'}
            </button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-slate-900">Clock Out</h3>

            <p className="text-sm text-slate-500 mt-1">
              You are currently clocked in.
            </p>

            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
              Clocked in at:{' '}
              <strong>
                {new Date(activeLog.clock_in_time).toLocaleString()}
              </strong>
            </div>

            <textarea
              value={clockOutReason}
              onChange={(e) => setClockOutReason(e.target.value)}
              placeholder="Reason for clocking out early or any note optional"
              className="mt-4 w-full border rounded-xl px-4 py-3 min-h-24"
            />

            <button
              onClick={clockOut}
              disabled={loading}
              className="mt-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold px-5 py-3 rounded-xl"
            >
              {loading ? 'Processing...' : 'Clock Out'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
