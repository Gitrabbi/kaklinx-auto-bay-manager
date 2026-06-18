'use client';

import React from 'react';
import { useAppData } from '@/context/AppDataContext';
import {
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export default function QueueManager() {
  const { workOrders, workers, deleteWorkOrder } = useAppData();

  const pendingOrders = [...workOrders]
    .filter((wo) => wo.status === 'Pending')
    .sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0));

  const activeOrders = workOrders.filter(
    (wo) => wo.status === 'In Progress'
  );

  const completedOrdersAll = workOrders.filter((wo) => wo.status === 'Completed');

  const completedTodayCount = completedOrdersAll.filter(
    (wo) => wo.completedAt?.startsWith(new Date().toISOString().split('T')[0])
  ).length;

  const averageWait =
    pendingOrders.length > 0
      ? Math.round(
          pendingOrders.reduce(
            (sum, wo) => sum + (wo.targetMinutes || 20),
            0
          ) / pendingOrders.length
        )
      : 0;

  // Filters state for Recently Completed
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = React.useState('');
  const [todayOnly, setTodayOnly] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const deleteThresholdDays = 30; // default threshold
  const [deleteCount, setDeleteCount] = React.useState(0);

  const vehicleTypes = React.useMemo(() => {
    return Array.from(new Set(workOrders.map((w: any) => w.vehicleType).filter(Boolean)));
  }, [workOrders]);

  const formatDate = (iso: string | undefined) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
  };

  const applyCompletedFilters = React.useCallback(() => {
    const todayPrefix = new Date().toISOString().split('T')[0];

    return completedOrdersAll
      .filter((wo) => {
        if (!wo.completedAt) return false;
        // Today quick filter
        if (todayOnly) {
          return wo.completedAt.startsWith(todayPrefix);
        }

        // Date range filter
        if (startDate) {
          const st = new Date(startDate).setHours(0, 0, 0, 0);
          const completed = new Date(wo.completedAt).getTime();
          if (completed < st) return false;
        }
        if (endDate) {
          const ed = new Date(endDate).setHours(23, 59, 59, 999);
          const completed = new Date(wo.completedAt).getTime();
          if (completed > ed) return false;
        }

        // Vehicle type
        if (vehicleTypeFilter && wo.vehicleType !== vehicleTypeFilter) return false;

        // Search text (plate or queue number)
        if (searchText) {
          const q = searchText.toLowerCase();
          const plate = (wo.plate || '').toLowerCase();
          const qnum = String(wo.queueNumber || '').toLowerCase();
          if (!plate.includes(q) && !qnum.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  }, [completedOrdersAll, todayOnly, startDate, endDate, vehicleTypeFilter, searchText]);

  const filteredCompleted = applyCompletedFilters();

  const prepareDeleteOld = () => {
    const threshold = Date.now() - deleteThresholdDays * 24 * 60 * 60 * 1000;
    const old = completedOrdersAll.filter((wo) => {
      if (!wo.completedAt) return false;
      return new Date(wo.completedAt).getTime() < threshold;
    });
    setDeleteCount(old.length);
    setShowDeleteModal(true);
  };

  const confirmDeleteOld = async () => {
    setDeleteLoading(true);
    try {
      const threshold = Date.now() - deleteThresholdDays * 24 * 60 * 60 * 1000;
      const old = completedOrdersAll.filter((wo) => wo.completedAt && new Date(wo.completedAt).getTime() < threshold);
      await Promise.all(
        old.map((o) => deleteWorkOrder?.(o.id).catch(() => null))
      );
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-3xl p-5 shadow-xl">
          <div className="flex justify-between">
            <div>
              <p className="text-blue-100 text-sm">Cars Waiting</p>
              <h2 className="text-3xl font-bold">
                {pendingOrders.length}
              </h2>
            </div>
            <TruckIcon className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-3xl p-5 shadow-xl">
          <div className="flex justify-between">
            <div>
              <p className="text-orange-100 text-sm">In Service</p>
              <h2 className="text-3xl font-bold">
                {activeOrders.length}
              </h2>
            </div>
            <PlayCircleIcon className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-green-700 text-white rounded-3xl p-5 shadow-xl">
          <div className="flex justify-between">
            <div>
              <p className="text-green-100 text-sm">
                Completed Today
              </p>
              <h2 className="text-3xl font-bold">
                {completedTodayCount}
              </h2>
            </div>
            <CheckCircleIcon className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-3xl p-5 shadow-xl">
          <div className="flex justify-between">
            <div>
              <p className="text-purple-100 text-sm">
                Average Wait
              </p>
              <h2 className="text-3xl font-bold">
                {averageWait} min
              </h2>
            </div>
            <ClockIcon className="w-10 h-10 opacity-80" />
          </div>
        </div>

      </div>

      {/* Now Serving */}
      <div className="bg-white rounded-3xl border shadow-lg overflow-hidden">

        <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-6 py-4">
          <h2 className="text-xl font-bold">
            🚗 Now Serving
          </h2>
        </div>

        <div className="p-6">

          {activeOrders.length === 0 ? (
            <p className="text-slate-500">
              No vehicles currently in service.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">

              {activeOrders.map((order) => {
                const assignedWorkers = workers
                  .filter((w) =>
                    order.assignedWorkers?.includes(w.id)
                  )
                  .map((w) => w.name)
                  .join(', ');

                const runningMinutes = order.startedAt
                  ? Math.floor(
                      (Date.now() -
                        new Date(order.startedAt).getTime()) /
                        60000
                    )
                  : 0;

                return (
                  <div
                    key={order.id}
                    className="border rounded-2xl p-4 bg-green-50"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-bold text-xl text-green-700">
                        {order.queueNumber}
                      </h3>

                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                        In Progress
                      </span>
                    </div>

                    <p className="font-semibold mt-2">
                      {order.plate}
                    </p>

                    <p className="text-sm text-slate-600">
                      {order.vehicleType}
                    </p>

                    <div className="mt-3 text-sm space-y-1">
                      <p>
                        <strong>Workers:</strong>{' '}
                        {assignedWorkers || 'Unassigned'}
                      </p>

                      <p>
                        <strong>Running:</strong>{' '}
                        {runningMinutes} min
                      </p>

                      <p>
                        <strong>Target:</strong>{' '}
                        {order.targetMinutes || 20} min
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Waiting Queue */}
      <div className="bg-white rounded-3xl border shadow-lg overflow-hidden">

        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-4">
          <h2 className="text-xl font-bold">
            📋 Waiting Queue
          </h2>
        </div>

        <div className="p-6">

          {pendingOrders.length === 0 ? (
            <p className="text-slate-500">
              No vehicles waiting.
            </p>
          ) : (
            <div className="space-y-4">

              {pendingOrders.map((order, index) => {

                const eta = pendingOrders
                  .slice(0, index)
                  .reduce(
                    (sum, wo) =>
                      sum + (wo.targetMinutes || 20),
                    0
                  );

                return (
                  <div
                    key={order.id}
                    className="border rounded-2xl p-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                      <div>
                        <h3 className="font-bold text-lg text-blue-700">
                          {order.queueNumber}
                        </h3>

                        <p className="font-medium">
                          {order.plate}
                        </p>

                        <p className="text-sm text-slate-500">
                          {order.vehicleType}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-slate-500">
                          Position
                        </p>

                        <p className="text-2xl font-bold text-orange-600">
                          #{order.queuePosition}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-slate-500">
                          Vehicles Ahead
                        </p>

                        <p className="text-2xl font-bold text-blue-600">
                          {Math.max(
                            0,
                            (order.queuePosition || 1) - 1
                          )}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-slate-500">
                          ETA
                        </p>

                        <p className="text-2xl font-bold text-green-600">
                          {eta} min
                        </p>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Recently Completed with filters */}
      <div className="bg-white rounded-3xl border shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">✅ Recently Completed</h2>

          <div className="flex items-center gap-3">
            <button
              title="Show today"
              onClick={() => {
                setTodayOnly(true);
                setStartDate('');
                setEndDate('');
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${todayOnly ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}
            >
              Today
            </button>

            <button
              title="Delete completed older than 30 days"
              onClick={prepareDeleteOld}
              className="px-3 py-2 rounded-lg text-sm font-medium border text-red-600 bg-white/10"
            >
              <TrashIcon className="w-4 h-4 inline-block mr-2" />
              Delete Old
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search plate or queue number"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setTodayOnly(false); }}
                className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'hsl(210 18% 89%)' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-slate-400" />
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setTodayOnly(false); }} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'hsl(210 18% 89%)' }} />
                <span className="text-sm">to</span>
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setTodayOnly(false); }} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'hsl(210 18% 89%)' }} />
              </div>

              <select value={vehicleTypeFilter} onChange={(e) => setVehicleTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                <option value="">All types</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>

              <button onClick={() => { setStartDate(''); setEndDate(''); setVehicleTypeFilter(''); setSearchText(''); setTodayOnly(false); }} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'hsl(210 18% 89%)' }}>Clear</button>
            </div>
          </div>

          {/* List */}
          {filteredCompleted.length === 0 ? (
            <p className="text-slate-500">No completed orders match the selected filters.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {filteredCompleted.map((order) => (
                <div key={order.id} className="border rounded-2xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{order.queueNumber} — {order.plate}</h3>
                      <p className="text-sm text-slate-500">{order.vehicleType} • {formatDate(order.completedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button title="Delete" onClick={() => { setDeleteCount(1); setShowDeleteModal(true); }} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg">Delete completed orders</h3>
            <p className="text-sm text-slate-600 mt-2">This will permanently delete {deleteCount} completed order(s) older than {deleteThresholdDays} days. This action cannot be undone.</p>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: 'hsl(210 18% 89%)' }}>Cancel</button>
              <button onClick={confirmDeleteOld} disabled={deleteLoading} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'hsl(0 71% 50%)' }}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
