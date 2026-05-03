'use client';
import React, { useState } from 'react';
import {
  PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon,
  Cog6ToothIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAppData, PricingItem, VEHICLE_TYPES, SERVICE_TYPES } from '../../../context/AppDataContext';

interface FormState {
  vehicleType: string;
  serviceType: string;
  price: string;
  recommendedMinutes: string;
}

const emptyForm: FormState = { vehicleType: VEHICLE_TYPES[0], serviceType: SERVICE_TYPES[0], price: '' };
const emptyForm: FormState = { vehicleType: VEHICLE_TYPES[0], serviceType: SERVICE_TYPES[0], price: '', recommendedMinutes: '' };

export default function PricingManager() {
  const { pricing, addPricing, updatePricing, deletePricing } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (p: PricingItem) => {
    setForm({ vehicleType: p.vehicleType, serviceType: p.serviceType, price: p.price.toString() });
    setForm({ vehicleType: p.vehicleType, serviceType: p.serviceType, price: p.price.toString(), recommendedMinutes: String(p.recommendedMinutes || '') });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.price) return;
    const payload = { vehicleType: form.vehicleType, serviceType: form.serviceType, price: parseFloat(form.price) };
    const payload = { vehicleType: form.vehicleType, serviceType: form.serviceType, price: parseFloat(form.price), recommendedMinutes: Number(form.recommendedMinutes || 0) };
    if (editId) {
      updatePricing(editId, payload);
    } else {
      addPricing(payload);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const vehicleGroups = ['All', ...Array.from(new Set(pricing.map(p => p.vehicleType)))];

  const filtered = pricing.filter(p => {
    const matchSearch = p.vehicleType.toLowerCase().includes(search.toLowerCase()) ||
      p.serviceType.toLowerCase().includes(search.toLowerCase());
    const matchVehicle = filterVehicle === 'All' || p.vehicleType === filterVehicle;
    return matchSearch && matchVehicle;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">

          </div>
          <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }}>
            {vehicleGroups.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0"
          style={{ backgroundColor: 'hsl(205 78% 42%)' }}>
          <PlusIcon className="w-4 h-4" /> Add Price
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Cog6ToothIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(215 10% 70%)' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(215 25% 12%)' }}>No pricing entries</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(215 10% 48%)' }}>Click &quot;Add Price&quot; to configure service pricing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'hsl(210 20% 98%)', borderBottom: '1px solid hsl(210 18% 89%)' }}>
                  {['Vehicle Type', 'Service', 'Price (GH₵)', 'Actions'].map(h => (
                  {['Vehicle Type', 'Service', 'Price (GH₵)', 'Timeline (min)', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(215 10% 48%)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                {filtered.map(p => (
                  <tr key={p.id} className="table-row-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-sm" style={{ color: 'hsl(215 25% 12%)' }}>{p.vehicleType}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'hsl(215 10% 48%)' }}>{p.serviceType}</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: 'hsl(205 78% 42%)' }}>GH₵ {p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'hsl(215 25% 12%)' }}>{p.recommendedMinutes || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                          <PencilSquareIcon className="w-4 h-4" style={{ color: 'hsl(205 78% 42%)' }} />
                        </button>
                        <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
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
              <h3 className="font-bold text-lg" style={{ color: 'hsl(215 25% 12%)' }}>{editId ? 'Edit Price' : 'Add Price'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5" style={{ color: 'hsl(215 10% 48%)' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Vehicle Type *</label>
                <select required value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                  {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Service Type *</label>
                <select required value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                  {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Price (GH₵) *</label>
                <input required type="number" min="0" step="0.01" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Recommended Timeline (minutes)</label>
                <input type="number" min="0" step="1" value={form.recommendedMinutes}
                  onChange={e => setForm(f => ({ ...f, recommendedMinutes: e.target.value }))}
                  placeholder="e.g. 20"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50"
                  style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'hsl(205 78% 42%)' }}>{editId ? 'Save Changes' : 'Add Price'}</button>
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
            <h3 className="font-bold text-lg mb-1" style={{ color: 'hsl(215 25% 12%)' }}>Delete Price?</h3>
            <p className="text-sm mb-5" style={{ color: 'hsl(215 10% 48%)' }}>This pricing entry will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>Cancel</button>
              <button onClick={() => { deletePricing(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500">Delete</button>
            </div>
          </div>
        </div>