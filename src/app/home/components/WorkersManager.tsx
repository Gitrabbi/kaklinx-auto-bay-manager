'use client';
import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAppData, Worker, WorkerStatus } from '../../../context/AppDataContext';
import { supabase } from '@/lib/supabaseClient';

interface FormState {
  name: string;
  phone: string;
  role: string;
  status: WorkerStatus;
  commissionRate: string;
  joinDate: string;
}

interface WorkerPerformance {
  workerId: string;
  workerName: string;
  jobsCompleted: number;
  averageCompletionMinutes: number;
  averageRating: number;
  speedScore: number;
  qualityScore: number;
  levelName: string;
  badgeName: string;
  extraCommissionRate: number;
}

const emptyForm: FormState = {
  name: '', phone: '', role: 'Car Washer', status: 'active', commissionRate: '15', joinDate: new Date().toISOString().split('T')[0],
};

const statusColors: Record<WorkerStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'hsla(160,60%,40%,0.1)', text: 'hsl(160 60% 35%)', label: 'Active' },
  break: { bg: 'hsla(38,92%,50%,0.1)', text: 'hsl(38 92% 40%)', label: 'On Break' },
  offline: { bg: 'hsla(215,10%,48%,0.1)', text: 'hsl(215 10% 48%)', label: 'Offline' },
};

function dbToWorkerPerformance(row: any): WorkerPerformance {
  return {
    workerId: row.worker_id,
    workerName: row.worker_name || '',
    jobsCompleted: Number(row.jobs_completed || 0),
    averageCompletionMinutes: Number(row.average_completion_minutes || 0),
    averageRating: Number(row.average_rating || 0),
    speedScore: Number(row.speed_score || 0),
    qualityScore: Number(row.quality_score || 0),
    levelName: row.level_name || 'Starter',
    badgeName: row.badge_name || 'New Worker',
    extraCommissionRate: Number(row.extra_commission_rate || 0),
  };
}

