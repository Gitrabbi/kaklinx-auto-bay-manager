'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useAppData } from '../../../context/AppDataContext';
import { useUserProfile } from '@/hooks/useUserProfile';

const today = new Date().toISOString().split('T')[0];

export default function AttendanceManager() {
  const { workers } = useAppData();
  const { profile } = useUserProfile();

  const [logs, setLogs] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [clockOutReason, setClockOutReason] = useState('');
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(today);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadAttendanceLogs();

    const channel = supabase
      .channel('admin-attendance-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_logs',
        },
        () => {
          loadAttendanceLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadAttendanceLogs() {
    setLoading(true);

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLogs(data || []);
    setLoading(false);
  }

  function getWorkerName(workerId?: string) {
    if (!workerId) return '';
    return workers.find((w: any) => w.id === workerId)?.name || 'Unknown Worker';
  }

  function getWorkerPhone(workerId?: string) {
    if (!workerId) return '';
    return workers.find((w: any) => w.id === workerId)?.phone || '';
  }

  function getDisplayName(log: any) {
    return log.worker_id
      ? getWorkerName(log.worker_id)
      : log.staff_name || 'Staff Member';
  }

  function getDisplayRole(log: any) {
    return log.worker_id ? 'worker' : log.staff_role || 'staff';
  }

  function getDisplayPhone(log: any) {
    return log.worker_id ? getWorkerPhone(log.worker_id) : '';
  }

  function formatTime(value?: string) {
    if (!value) return '—';
    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDate(value?: string) {
    if (!value) return '—';
    return new Date(value).toISOString().split('T')[0];
  }

  function calculateHours(clockIn?: string, clockOut?: string) {
    if (!clockIn || !clockOut) return null;

    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();

    if (end <= start) return null;

    return (end - start) / (1000 * 60 * 60);
  }

  const activeLogs = useMemo(() => {
    return logs.filter((log) => log.status === 'clocked_in');
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const name = getDisplayName(log).toLowerCase();
      const role = getDisplayRole(log).toLowerCase();
      const matchSearch =
        name.includes(search.toLowerCase()) ||
        role.includes(search.toLowerCase());

      const logDate = formatDate(log.clock_in_time || log.created_at);
      const matchDate = !filterDate || logDate === filterDate;

      return matchSearch && matchDate;
    });
  }, [logs, workers, search, filterDate]);

  const clockedInCount = filteredLogs.filter(
    (log) => log.status === 'clocked_in'
  ).length;

  const clockedOutCount = filteredLogs.filter(
    (log) => log.status === 'clocked_out'
  ).length;

  const selfClockInCount = filteredLogs.filter(
    (log) => log.clock_in_method === 'self'
  ).length;

  const supervisorClockInCount = filteredLogs.filter(
    (log) => log.clock_in_method === 'supervisor'
  ).length;

  async function supervisorClockIn() {
    setMessage('');
    setErrorMsg('');

    if (!selectedWorkerId) {
      setErrorMsg('Please select a worker to clock in.');
      return;
    }

    const existingActive = activeLogs.find(
      (log) => log.worker_id === selectedWorkerId
    );

    if (existingActive) {
      setErrorMsg(`${getWorkerName(selectedWorkerId)} is already clocked in.`);
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('attendance_logs').insert({
      worker_id: selectedWorkerId,
      user_id: null,
      staff_user_id: null,
      staff_name: getWorkerName(selectedWorkerId),
      staff_role: 'worker',
      clock_in_time: new Date().toISOString(),
      clock_in_method: 'supervisor',
      clocked_in_by: profile?.id || null,
      status: 'clocked_in',
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setMessage(`${getWorkerName(selectedWorkerId)} clocked in successfully.`);
    setSelectedWorkerId('');
    await loadAttendanceLogs();
    setLoading(false);
  }

  async function supervisorClockOut(logId: string, displayName: string) {
    setMessage('');
    setErrorMsg('');
    setLoading(true);

    const { error } = await supabase
      .from('attendance_logs')
      .update({
        clock_out_time: new Date().toISOString(),
        clock_out_method: 'supervisor',
        clocked_out_by: profile?.id || null,
        clock_out_reason: clockOutReason || null,
        status: 'clocked_out',
      })
      .eq('id', logId);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setMessage(`${displayName} clocked out successfully.`);
    setClockOutReason('');
    await loadAttendanceLogs();
    setLoading(false);
  }

  function getStatusBadge(log: any) {
    if (log.status === 'clocked_in') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
          Clocked In
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        Clocked Out
      </span>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Clocked In', value: clockedInCount, color: 'text-green-700' },
          { label: 'Clocked Out', value: clockedOutCount, color: 'text-slate-700' },
          { label: 'Self Clock-In', value: selfClockInCount, color: 'text-blue-700' },
          { label: 'Supervisor Clock-In', value: supervisorClockInCount, color: 'text-purple-700' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border p-4">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
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

      <div className="bg-white rounded-3xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserPlusIcon className="w-5 h-5 text-blue-700" />
          <h2 className="text-lg font-bold text-slate-900">
            Supervisor Clock-In for Workers
          </h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Use this for workers without smartphones or workers who cannot access location on their device.
        </p>

        <div className="grid md:grid-cols-[1fr_auto] gap-3">
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="border rounded-xl px-4 py-3 text-sm"
          >
            <option value="">Select worker...</option>
            {workers.map((worker: any) => (
              <option key={worker.id} value={worker.id}>
                {worker.name} {worker.phone ? `— ${worker.phone}` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={supervisorClockIn}
            disabled={loading}
            className="bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-bold rounded-xl px-5 py-3 text-sm"
          >
            {loading ? 'Processing...' : 'Clock In Worker'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border p-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Attendance Logs
            </h2>
            <p className="text-sm text-slate-500">
              Live records from worker, admin, cashier, self clock-in, and supervisor clock-in.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or role..."
                className="pl-9 pr-3 py-2 text-sm rounded-xl border outline-none w-48"
              />
            </div>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border outline-none"
            />

            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs px-3 py-2 rounded-xl border text-slate-500"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading attendance records...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-900">
                No attendance records found
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Staff clock-ins will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    {[
                      'Name',
                      'Role',
                      'Date',
                      'Clock In',
                      'Clock Out',
                      'Hours',
                      'Method',
                      'Status',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredLogs.map((log) => {
                    const hours = calculateHours(log.clock_in_time, log.clock_out_time);
                    const displayName = getDisplayName(log);

                    return (
                      <tr key={log.id} className="hover:bg-blue-50/50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{displayName}</p>
                          <p className="text-xs text-slate-500">{getDisplayPhone(log)}</p>
                        </td>

                        <td className="px-4 py-3 text-xs capitalize text-slate-600">
                          {getDisplayRole(log)}
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600">
                          {formatDate(log.clock_in_time || log.created_at)}
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600">
                          {formatTime(log.clock_in_time)}
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600">
                          {formatTime(log.clock_out_time)}
                        </td>

                        <td className="px-4 py-3 text-xs font-bold text-slate-900">
                          {hours ? `${hours.toFixed(1)}h` : '—'}
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                            {log.clock_in_method || 'self'}
                          </span>
                        </td>

                        <td className="px-4 py-3">{getStatusBadge(log)}</td>

                        <td className="px-4 py-3">
                          {log.status === 'clocked_in' ? (
                            <button
                              onClick={() => supervisorClockOut(log.id, displayName)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold px-3 py-2 rounded-xl"
                            >
                              <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                              Clock Out
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {activeLogs.length > 0 && (
          <div className="mt-5 bg-slate-50 border rounded-2xl p-4">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Clock-out reason / note
            </label>
            <textarea
              value={clockOutReason}
              onChange={(e) => setClockOutReason(e.target.value)}
              placeholder="Optional reason for early clock-out or supervisor note"
              className="w-full border rounded-xl px-4 py-3 min-h-20 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
