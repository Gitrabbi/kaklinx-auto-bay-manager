'use client';
import WorkerRecommendationPanel from './WorkerRecommendationPanel';
import React, { useState } from 'react';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import QRCode from 'react-qr-code';
import {
  useAppData,
  WorkOrder,
  WorkOrderStatus,
  VEHICLE_TYPES,
  SERVICE_TYPES,
} from '../../../context/AppDataContext';

const statusConfig: Record<WorkOrderStatus, { className: string; label: string }> = {
  Completed: { className: 'badge-completed', label: 'Completed' },
  'In Progress': { className: 'badge-in-progress', label: 'In Progress' },
  Pending: { className: 'badge-pending', label: 'Pending' },
  Cancelled: { className: 'badge-cancelled', label: 'Cancelled' },
};

const PREMIUM_SERVICE = 'Interior Premium + Vacuuming + Body Wash';

const PREMIUM_COMPONENTS = [
  'Body Wash',
  'Vacuuming',
  'Interior + Vacuuming',
];

interface FormState {
  plate: string;
  vehicleType: string;
  services: string[];
  assignedWorkers: string[];
  notes: string;
  totalAmount: string;
  additionalServiceDescription: string;
  additionalServiceCost: string;
  discount: string;
}

const emptyForm: FormState = {
  plate: '',
  vehicleType: VEHICLE_TYPES[0],
  services: [],
  assignedWorkers: [],
  notes: '',
  totalAmount: '',
  additionalServiceDescription: '',
  additionalServiceCost: '',
  discount: '',
};

