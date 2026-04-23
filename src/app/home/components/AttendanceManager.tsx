'use client';
import React, { useState } from 'react';
import {
  PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon,
  CalendarDaysIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAppData, AttendanceRecord, AttendanceStatus } from '../../../context/AppDataContext';

interface FormState {
  workerId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
}

const today = new Date().toISOString().split('T')[0];

const emptyForm: FormState = {
  workerId: '', date: today, checkIn: '', checkOut: '', status: 'Present',
};

const statusColors: Record<AttendanceStatus, { bg: string; text: string }> = {
  Present: { bg: 'hsla(160,60%,40%,0.1)', text: 'hsl(160 60% 35%)' },
  Absent: { bg: 'hsla(0,72%,51%,0.1)', text: 'hsl(0 72% 45%)' },
  Late: { bg: 'hsla(38,92%,50%,0.1)', text: 'hsl(38 92% 40%)' },
  'Half Day': { bg: 'hsla(205,78%,42%,0.1)', text: 'hsl(205 78% 42%)' },
};

function calcHours(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [ih, im] = checkIn.split(':').map(Number);
  const [oh, om] = checkOut.split(':').map(Number);
  return Math.max(0, (oh * 60 + om - ih * 60 - im) / 60);
}

export default function AttendanceManager() {
  const { workers, attendance, addAttendance, updateAttendance, deleteAttendance } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm, workerId: workers[0]?.id || '' });
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(today);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openCreate = () => {
    setForm({ ...emptyForm, workerId: workers[0]?.id || '' });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (a: AttendanceRecord) => {
    setForm({ workerId: a.workerId, date: a.date, checkIn: a.checkIn || '', checkOut: a.checkOut || '', status: a.status });
    setEditId(a.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workerId) return;
    const worker = workers.find(w => w.id === form.workerId);
    if (!worker) return;
    const hoursWorked = calcHours(form.checkIn, form.checkOut);
    const payload = {
      workerId: form.workerId,
      workerName: worker.name,
      date: form.date,
      checkIn: form.checkIn || undefined,
      checkOut: form.checkOut || undefined,
      status: form.status,
      hoursWorked: hoursWorked > 0 ? hoursWorked : undefined,
    };
    if (editId) {
      updateAttendance(editId, payload);
    } else {
      addAttendance(payload);
    }
    setShowForm(false);
    setEditId(null);
  };

  const filtered = attendance.filter(a => {
    const matchSearch = a.workerName.toLowerCase().includes(search.toLowerCase());
    const matchDate = !filterDate || a.date === filterDate;
    return matchSearch && matchDate;
  });

  const presentCount = filtered.filter(a => a.status === 'Present').length;
  const absentCount = filtered.filter(a => a.status === 'Absent').length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Present', value: presentCount, color: 'hsl(160 60% 35%)' },
          { label: 'Absent', value: absentCount, color: 'hsl(0 72% 45%)' },
          { label: 'Late', value: filtered.filter(a => a.status === 'Late').length, color: 'hsl(38 92% 40%)' },
          { label: 'Half Day', value: filtered.filter(a => a.status === 'Half Day').length, color: 'hsl(205 78% 42%)' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: 'hsl(210 18% 89%)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'hsl(215 10% 48%)' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(215 10% 48%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search worker..."
              className="pl-9 pr-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 w-44" style={{ borderColor: 'hsl(210 18% 89%)' }} />
          </div>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>
              Clear
            </button>
          )}
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0"
          style={{ backgroundColor: 'hsl(205 78% 42%)' }}>
          <PlusIcon className="w-4 h-4" /> Log Attendance
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(215 10% 70%)' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(215 25% 12%)' }}>No attendance records</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(215 10% 48%)' }}>Click &quot;Log Attendance&quot; to record worker attendance</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'hsl(210 20% 98%)', borderBottom: '1px solid hsl(210 18% 89%)' }}>
                  {['Worker', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(215 10% 48%)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                {filtered.map(a => {
                  const sc = statusColors[a.status];
                  return (
                    <tr key={a.id} className="table-row-hover transition-colors">
                      <td className="px-4 py-3 font-medium text-sm" style={{ color: 'hsl(215 25% 12%)' }}>{a.workerName}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215 10% 48%)' }}>{a.date}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215 10% 48%)' }}>{a.checkIn || '—'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215 10% 48%)' }}>{a.checkOut || '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>
                        {a.hoursWorked ? `${a.hoursWorked.toFixed(1)}h` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: sc.bg, color: sc.text }}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                            <PencilSquareIcon className="w-4 h-4" style={{ color: 'hsl(205 78% 42%)' }} />
                          </button>
                          <button onClick={() => setConfirmDelete(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <TrashIcon className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              <h3 className="font-bold text-lg" style={{ color: 'hsl(215 25% 12%)' }}>{editId ? 'Edit Attendance' : 'Log Attendance'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5" style={{ color: 'hsl(215 10% 48%)' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Worker *</label>
                <select required value={form.workerId} onChange={e => setForm(f => ({ ...f, workerId: e.target.value }))}
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
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Status *</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AttendanceStatus }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Check In</label>
                  <input type="time" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Check Out</label>
                  <input type="time" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50"
                  style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'hsl(205 78% 42%)' }}>{editId ? 'Save Changes' : 'Log Attendance'}</button>
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
            <h3 className="font-bold text-lg mb-1" style={{ color: 'hsl(215 25% 12%)' }}>Delete Record?</h3>
            <p className="text-sm mb-5" style={{ color: 'hsl(215 10% 48%)' }}>This attendance record will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>Cancel</button>
              <button onClick={() => { deleteAttendance(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
