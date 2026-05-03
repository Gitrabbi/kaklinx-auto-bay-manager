'use client';

import React, { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';

export default function AdminUsersPage() {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier' | 'worker'>('worker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || 'Failed to create user.');
      setLoading(false);
      return;
    }

    setSuccessMsg('User created successfully.');

    setFullName('');
    setEmail('');
    setPassword('');
    setRole('worker');
    setLoading(false);
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow border p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Create Staff User
          </h1>

          <p className="text-slate-500 mt-1">
            Only admin can create users for KaklinxAuto Washing Bay.
          </p>

          <form onSubmit={handleCreateUser} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Enter staff full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'admin' | 'cashier' | 'worker')
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="admin">Admin</option>
                <option value="cashier">Cashier</option>
                <option value="worker">Worker</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Enter staff email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Temporary Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Minimum 6 characters"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Creating user...' : 'Create User'}
            </button>
          </form>
        </div>
      </main>
    </AuthGuard>
  );
}
