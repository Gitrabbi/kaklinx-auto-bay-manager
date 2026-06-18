'use client';
import WorkerRecommendationPanel from './WorkerRecommendationPanel';
import React, { useState, useRef, useEffect } from 'react';
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
  ClockIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';
import QRCode from 'react-qr-code';
import { supabase } from '@/lib/supabaseClient';
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

// Action sheet color tokens (inline hsl values matching codebase design system)
const CLR_PRIMARY = 'hsl(205 78% 42%)';
const CLR_PRIMARY_HOVER = 'hsl(205 78% 55%)';
const CLR_PRIMARY_BG = 'hsl(205 78% 97%)';
const CLR_DESTRUCTIVE = 'hsl(0 71% 50%)';
const CLR_DESTRUCTIVE_BORDER = 'hsl(0 71% 75%)';
const CLR_DESTRUCTIVE_BG = 'hsl(0 71% 97%)';
const CLR_SECONDARY_BORDER = 'hsl(210 18% 80%)';
const CLR_SECONDARY_TEXT = 'hsl(215 25% 25%)';

// Shared className fragments for action sheet buttons
const PRIMARY_BTN_CLS =
  'w-full rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60';
const SECONDARY_BTN_CLS =
  'rounded-lg border font-medium text-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

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
  const [showQrModal, setShowQrModal] = useState<WorkOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkOrderStatus | 'All'>('All');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [timer, setTimer] = useState<Record<string, number>>({});
  const [extendOrder, setExtendOrder] = useState<WorkOrder | null>(null);
  const [extendMinutes, setExtendMinutes] = useState('10');
  const [extendCategory, setExtendCategory] = useState<'operational' | 'worker_inability' | 'customer_extra_requests'>('operational');
  const [extendReason, setExtendReason] = useState('');
  const [closedCertifiedOrderIds, setClosedCertifiedOrderIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (selectedOrder) {
      sheetTriggerRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => sheetRef.current?.focus());
    } else {
      sheetTriggerRef.current?.focus();
      sheetTriggerRef.current = null;
    }
  }, [selectedOrder]);

  const getClosureStatus = (wo: any) => {
    if (closedCertifiedOrderIds.includes(wo.id)) return 'closed';
    return wo.closureStatus || wo.closure_status || 'open';
  };

  const shouldShowCertificationQr = (wo: any) => {
    return wo.status === 'Completed' && getClosureStatus(wo) === 'awaiting_customer';
  };

  React.useEffect(() => {
    const channel = supabase
      .channel('work-order-certification-live')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'work_orders',
        },
        (payload) => {
          const updated: any = payload.new;
          const updatedId = updated?.id;
          const updatedClosureStatus =
            updated?.closure_status || updated?.closureStatus || 'open';

          if (!updatedId) return;

          if (updatedClosureStatus === 'closed') {
            setClosedCertifiedOrderIds((prev) =>
              prev.includes(updatedId) ? prev : [...prev, updatedId]
            );
          }

          setViewOrder((prev) => {
            if (!prev || prev.id !== updatedId) return prev;

            return {
              ...prev,
              closureStatus: updatedClosureStatus,
              customerRating: updated.customer_rating ?? prev.customerRating,
              customerComment: updated.customer_comment ?? prev.customerComment,
              customerSatisfaction:
                updated.customer_satisfaction ?? prev.customerSatisfaction,
              customerCertifiedAt:
                updated.customer_certified_at ?? prev.customerCertifiedAt,
              qualityPassed: updated.quality_passed ?? prev.qualityPassed,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  React.useEffect(() => {
    workOrders.forEach((wo) => {
      const elapsed = timer[wo.id] || 0;
      const targetSecs = (wo.targetMinutes || 0) * 60;
      const extendedSecs = (wo.extensionMinutes || 0) * 60;
      const allowance = targetSecs + extendedSecs + 600;

      if (wo.status === 'In Progress' && wo.startedAt && targetSecs > 0 && elapsed > allowance) {
        completeWorkOrder(wo.id);
        updateWorkOrder(wo.id, { autoClosedAt: new Date().toISOString() });
      }
    });
  }, [timer, workOrders, completeWorkOrder, updateWorkOrder]);

  const calculateServiceTotal = (vehicleType: string, selectedServices: string[]) => {
    return selectedServices.reduce((sum, service) => {
      const item = pricing.find(
        (p) => p.vehicleType === vehicleType && p.serviceType === service
      );

      return sum + Number(item?.price || 0);
    }, 0);
  };

  const calculateRecommendedMinutes = (vehicleType: string, selectedServices: string[]) =>
    selectedServices.reduce((sum, service) => {
      const priceRow = pricing.find((p) => p.vehicleType === vehicleType && p.serviceType === service);
      return sum + Number(priceRow?.recommendedMinutes || 0);
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
    const hasAllPremiumComponents = PREMIUM_COMPONENTS.every((svc) =>
      selectedServices.includes(svc)
    );

    if (hasAllPremiumComponents && !selectedServices.includes(PREMIUM_SERVICE)) {
      return [
        ...selectedServices.filter((svc) => !PREMIUM_COMPONENTS.includes(svc)),
        PREMIUM_SERVICE,
      ];
    }

    return selectedServices;
  };

  const selectedPremiumCount = PREMIUM_COMPONENTS.filter((svc) =>
    form.services.includes(svc)
  ).length;

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
      additionalServiceDescription: (wo as any).additionalServiceDescription || '',
      additionalServiceCost: (wo as any).additionalServiceCost?.toString() || '',
      discount: (wo as any).discount?.toString() || '',
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

    if (editId) {
      updateWorkOrder(editId, payload);
    } else {
      addWorkOrder(payload);
    }

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

      const total = calculateTotal(
        f.vehicleType,
        updatedServices,
        f.additionalServiceCost,
        f.discount
      );

      return {
        ...f,
        services: updatedServices,
        totalAmount: total.toFixed(2),
      };
    });
  };

  const handleVehicleChange = (vehicleType: string) => {
    setForm((f) => {
      const total = calculateTotal(
        vehicleType,
        f.services,
        f.additionalServiceCost,
        f.discount
      );

      return {
        ...f,
        vehicleType,
        totalAmount: total.toFixed(2),
      };
    });
  };

  const handleAdditionalCostChange = (value: string) => {
    setForm((f) => {
      const total = calculateTotal(f.vehicleType, f.services, value, f.discount);

      return {
        ...f,
        additionalServiceCost: value,
        totalAmount: total.toFixed(2),
      };
    });
  };

  const handleDiscountChange = (value: string) => {
    setForm((f) => {
      const total = calculateTotal(
        f.vehicleType,
        f.services,
        f.additionalServiceCost,
        value
      );

      return {
        ...f,
        discount: value,
        totalAmount: total.toFixed(2),
      };
    });
  };

  const toggleWorker = (workerId: string) => {
    setForm((f) => ({
      ...f,
      assignedWorkers: f.assignedWorkers.includes(workerId)
        ? f.assignedWorkers.filter((id) => id !== workerId)
        : [...f.assignedWorkers, workerId],
    }));
  };

  const applyPremiumOffer = () => {
    setForm((f) => {
      const updatedServices = applyPremiumRules([...f.services, PREMIUM_SERVICE]);
      const serviceTotal = calculateServiceTotal(f.vehicleType, updatedServices);
      const discountedServiceTotal = serviceTotal * 0.9;
      const additionalCost = Number(f.additionalServiceCost || 0);
      const discount = Number(f.discount || 0);
      const total = Math.max(discountedServiceTotal + additionalCost - discount, 0);

      return {
        ...f,
        services: updatedServices,
        totalAmount: total.toFixed(2),
      };
    });
  };

  const filtered = workOrders.filter((wo) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      q.length === 0 ||
      wo.plate.toLowerCase().includes(q) ||
      wo.vehicleType.toLowerCase().includes(q) ||
      wo.id.toLowerCase().includes(q);

    const matchStatus = filterStatus === 'All' ? true : wo.status === filterStatus;

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
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s ? 'text-white' : 'bg-white border'
              }`}
              style={
                filterStatus === s
                  ? { backgroundColor: 'hsl(205 78% 42%)' }
                  : {
                      borderColor: 'hsl(210 18% 89%)',
                      color: 'hsl(215 10% 48%)',
                    }
              }
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by plate, type, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg border text-xs outline-none"
            style={{ borderColor: 'hsl(210 18% 89%)' }}
          />
          <button
            onClick={openCreate}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1"
            style={{ backgroundColor: 'hsl(205 78% 42%)' }}
          >
            <PlusIcon className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      <div
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: 'hsl(210 18% 89%)' }}
      >
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <TruckIcon
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: 'hsl(215 10% 70%)' }}
            />
            <p className="text-sm font-medium" style={{ color: 'hsl(215 25% 12%)' }}>
              No work orders yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(215 10% 48%)' }}>
              Create your first work order to get started.
            </p>
          </div>
        ) : (
          <>
          <div className="block lg:hidden p-3 space-y-3">{filtered.map((wo) => (<div key={wo.id} onClick={() => setSelectedOrder(wo)} className="bg-white rounded-xl border p-4 shadow-sm cursor-pointer"><div className="flex justify-between"><div><div className="inline-flex px-2 py-1 mb-2 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{wo.queueNumber || 'Unqueued'}</div><h4 className="font-semibold">{wo.plate}</h4><p className="text-xs text-gray-500">{wo.vehicleType}</p><p className="text-xs text-blue-600 mt-1">Position #{wo.queuePosition || '-'}</p></div><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig[wo.status].className}`}>{wo.status}</span></div><p className="mt-2 text-xs text-gray-500">{wo.services.join(', ')}</p><div className="flex justify-between mt-3"><span className="font-semibold">GH₵ {Number(wo.totalAmount || 0).toFixed(2)}</span><span className="text-blue-600 text-xs">Tap for actions →</span></div></div>))}</div><div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3" style={{ color: 'hsl(215 10% 48%)' }}>
                    Queue
                  </th>
                  <th className="px-4 py-3" style={{ color: 'hsl(215 10% 48%)' }}>
                    Plate
                  </th>
                  <th className="px-4 py-3" style={{ color: 'hsl(215 10% 48%)' }}>
                    Vehicle
                  </th>
                  <th className="px-4 py-3" style={{ color: 'hsl(215 10% 48%)' }}>
                    Services
                  </th>
                  <th className="px-4 py-3" style={{ color: 'hsl(215 10% 48%)' }}>
                    Status
                  </th>
                  <th className="px-4 py-3" style={{ color: 'hsl(215 10% 48%)' }}>
                    Duration
                  </th>
                  <th className="px-4 py-3 text-right" style={{ color: 'hsl(215 10% 48%)' }}>
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right" style={{ color: 'hsl(215 10% 48%)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((wo) => {
                  const elapsedSecs = timer[wo.id] || 0;
                  const targetSecs = (wo.targetMinutes || 0) * 60;
                  const extensionSecs = (wo.extensionMinutes || 0) * 60;
                  const overtime = Math.max(
                    0,
                    elapsedSecs - (targetSecs + extensionSecs + 600)
                  );

                  return (
                    <tr key={wo.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {wo.queueNumber || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{wo.plate}</td>
                      <td className="px-4 py-3 text-xs">{wo.vehicleType}</td>
                      <td className="px-4 py-3 text-xs">{wo.services?.join(', ') || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig[wo.status].className}`}>
                          {wo.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {wo.status === 'In Progress' ? formatTimer(elapsedSecs) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        GH₵ {Number(wo.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setShowQrModal(wo)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="View">
                            <EyeIcon className="w-4 h-4" style={{ color: 'hsl(205 78% 42%)' }} />
                          </button>
                          {shouldShowCertificationQr(wo) && (
                            <button
                              type="button"
                              onClick={() => setViewOrder(wo)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700"
                              title="Customer Certification QR"
                            >
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
        </>
        )}
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end lg:hidden"
          onClick={() => { setSelectedOrder(null); setActionLoading(null); }}
        >
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="action-sheet-title"
            tabIndex={-1}
            className="bg-white w-full shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom-5 duration-300 outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-12 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-3 border-b border-slate-200 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 id="action-sheet-title" className="text-lg font-bold" style={{ color: 'hsl(215 25% 12%)' }}>{selectedOrder.plate}</h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: 'hsl(215 10% 48%)' }}>{selectedOrder.vehicleType}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusConfig[selectedOrder.status].className}`}>
                  {selectedOrder.status}
                </span>
                <button
                  onClick={() => { setSelectedOrder(null); setActionLoading(null); }}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Close action sheet"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="px-6 py-4 space-y-2 border-b border-slate-200">
              {selectedOrder.status === 'Pending' && (
                <button
                  onClick={() => {
                    setActionLoading('start');
                    startWorkOrder(selectedOrder.id);
                    setTimeout(() => {
                      setSelectedOrder(null);
                      setActionLoading(null);
                    }, 300);
                  }}
                  disabled={actionLoading === 'start'}
                  aria-label={actionLoading === 'start' ? 'Starting job, please wait' : 'Start job'}
                  aria-busy={actionLoading === 'start'}
                  className={PRIMARY_BTN_CLS}
                  style={{ height: '52px', backgroundColor: actionLoading === 'start' ? CLR_PRIMARY_HOVER : CLR_PRIMARY }}
                >
                  {actionLoading === 'start' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      Start Job
                    </>
                  )}
                </button>
              )}

              {selectedOrder.status === 'In Progress' && (
                <>
                  <button
                    onClick={() => {
                      setActionLoading('complete');
                      completeWorkOrder(selectedOrder.id);
                      setTimeout(() => {
                        setSelectedOrder(null);
                        setActionLoading(null);
                      }, 300);
                    }}
                    disabled={actionLoading === 'complete'}
                    aria-label={actionLoading === 'complete' ? 'Completing job, please wait' : 'Complete job'}
                    aria-busy={actionLoading === 'complete'}
                    className={PRIMARY_BTN_CLS}
                    style={{ height: '52px', backgroundColor: actionLoading === 'complete' ? CLR_PRIMARY_HOVER : CLR_PRIMARY }}
                  >
                    {actionLoading === 'complete' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Completing…
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-5 h-5" />
                        Complete Job
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => { setExtendOrder(selectedOrder); setSelectedOrder(null); }}
                    aria-label="Extend job time"
                    className={`w-full ${SECONDARY_BTN_CLS} font-semibold`}
                    style={{ height: '52px', borderColor: CLR_PRIMARY, color: CLR_PRIMARY, backgroundColor: CLR_PRIMARY_BG }}
                  >
                    <ClockIcon className="w-5 h-5" />
                    Extend Job Time
                  </button>
                </>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="px-6 py-4 space-y-2 border-b border-slate-200" role="group" aria-label="Order actions">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setViewOrder(selectedOrder); setSelectedOrder(null); }}
                  aria-label="View order details"
                  className={SECONDARY_BTN_CLS}
                  style={{ height: '44px', borderColor: CLR_SECONDARY_BORDER, color: CLR_SECONDARY_TEXT, backgroundColor: 'white' }}
                >
                  <EyeIcon className="w-4 h-4" />
                  View Details
                </button>

                {(selectedOrder.status === 'Pending' || selectedOrder.status === 'In Progress') && (
                  <button
                    onClick={() => { openEdit(selectedOrder); setSelectedOrder(null); }}
                    aria-label="Edit work order"
                    className={SECONDARY_BTN_CLS}
                    style={{ height: '44px', borderColor: CLR_SECONDARY_BORDER, color: CLR_SECONDARY_TEXT, backgroundColor: 'white' }}
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit Order
                  </button>
                )}
              </div>

              {shouldShowCertificationQr(selectedOrder) && (
                <button
                  onClick={() => { setShowQrModal(selectedOrder); setSelectedOrder(null); }}
                  aria-label="Show customer certification QR code"
                  className={`w-full ${SECONDARY_BTN_CLS} border-2`}
                  style={{ height: '44px', borderColor: CLR_PRIMARY, color: CLR_PRIMARY, backgroundColor: CLR_PRIMARY_BG }}
                >
                  <QrCodeIcon className="w-4 h-4" />
                  Customer QR
                </button>
              )}
            </div>

            {/* Destructive Action */}
            <div className="px-6 py-3 pb-6">
              <button
                onClick={() => { setConfirmDelete(selectedOrder.id); setSelectedOrder(null); }}
                aria-label="Delete this work order"
                className={`w-full ${SECONDARY_BTN_CLS} font-semibold`}
                style={{ height: '44px', borderColor: CLR_DESTRUCTIVE_BORDER, color: CLR_DESTRUCTIVE, backgroundColor: CLR_DESTRUCTIVE_BG }}
              >
                <TrashIcon className="w-4 h-4" />
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(210 18% 89%)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'hsl(215 25% 12%)' }}>
                {editId ? 'Edit Work Order' : 'Create New Work Order'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5" style={{ color: 'hsl(215 10% 48%)' }} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>
                    License Plate
                  </label>
                  <input
                    type="text"
                    value={form.plate}
                    onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
                    placeholder="e.g., GT-1234"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
                    style={{ borderColor: 'hsl(210 18% 89%)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white"
                    style={{ borderColor: 'hsl(210 18% 89%)' }}
                  >
                    {VEHICLE_TYPES.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>
                    Services
                  </label>
                  <div className="space-y-1.5">
                    {SERVICE_TYPES.map((svc) => (
                      <label key={svc} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.services.includes(svc)}
                          onChange={() => toggleService(svc)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{svc}</span>
                      </label>
                    ))}
                  </div>
                  {shouldSuggestPremium && (
                    <button
                      type="button"
                      onClick={applyPremiumOffer}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: 'hsl(205 78% 42%)' }}
                    >
                      Suggest Premium Offer (10% off)
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>
                    Assigned Workers
                  </label>
                  <div className="space-y-1.5">
                    {workers.map((w) => (
                      <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.assignedWorkers.includes(w.id)}
                          onChange={() => toggleWorker(w.id)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{w.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>
                      Subtotal
                    </label>
                    <input
                      type="number"
                      value={calculateServiceTotal(form.vehicleType, form.services).toFixed(2)}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 outline-none"
                      style={{ borderColor: 'hsl(210 18% 89%)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>
                      Add. Service
                    </label>
                    <input
                      type="number"
                      value={form.additionalServiceCost}
                      onChange={(e) => handleAdditionalCostChange(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
                      style={{ borderColor: 'hsl(210 18% 89%)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>
                      Discount
                    </label>
                    <input
                      type="number"
                      value={form.discount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
                      style={{ borderColor: 'hsl(210 18% 89%)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>
                    Total Amount
                  </label>
                  <input
                    type="number"
                    value={form.totalAmount}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-gray-50 font-bold"
                    style={{ borderColor: 'hsl(210 18% 89%)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>
                    Additional Service Description
                  </label>
                  <input
                    type="text"
                    value={form.additionalServiceDescription}
                    onChange={(e) => setForm((f) => ({ ...f, additionalServiceDescription: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-gray-50"
                    style={{ borderColor: 'hsl(210 18% 89%)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Optional notes..."
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 resize-none"
                    style={{ borderColor: 'hsl(210 18% 89%)' }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50" style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors" style={{ backgroundColor: 'hsl(205 78% 42%)' }}>
                    {editId ? 'Save Changes' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(210 18% 89%)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'hsl(215 25% 12%)' }}>Order Details</h3>
              <button onClick={() => setViewOrder(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5" style={{ color: 'hsl(215 10% 48%)' }} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {[
                ['Order ID', viewOrder.id],
                ['Queue Number', viewOrder.queueNumber || '—'],
                ['Queue Position', String(viewOrder.queuePosition || '—')],
                ['License Plate', viewOrder.plate],
                ['Vehicle Type', viewOrder.vehicleType],
                ['Services', (viewOrder.services || []).join(', ') || '—'],
                ['Status', viewOrder.status],
                ['Created', formatDate(viewOrder.createdAt)],
                ['Started', viewOrder.startedAt ? formatDate(viewOrder.startedAt) : '—'],
                ['Completed', viewOrder.completedAt ? formatDate(viewOrder.completedAt) : '—'],
                ['Duration', viewOrder.duration || '—'],
                ['Recommended Timeline', `${viewOrder.targetMinutes || 0} minutes`],
                ['Extension Minutes', `${viewOrder.extensionMinutes || 0} minutes`],
                ['Extension Category', viewOrder.extensionReasonCategory || '—'],
                ['Extension Reason', viewOrder.extensionReason || '—'],
                ['Auto Closed At', viewOrder.autoClosedAt ? formatDate(viewOrder.autoClosedAt) : '—'],
                ['Notes', viewOrder.notes || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-xs font-semibold" style={{ color: 'hsl(215 10% 48%)' }}>{label}</span>
                  <span className="text-xs text-right" style={{ color: 'hsl(215 25% 12%)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="p-5 border-t flex gap-3" style={{ borderColor: 'hsl(210 18% 89%)' }}>
              <button onClick={() => setViewOrder(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: 'hsl(210 18% 89%)', color: 'hsl(215 10% 48%)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="font-bold text-lg mb-3" style={{ color: 'hsl(215 25% 12%)' }}>
              QR Code
            </h3>

            <div className="flex justify-center mb-5">
              <QRCode
                value={`${window.location.origin}/customer-certify/${showQrModal.id}`}
                size={260}
              />
            </div>

            <p className="text-sm text-slate-600 mb-3">
              Ask the customer to scan this QR code to certify job completion.
            </p>

            <div className="text-xs break-all p-3 rounded-lg bg-slate-100">
              {`${window.location.origin}/customer-certify/${showQrModal.id}`}
            </div>

            <button
              onClick={() => setShowQrModal(null)}
              className="mt-5 w-full py-3 rounded-lg text-white font-semibold bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

{extendOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg">Extend Job Timeline</h3>
            <p className="text-sm text-slate-500">Required because this job exceeded recommended timeline.</p>
            <input value={extendMinutes} onChange={(e) => setExtendMinutes(e.target.value)} type="number" min="1" className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Minutes to extend" />
            <select value={extendCategory} onChange={(e) => setExtendCategory(e.target.value as any)} className="w-full px-3 py-2 rounded-lg border text-sm">
              <option value="operational">Operational (Company liable)</option>
              <option value="worker_inability">Worker Inability (Worker liable)</option>
              <option value="customer_extra_requests">Customer Extra Requests (Customer liable)</option>
            </select>
            <textarea value={extendReason} onChange={(e) => setExtendReason(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Reason for extension..." />
            <div className="flex gap-3">
              <button className="flex-1 py-2 rounded-lg border" onClick={() => setExtendOrder(null)}>Cancel</button>
              <button className="flex-1 py-2 rounded-lg text-white bg-amber-600" onClick={() => {
                const additional = Number(extendMinutes || 0);
                updateWorkOrder(extendOrder.id, {
                  extensionMinutes: (extendOrder.extensionMinutes || 0) + additional,
                  extensionReasonCategory: extendCategory,
                  extensionReason: extendReason || 'No details',
                });
                setExtendOrder(null);
                setExtendReason('');
                setExtendMinutes('10');
              }}>Save Extension</button>
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