export default function WorkOrdersManager() {
  const {
    workOrders,
    workers,
    pricing,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    startWorkOrder,
    completeWorkOrder,
  } = useAppData();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [viewOrder, setViewOrder] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkOrderStatus | 'All'>('All');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [timer, setTimer] = useState<Record<string, number>>({});

  const [extendOrder, setExtendOrder] = useState<WorkOrder | null>(null);
  const [extendMinutes, setExtendMinutes] = useState('10');
  const [extendCategory, setExtendCategory] = useState<'operational' | 'worker_inability' | 'customer_extra_requests'>('operational');
  const [extendReason, setExtendReason] = useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updates: Record<string, number> = {};

      workOrders.forEach((wo) => {
        if (wo.status === 'In Progress' && wo.startedAt) {
          updates[wo.id] = Math.floor((now - new Date(wo.startedAt).getTime()) / 1000);
        }
      });

      setTimer(updates);
    }, 1000);

    return () => clearInterval(interval);
  }, [workOrders]);

  // Auto close if overrun > target + extension + 10 mins
  React.useEffect(() => {
    workOrders.forEach((wo) => {
      const elapsed = timer[wo.id] || 0;
      const targetSecs = (wo.targetMinutes || 0) * 60;
      const extendedSecs = (wo.extensionMinutes || 0) * 60;
      const allowance = targetSecs + extendedSecs + 600; // +10 mins grace

      if (wo.status === 'In Progress' && wo.startedAt && targetSecs > 0 && elapsed > allowance) {
        completeWorkOrder(wo.id);
        updateWorkOrder(wo.id, { autoClosedAt: new Date().toISOString() });
      }
    });
  }, [timer, workOrders, completeWorkOrder, updateWorkOrder]);

  const calculateServiceTotal = (vehicleType: string, selectedServices: string[]) => {
    return selectedServices.reduce((sum, service) => {
      const item = pricing.find((p) => p.vehicleType === vehicleType && p.serviceType === service);
      return sum + Number(item?.price || 0);
    }, 0);
  };

  const calculateRecommendedMinutes = (vehicleType: string, selectedServices: string[]) =>
    selectedServices.reduce((sum, service) => {
      const row = pricing.find((p) => p.vehicleType === vehicleType && p.serviceType === service);
      return sum + Number(row?.recommendedMinutes || 0);
    }, 0);

  const calculateTotal = (
    vehicleType: string,
    selectedServices: string[],
    additionalCostValue = form.additionalServiceCost,
    discountValue = form.discount
  ) => {
    const serviceTotal = calculateServiceTotal(vehicleType, selectedServices);
    const additionalCost = Number(additionalCostValue || 0);
    const discount = Number(discountValue || 0);
    return Math.max(serviceTotal + additionalCost - discount, 0);
  };

  const applyPremiumRules = (selectedServices: string[]) => {
    const hasAllPremiumComponents = PREMIUM_COMPONENTS.every((svc) => selectedServices.includes(svc));

    if (hasAllPremiumComponents && !selectedServices.includes(PREMIUM_SERVICE)) {
      return [
        ...selectedServices.filter((svc) => !PREMIUM_COMPONENTS.includes(svc)),
        PREMIUM_SERVICE,
      ];
    }

    return selectedServices;
  };

  const selectedPremiumCount = PREMIUM_COMPONENTS.filter((svc) => form.services.includes(svc)).length;

  const shouldSuggestPremium =
    selectedPremiumCount === PREMIUM_COMPONENTS.length - 1 &&
    !form.services.includes(PREMIUM_SERVICE);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (wo: WorkOrder) => {
    setForm({
      plate: wo.plate,
      vehicleType: wo.vehicleType,
      services: wo.services || [],
      assignedWorkers: wo.assignedWorkers || [],
      notes: wo.notes || '',
      totalAmount: wo.totalAmount?.toString() || '',
      additionalServiceDescription: wo.additionalServiceDescription || '',
      additionalServiceCost: wo.additionalServiceCost?.toString() || '',
      discount: wo.discount?.toString() || '',
    });

    setEditId(wo.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.plate.trim()) return;

    const payload = {
      plate: form.plate.trim().toUpperCase(),
      vehicleType: form.vehicleType,
      services: form.services,
      assignedWorkers: form.assignedWorkers,
      notes: form.notes,
      totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : 0,
      additionalServiceDescription: form.additionalServiceDescription,
      additionalServiceCost: Number(form.additionalServiceCost || 0),
      discount: Number(form.discount || 0),
      status: 'Pending' as WorkOrderStatus,
      targetMinutes: calculateRecommendedMinutes(form.vehicleType, form.services),
      extensionMinutes: 0,
    };

    if (editId) updateWorkOrder(editId, payload);
    else addWorkOrder(payload);

    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const toggleService = (svc: string) => {
    setForm((f) => {
      let updatedServices = f.services.includes(svc)
        ? f.services.filter((s) => s !== svc)
        : [...f.services, svc];

      updatedServices = applyPremiumRules(updatedServices);

      const total = calculateTotal(f.vehicleType, updatedServices, f.additionalServiceCost, f.discount);

      return {
        ...f,
        services: updatedServices,
        totalAmount: total.toFixed(2),
      };
    });
  };

  const applyPremiumOffer = () => {
    const premiumServices = [PREMIUM_SERVICE];

    const premiumPrice =
      pricing.find((p) => p.vehicleType === form.vehicleType && p.serviceType === PREMIUM_SERVICE)?.price ||
      calculateServiceTotal(form.vehicleType, PREMIUM_COMPONENTS);

    const discount = Number(premiumPrice) * 0.1;
    const total = Number(premiumPrice) - discount + Number(form.additionalServiceCost || 0);

    setForm((f) => ({
      ...f,
      services: premiumServices,
      discount: discount.toFixed(2),
      totalAmount: total.toFixed(2),
    }));
  };

  const toggleWorker = (wid: string) => {
    setForm((f) => ({
      ...f,
      assignedWorkers: f.assignedWorkers.includes(wid)
        ? f.assignedWorkers.filter((w) => w !== wid)
        : [...f.assignedWorkers, wid],
    }));
  };

  const handleVehicleChange = (vehicleType: string) => {
    setForm((f) => ({
      ...f,
      vehicleType,
      totalAmount: calculateTotal(vehicleType, f.services, f.additionalServiceCost, f.discount).toFixed(2),
    }));
  };

  const handleAdditionalCostChange = (additionalServiceCost: string) => {
    setForm((f) => ({
      ...f,
      additionalServiceCost,
      totalAmount: calculateTotal(f.vehicleType, f.services, additionalServiceCost, f.discount).toFixed(2),
    }));
  };

  const handleDiscountChange = (discount: string) => {
    setForm((f) => ({
      ...f,
      discount,
      totalAmount: calculateTotal(f.vehicleType, f.services, f.additionalServiceCost, discount).toFixed(2),
    }));
  };

  const filtered = workOrders.filter((wo) => {
    const matchSearch =
      wo.plate.toLowerCase().includes(search.toLowerCase()) ||
      wo.vehicleType.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'All' || wo.status === filterStatus;

    return matchSearch && matchStatus;
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'text-white' : 'bg-white border'}`}
              style={
                filterStatus === s
                  ? { backgroundColor: 'hsl(205 78% 42%)' }
                  : { borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }
              }
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(215 10% 48%)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plate or vehicle..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none focus:ring-2"
              style={{ borderColor: 'hsl(210 18% 89%)', fontSize: '13px' }}
            />
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0"
            style={{ backgroundColor: 'hsl(205 78% 42%)' }}
          >
            <PlusIcon className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <TruckIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(215 10% 70%)' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(215 25% 12%)' }}>No work orders yet</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(215 10% 48%)' }}>
              Click &quot;New Order&quot; to create your first work order
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'hsl(210 20% 98%)', borderBottom: '1px solid hsl(210 18% 89%)' }}>
                  {['Order ID', 'Plate', 'Vehicle', 'Services', 'Workers', 'Status', 'Amount', 'Time', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(215 10% 48%)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                {filtered.map((wo) => {
                  const sc = statusConfig[wo.status];
                  const elapsed = timer[wo.id];
                  const targetSecs = (wo.targetMinutes || 0) * 60;
                  const extendedSecs = (wo.extensionMinutes || 0) * 60;
                  const overtime = elapsed !== undefined ? elapsed - (targetSecs + extendedSecs) : 0;

                  return (
                    <tr key={wo.id} className="table-row-hover transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'hsl(205 78% 42%)' }}>{wo.id}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>{wo.plate}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215 10% 48%)' }}>{wo.vehicleType}</td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-xs truncate" style={{ color: 'hsl(215 25% 12%)' }}>{wo.services.join(', ') || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215 10% 48%)' }}>
                        {wo.assignedWorkers.length > 0
                          ? workers.filter((w) => wo.assignedWorkers.includes(w.id)).map((w) => w.name.split(' ')[0]).join(', ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sc.className}`}>{sc.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>
                        GH₵ {Number(wo.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215 10% 48%)' }}>
                        {wo.status === 'In Progress' && elapsed !== undefined ? (
                          <div className="space-y-1">
                            <span className="font-mono text-emerald-600 font-semibold block">{formatTimer(elapsed)}</span>
                            <span className="text-[11px] block">Target: {wo.targetMinutes || 0}m</span>
                            {overtime > 0 && <span className="text-[11px] text-amber-600 block">Overrun: {Math.floor(overtime / 60)}m</span>}
                          </div>
                        ) : wo.duration ? (
                          <span>{wo.duration}</span>
                        ) : (
                          <span>{formatDate(wo.createdAt)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewOrder(wo)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="View">
                            <EyeIcon className="w-4 h-4" style={{ color: 'hsl(205 78% 42%)' }} />
                          </button>

                          {wo.status === 'Completed' && wo.closureStatus === 'awaiting_customer' && (
                            <button onClick={() => setViewOrder(wo)} className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700" title="Customer Certification QR">
                              QR
                            </button>
                          )}

                          {wo.status === 'Pending' && (
                            <button onClick={() => startWorkOrder(wo.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="Start">
                              <PlayIcon className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}

                          {wo.status === 'In Progress' && (
                            <>
                              <button onClick={() => completeWorkOrder(wo.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="Complete">
                                <CheckIcon className="w-4 h-4 text-emerald-600" />
                              </button>
                              {overtime > 0 && (
                                <button onClick={() => setExtendOrder(wo)} className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700" title="Extend time">
                                  Extend
                                </button>
                              )}
                            </>
                          )}

                          {(wo.status === 'Pending' || wo.status === 'In Progress') && (
                            <button onClick={() => openEdit(wo)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Edit">
                              <PencilSquareIcon className="w-4 h-4" style={{ color: 'hsl(205 78% 42%)' }} />
                            </button>
                          )}

                          <button onClick={() => setConfirmDelete(wo.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
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

      {/* Keep your existing form modal + view modal + delete modal exactly as before */}
      {/* (unchanged blocks omitted here for brevity in this chat) */}

      {extendOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg">Extend Job Timeline</h3>
            <p className="text-sm text-slate-500">This job exceeded recommended timeline. Add extension details.</p>

            <input
              value={extendMinutes}
              onChange={(e) => setExtendMinutes(e.target.value)}
              type="number"
              min="1"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              placeholder="Minutes to extend"
            />

            <select
              value={extendCategory}
              onChange={(e) => setExtendCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            >
              <option value="operational">Operational (Company liable)</option>
              <option value="worker_inability">Worker inability (Worker liable)</option>
              <option value="customer_extra_requests">Customer extra requests (Customer liable)</option>
            </select>

            <textarea
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              placeholder="Reason for extension..."
            />

            <div className="flex gap-3">
              <button className="flex-1 py-2 rounded-lg border" onClick={() => setExtendOrder(null)}>
                Cancel
              </button>
              <button
                className="flex-1 py-2 rounded-lg text-white bg-amber-600"
                onClick={() => {
                  const extra = Number(extendMinutes || 0);
                  updateWorkOrder(extendOrder.id, {
                    extensionMinutes: (extendOrder.extensionMinutes || 0) + extra,
                    extensionReasonCategory: extendCategory,
                    extensionReason: extendReason || 'No details',
                  });
                  setExtendOrder(null);
                  setExtendMinutes('10');
                  setExtendReason('');
                }}
              >
                Save Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <TrashIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1" style={{ color: 'hsl(215 25% 12%)' }}>Delete Work Order?</h3>
            <p className="text-sm mb-5" style={{ color: 'hsl(215 10% 48%)' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>Cancel</button>
              <button
                onClick={() => {
                  deleteWorkOrder(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