function getLevelStyle(levelName: string) {
  switch (levelName) {
    case 'Elite':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Gold':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Silver':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Bronze':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
}

export default function WorkersManager() {
  const { workers, addWorker, updateWorker, deleteWorker } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [performance, setPerformance] = useState<Record<string, WorkerPerformance>>({});

  useEffect(() => {
    async function loadPerformance() {
      const { data, error } = await supabase
        .from('worker_performance')
        .select('*');

      if (error) {
        console.error('Worker performance load error:', error.message);
        return;
      }

      const mapped: Record<string, WorkerPerformance> = {};
      (data || []).forEach((row) => {
        const item = dbToWorkerPerformance(row);
        mapped[item.workerId] = item;
      });

      setPerformance(mapped);
    }

    loadPerformance();
  }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (w: Worker) => {
    setForm({ name: w.name, phone: w.phone, role: w.role, status: w.status, commissionRate: w.commissionRate.toString(), joinDate: w.joinDate });
    setEditId(w.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      role: form.role,
      status: form.status,
      commissionRate: parseFloat(form.commissionRate) || 15,
      joinDate: form.joinDate,
    };
    if (editId) {
      updateWorker(editId, payload);
    } else {
      addWorker(payload);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.phone.includes(search) ||
    w.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 sm:w-64">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(215 10% 48%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search workers..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none focus:ring-2"
            style={{ borderColor: 'hsl(210 18% 89%)' }}
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0"
          style={{ backgroundColor: 'hsl(205 78% 42%)' }}
        >
          <PlusIcon className="w-4 h-4" />
          Add Worker
        </button>
      </div>

      {/* Workers Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: 'hsl(210 18% 89%)' }}>
          <UsersIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(215 10% 70%)' }} />
          <p className="text-sm font-medium" style={{ color: 'hsl(215 25% 12%)' }}>No workers found</p>
          <p className="text-xs mt-1" style={{ color: 'hsl(215 10% 48%)' }}>Click &quot;Add Worker&quot; to register your first worker</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(w => {
            const sc = statusColors[w.status];
            return (
              <div key={w.id} className="bg-white rounded-xl border p-4 card-hover" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'hsla(25,95%,53%,0.15)', color: 'hsl(25 95% 53%)' }}>
                    {w.initials}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: sc.bg, color: sc.text }}>
                    {sc.label}
                  </span>
                </div>
                <p className="font-semibold text-sm mb-0.5" style={{ color: 'hsl(215 25% 12%)' }}>{w.name}</p>
                <p className="text-xs mb-0.5" style={{ color: 'hsl(215 10% 48%)' }}>{w.role}</p>
                <p className="text-xs mb-3" style={{ color: 'hsl(215 10% 48%)' }}>{w.phone}</p>

                {performance[w.id] ? (
                  <div className="rounded-lg border p-3 mb-3 bg-slate-50" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full border text-[11px] font-bold ${getLevelStyle(performance[w.id].levelName)}`}>
                        {performance[w.id].levelName}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                        {performance[w.id].badgeName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p style={{ color: 'hsl(215 10% 48%)' }}>Avg Rating</p>
                        <p className="font-bold" style={{ color: 'hsl(215 25% 12%)' }}>
                          {performance[w.id].averageRating.toFixed(1)} / 5
                        </p>
                      </div>
                      <div>
                        <p style={{ color: 'hsl(215 10% 48%)' }}>Speed Score</p>
                        <p className="font-bold" style={{ color: 'hsl(215 25% 12%)' }}>
                          {performance[w.id].speedScore.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p style={{ color: 'hsl(215 10% 48%)' }}>Quality Score</p>
                        <p className="font-bold" style={{ color: 'hsl(215 25% 12%)' }}>
                          {performance[w.id].qualityScore.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p style={{ color: 'hsl(215 10% 48%)' }}>Extra Comm.</p>
                        <p className="font-bold text-emerald-700">
                          +{performance[w.id].extraCommissionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border p-3 mb-3 bg-slate-50" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-1 rounded-full border text-[11px] font-bold bg-blue-100 text-blue-800 border-blue-200">
                        Starter
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-1 rounded-full border">
                        New Worker
                      </span>
                    </div>
                    <p className="text-[11px] mt-2" style={{ color: 'hsl(215 10% 48%)' }}>
                      No certified jobs yet.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs mb-3">
                  <span style={{ color: 'hsl(215 10% 48%)' }}>Commission</span>
                  <span className="font-semibold" style={{ color: 'hsl(205 78% 42%)' }}>{w.commissionRate}%</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-4">
                  <span style={{ color: 'hsl(215 10% 48%)' }}>Jobs Today</span>
                  <span className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>{w.jobsToday}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(w)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-blue-50"
                    style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(205 78% 42%)' }}>
                    <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setConfirmDelete(w.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-red-50"
                    style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(0 72% 51%)' }}>
                    <TrashIcon className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(210 18% 89%)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'hsl(215 25% 12%)' }}>{editId ? 'Edit Worker' : 'Add Worker'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5" style={{ color: 'hsl(215 10% 48%)' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Full Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Kofi Boateng"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Phone Number</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. 0551234567"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Role</label>
                  <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    placeholder="Car Washer"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Commission %</label>
                  <input type="number" min="0" max="100" value={form.commissionRate}
                    onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as WorkerStatus }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                    <option value="active">Active</option>
                    <option value="break">On Break</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Join Date</label>
                  <input type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50"
                  style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'hsl(205 78% 42%)' }}>{editId ? 'Save Changes' : 'Add Worker'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <TrashIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1" style={{ color: 'hsl(215 25% 12%)' }}>Remove Worker?</h3>
            <p className="text-sm mb-5" style={{ color: 'hsl(215 10% 48%)' }}>This will permanently remove this worker.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>Cancel</button>
              <button onClick={() => { deleteWorker(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
