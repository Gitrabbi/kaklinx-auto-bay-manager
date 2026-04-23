'use client';
import React, { useState } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, CurrencyDollarIcon, TrophyIcon,  } from '@heroicons/react/24/outline';
import { useAppData, CommissionRecord } from '../../../context/AppDataContext';

interface FormState {
  workerId: string;
  date: string;
  jobsCompleted: string;
  rate: string;
}

const today = new Date().toISOString().split('T')[0];

const emptyForm: FormState = { workerId: '', date: today, jobsCompleted: '', rate: '15' };

export default function CommissionsManager() {
  const { workers, commissions, addCommission, updateCommission, deleteCommission } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm, workerId: workers[0]?.id || '' });
  const [filterDate, setFilterDate] = useState(today);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openCreate = () => {
    const firstWorker = workers[0];
    setForm({ ...emptyForm, workerId: firstWorker?.id || '', rate: firstWorker?.commissionRate?.toString() || '15' });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (c: CommissionRecord) => {
    setForm({ workerId: c.workerId, date: c.date, jobsCompleted: c.jobsCompleted.toString(), rate: c.rate.toString() });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleWorkerChange = (wid: string) => {
    const worker = workers.find(w => w.id === wid);
    setForm(f => ({ ...f, workerId: wid, rate: worker?.commissionRate?.toString() || '15' }));
  };

  const calcEarned = (jobs: number, rate: number) => {
    // Assume average job value of GH₵ 40
    return (jobs * 40 * rate) / 100;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workerId) return;
    const worker = workers.find(w => w.id === form.workerId);
    if (!worker) return;
    const jobs = parseInt(form.jobsCompleted) || 0;
    const rate = parseFloat(form.rate) || 15;
    const payload = {
      workerId: form.workerId,
      workerName: worker.name,
      workerInitials: worker.initials,
      date: form.date,
      jobsCompleted: jobs,
      totalEarned: calcEarned(jobs, rate),
      rate,
    };
    if (editId) {
      updateCommission(editId, payload);
    } else {
      addCommission(payload);
    }
    setShowForm(false);
    setEditId(null);
  };

  const filtered = commissions.filter(c => !filterDate || c.date === filterDate);
  const totalPayout = filtered.reduce((sum, c) => sum + c.totalEarned, 0);
  const topWorker = filtered.reduce<CommissionRecord | null>((top, c) => (!top || c.totalEarned > top.totalEarned) ? c : top, null);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: 'hsl(210 18% 89%)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'hsl(215 10% 48%)' }}>Total Payout</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(205 78% 42%)' }}>GH₵ {totalPayout.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: 'hsl(210 18% 89%)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'hsl(215 10% 48%)' }}>Total Records</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(215 25% 12%)' }}>{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: 'hsl(210 18% 89%)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'hsl(215 10% 48%)' }}>Top Earner</p>
          <p className="text-lg font-bold truncate" style={{ color: 'hsl(215 25% 12%)' }}>{topWorker?.workerName || '—'}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>
              All Dates
            </button>
          )}
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0"
          style={{ backgroundColor: 'hsl(205 78% 42%)' }}>
          <PlusIcon className="w-4 h-4" /> Add Commission
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CurrencyDollarIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(215 10% 70%)' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(215 25% 12%)' }}>No commission records</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(215 10% 48%)' }}>Click &quot;Add Commission&quot; to record worker earnings</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'hsl(210 20% 98%)', borderBottom: '1px solid hsl(210 18% 89%)' }}>
                  {['Worker', 'Date', 'Jobs Done', 'Rate', 'Total Earned', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(215 10% 48%)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="table-row-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ backgroundColor: 'hsla(25,95%,53%,0.15)', color: 'hsl(25 95% 53%)' }}>
                          {c.workerInitials}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'hsl(215 25% 12%)' }}>{c.workerName}</p>
                          {i === 0 && filtered.length > 1 && (
                            <div className="flex items-center gap-1">
                              <TrophyIcon className="w-3 h-3 text-amber-500" />
                              <span className="text-xs text-amber-500">Top Earner</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215 10% 48%)' }}>{c.date}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>{c.jobsCompleted}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215 10% 48%)' }}>{c.rate}%</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: 'hsl(205 78% 42%)' }}>GH₵ {c.totalEarned.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                          <PencilSquareIcon className="w-4 h-4" style={{ color: 'hsl(205 78% 42%)' }} />
                        </button>
                        <button onClick={() => setConfirmDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <TrashIcon className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(210 18% 89%)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'hsl(215 25% 12%)' }}>{editId ? 'Edit Commission' : 'Add Commission'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5" style={{ color: 'hsl(215 10% 48%)' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Worker *</label>
                <select required value={form.workerId} onChange={e => handleWorkerChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                  <option value="">Select worker...</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Date *</label>
                <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Jobs Completed</label>
                  <input required type="number" min="0" value={form.jobsCompleted}
                    onChange={e => setForm(f => ({ ...f, jobsCompleted: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Commission Rate (%)</label>
                  <input required type="number" min="0" max="100" step="0.5" value={form.rate}
                    onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
                </div>
              </div>
              {form.jobsCompleted && form.rate && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsla(205,78%,42%,0.06)' }}>
                  <p className="text-xs" style={{ color: 'hsl(215 10% 48%)' }}>Estimated Earnings</p>
                  <p className="text-lg font-bold" style={{ color: 'hsl(205 78% 42%)' }}>
                    GH₵ {calcEarned(parseInt(form.jobsCompleted) || 0, parseFloat(form.rate) || 0).toFixed(2)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(215 10% 48%)' }}>Based on avg. GH₵ 40/job</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50"
                  style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'hsl(205 78% 42%)' }}>{editId ? 'Save Changes' : 'Add Commission'}</button>
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
            <h3 className="font-bold text-lg mb-1" style={{ color: 'hsl(215 25% 12%)' }}>Delete Commission?</h3>
            <p className="text-sm mb-5" style={{ color: 'hsl(215 10% 48%)' }}>This record will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>Cancel</button>
              <button onClick={() => { deleteCommission(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
