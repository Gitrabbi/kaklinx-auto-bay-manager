'use client';

import React, { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAppData } from '@/context/AppDataContext';

export default function AdminUsersPage() {
  const { workers } = useAppData();

  const [role, setRole] = useState<'admin' | 'cashier' | 'worker'>('worker');
  const [workerId, setWorkerId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedWorker = workers.find((w: any) => w.id === workerId);

  useEffect(() => {
    if (selectedWorker?.phone) {
      setPhone(selectedWorker.phone);
    } else {
      setPhone('');
    }
  }, [selectedWorker]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedWorker) {
      setErrorMsg('Please select an existing staff member.');
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Telephone number is required.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: selectedWorker.name,
        email: email.trim() || null,
        phone,
        password,
        role,
        workerId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || 'Failed to create user.');
      setLoading(false);
      return;
    }

    setSuccessMsg('User login created successfully.');
    setEmail('');
    setPassword('');
    setRole('worker');
    setWorkerId('');
    setPhone('');
    setLoading(false);
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Create Staff Login
          </h1>

          <p className="text-slate-500 mt-1">
            Select an existing staff member and create login access using their
            registered telephone number.
          </p>

          <form onSubmit={handleCreateUser} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Access Role
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'admin' | 'cashier' | 'worker')
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
              >
                <option value="admin">Admin</option>
                <option value="cashier">Cashier</option>
                <option value="worker">Worker</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Existing Staff
              </label>
              <select
                required
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
              >
                <option value="">Select staff member</option>
                {workers.map((worker: any) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} {worker.phone ? `— ${worker.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedWorker && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-sm text-slate-500">Selected Staff</p>
                <p className="font-bold text-slate-900">
                  {selectedWorker.name}
                </p>
                <p className="text-sm text-blue-700 font-semibold mt-1">
                  Registered Phone: {selectedWorker.phone || 'No phone saved'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telephone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                placeholder="0241234567"
              />
              <p className="text-xs text-slate-400 mt-1">
                This will be used for login. Ghana numbers are automatically
                converted to +233 format.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address Optional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                placeholder="Optional email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unique Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                placeholder="Minimum 6 characters"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition"
            >
              {loading ? 'Creating login...' : 'Create Staff Login'}
            </button>
          </form>
        </div>
      </main>
    </AuthGuard>
  );
}
