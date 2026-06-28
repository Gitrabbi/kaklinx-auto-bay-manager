'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';


function normalizePhone(phone: string) {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('233')) {
    cleaned = '0' + cleaned.slice(3);
  }

  if (!cleaned.startsWith('0') && cleaned.length === 9) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}


function CustomerOrdersTrackingContent() {
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<Record<string, any>>({});
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const phoneFromUrl = searchParams.get('phone');

    if (phoneFromUrl) {
      setPhone(phoneFromUrl);
      loadOrders(phoneFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!phone) return;

    const channel = supabase
      .channel('customer-live-tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_orders',
          filter: `phone=eq.${phone}`,
        },
        () => {
          loadOrders(phone);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
        },
        async (payload) => {
          const updated = payload.new as any;

          setWorkOrders((prev) => ({
            ...prev,
            [String(updated.id)]: updated,
          }));

          await loadOrders(phone);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [phone]);

  function getStatusStyle(status: string) {
    if (status === 'Completed' || status === 'completed') {
      return 'bg-green-500/20 text-green-300 border-green-400/50';
    }

    if (status === 'In Progress' || status === 'in_progress') {
      return 'bg-blue-500/20 text-blue-300 border-blue-400/50';
    }

    if (status === 'converted') {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50';
    }

    return 'bg-amber-500/20 text-amber-300 border-amber-400/50';
  }

  function getWorkOrderStatus(order: any) {
    const workOrderId = order.converted_work_order_id;
    const workOrder = workOrderId ? workOrders[String(workOrderId)] : null;

    return workOrder?.status || order.status;
  }

  function getStartedAt(workOrder: any) {
    return workOrder?.started_at || workOrder?.startedAt || null;
  }

  function getCompletedAt(workOrder: any) {
    return workOrder?.completed_at || workOrder?.completedAt || null;
  }

  function getTargetMinutes(workOrder: any) {
    return Number(workOrder?.target_minutes || workOrder?.targetMinutes || 30);
  }

  function getCountdown(workOrder: any) {
    if (!workOrder) return null;

    const startedAt = getStartedAt(workOrder);
    const completedAt = getCompletedAt(workOrder);
    const status = workOrder.status;

    if (!startedAt) return null;

    if (completedAt || status === 'Completed' || status === 'completed') {
      return {
        label: 'Completed',
        time: '00:00',
        percent: 100,
        overdue: false,
      };
    }

    const startMs = new Date(startedAt).getTime();
    const targetMs = getTargetMinutes(workOrder) * 60 * 1000;
    const elapsedMs = now - startMs;
    const remainingMs = targetMs - elapsedMs;

    const absMs = Math.abs(remainingMs);
    const minutes = Math.floor(absMs / 60000);
    const seconds = Math.floor((absMs % 60000) / 1000);

    const percent = Math.min(100, Math.max(0, (elapsedMs / targetMs) * 100));

    return {
      label: remainingMs >= 0 ? 'Estimated time remaining' : 'Extra time used',
      time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      percent,
      overdue: remainingMs < 0,
    };
  }

  function getEstimatedWaitTime(workOrder: any) {
    if (!workOrder) return null;

    const workOrderStatus = workOrder?.status?.toLowerCase() || '';
    if (workOrderStatus === 'completed' || workOrderStatus === 'in_progress') {
      return null;
    }

    const vehiclesAhead = Math.max(0, Number(workOrder?.queue_position || workOrder?.queuePosition || 1) - 1);
    
    if (vehiclesAhead === 0) return null;

    const targetMinutes = getTargetMinutes(workOrder);
    const totalWaitMinutes = targetMinutes * vehiclesAhead;

    const futureMs = now + (totalWaitMinutes * 60 * 1000);
    const futureDate = new Date(futureMs);

    const hours = String(futureDate.getHours()).padStart(2, '0');
    const minutes = String(futureDate.getMinutes()).padStart(2, '0');
    const timeFormat = `${hours}:${minutes}`;

    return {
      minutes: totalWaitMinutes,
      timeFormat: timeFormat,
      vehiclesAhead: vehiclesAhead,
    };
  }

  function isOrderActive(order: any): boolean {
    const status = order.status?.toLowerCase() || '';

    if (status === 'completed' || status === 'cancelled') return false;

    if (status === 'converted') {
      const workOrderId = order.converted_work_order_id;
      const workOrder = workOrderId ? workOrders[String(workOrderId)] : null;

      if (!workOrder) return false;

      const workOrderStatus = workOrder?.status?.toLowerCase() || '';
      const completedAt = workOrder?.completed_at || workOrder?.completedAt;

      if (workOrderStatus === 'completed' || completedAt) return false;

      return true;
    }

    return status === 'pending' || status === 'in_progress';
  }

  function isOrderCompletedByCustomerOrder(order: any): boolean {
    const status = order.status?.toLowerCase() || '';
    return status === 'completed' || status === 'cancelled';
  }

  function isOrderCompletedByWorkOrder(order: any): boolean {
    const workOrderId = order.converted_work_order_id;
    const workOrder = workOrderId ? workOrders[String(workOrderId)] : null;

    if (!workOrder) {
      const status = order.status?.toLowerCase() || '';
      return status === 'converted';
    }

    const workOrderStatus = workOrder?.status?.toLowerCase() || '';
    const completedAt = workOrder?.completed_at || workOrder?.completedAt;
    return workOrderStatus === 'completed' || !!completedAt;
  }

  function isOrderCompleted(order: any): boolean {
    return isOrderCompletedByCustomerOrder(order) || isOrderCompletedByWorkOrder(order);
  }

  function getFilteredOrders(): any[] {
    const nonDeleted = orders.filter(order => !order.customer_deleted_at);
    return activeTab === 'active'
      ? nonDeleted.filter(order => isOrderActive(order))
      : nonDeleted.filter(order => isOrderCompleted(order));
  }

  async function deleteOrder(orderId: string) {
    setDeletingOrderId(orderId);

    const { error } = await supabase
      .from('customer_orders')
      .update({ customer_deleted_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error('Delete order error:', error.message);
    } else {
      setOrders(prev => prev.map(o =>
        String(o.id) === orderId ? { ...o, customer_deleted_at: new Date().toISOString() } : o
      ));
    }

    setDeletingOrderId(null);
    setShowDeleteConfirm(null);
  }

  async function loadOrders(phoneNumber?: string) {
    const searchPhone = phoneNumber || phone;

    if (!searchPhone.trim()) {
      setErrorMsg('Please enter your phone number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSearched(true);

    const { data, error } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('phone', normalizePhone(searchPhone))
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setOrders([]);
      setLoading(false);
      return;
    }

    const foundOrders = data || [];
    setOrders(foundOrders);

    const workOrderIds = foundOrders
      .map((order: any) => order.converted_work_order_id)
      .filter(Boolean);

    if (workOrderIds.length > 0) {
      const { data: workOrderData } = await supabase
        .from('work_orders')
        .select('*')
        .in('id', workOrderIds);

      const mapped: Record<string, any> = {};

      (workOrderData || []).forEach((workOrder: any) => {
        mapped[String(workOrder.id)] = workOrder;
      });

      setWorkOrders(mapped);
    } else {
      setWorkOrders({});
    }

    setLoading(false);
  }

  function handleReorder(order: any) {
    const reorderData = {
      customerName: order.customer_name,
      phone: order.phone,
      email: order.email,
      vehicleMake: order.vehicle_make,
      vehicleModel: order.vehicle_model,
      licensePlate: order.license_plate,
      vehicleType: order.vehicle_type,
      selectedServices: order.selected_services || [],
      notes: `Reorder from order #${order.id}`,
    };

    localStorage.setItem('kaklinx_customer_order', JSON.stringify(reorderData));
    window.location.href = '/customer#order-form';
  }

  const filteredOrders = getFilteredOrders();
  const nonDeletedOrders = orders.filter(o => !o.customer_deleted_at);
  const activeCount = nonDeletedOrders.filter(o => isOrderActive(o)).length;
  const historyCount = nonDeletedOrders.filter(o => isOrderCompleted(o)).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/30 border-b border-white/5 shadow-lg">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-32 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg hover:bg-white/15 transition">
                <img
                  src="/kaklinx-logo.jpg"
                  alt="Kaklinx Auto"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-white drop-shadow">Live Order Tracking</h1>
            </div>

            <Link
              href="/customer"
              className="group flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition text-white font-bold shadow-lg hover:shadow-xl"
            >
              <span>← Back to Order</span>
            </Link>
          </div>
        </header>

        {/* Search Section */}
        <section className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-white drop-shadow">
              Enter Your Phone Number
            </h2>

            <p className="text-blue-200 text-sm mt-2">
              Use the same phone number you used when creating your order.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0240000000"
                className="flex-1 bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition"
              />

              <button
                onClick={() => loadOrders()}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl px-8 py-3 shadow-xl hover:shadow-2xl transition"
              >
                {loading ? '⏳ Checking...' : '🔍 Check Orders'}
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 bg-red-500/20 backdrop-blur border border-red-400/50 text-red-200 rounded-xl p-3 text-sm">
                ⚠️ {errorMsg}
              </div>
            )}
          </div>
        </section>

        {/* Tabs */}
        {searched && orders.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 mt-6">
            <div className="flex gap-4 border-b border-white/10 bg-white/5 backdrop-blur rounded-t-2xl px-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-4 font-bold transition ${
                  activeTab === 'active'
                    ? 'text-blue-300 border-b-2 border-blue-400'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                🚗 Active Orders ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-bold transition ${
                  activeTab === 'history'
                    ? 'text-blue-300 border-b-2 border-blue-400'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                ✅ Order History ({historyCount})
              </button>
            </div>

          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold text-white">Delete Order?</h3>
              <p className="text-blue-200 mt-2">
                This will remove the order from your view. This action cannot be undone.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteOrder(showDeleteConfirm)}
                  disabled={!!deletingOrderId}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-lg text-white transition font-bold shadow-lg"
                >
                  {deletingOrderId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Section */}
        <section className="max-w-5xl mx-auto px-6 pb-14">
          <div className="mt-8">
            {loading ? (
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl shadow-xl p-12 text-center">
                <div className="inline-flex items-center gap-2 text-blue-100">
                  <div className="animate-spin">⏳</div>
                  <span>Loading your orders...</span>
                </div>
              </div>
            ) : searched && orders.length === 0 ? (
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl shadow-xl p-12 text-center">
                <h3 className="font-bold text-white text-lg">No orders found</h3>
                <p className="text-blue-200 text-sm mt-2">
                  We could not find any orders with this phone number.
                </p>
              </div>
            ) : searched && filteredOrders.length === 0 ? (
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl shadow-xl p-12 text-center">
                <h3 className="font-bold text-white text-lg">
                  {activeTab === 'active' ? '🚗 No active orders' : '📋 No order history'}
                </h3>
                <p className="text-blue-200 text-sm mt-2">
                  {activeTab === 'active'
                    ? 'You have no active orders at the moment.'
                    : 'You have no completed orders in your history.'}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredOrders.map((order) => {
                  const workOrderId = order.converted_work_order_id;
                  const workOrder = workOrderId
                    ? workOrders[String(workOrderId)]
                    : null;

                  const liveStatus = getWorkOrderStatus(order);
                  const countdown = getCountdown(workOrder);
                  const estimatedWait = getEstimatedWaitTime(workOrder);
                  const isCompleted = isOrderCompleted(order);

                  return (
                    <div
                      key={order.id}
                      className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl shadow-xl overflow-hidden hover:bg-white/15 hover:border-white/30 transition"
                    >
                      <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 backdrop-blur px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10">
                        <div>
                          <h3 className="text-white font-bold text-lg drop-shadow">
                            {order.vehicle_make || 'Vehicle'}{' '}
                            {order.vehicle_model || ''}
                          </h3>

                          <p className="text-blue-200 text-sm">
                            Plate: {order.license_plate || 'N/A'} •{' '}
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>

                        <span
                          className={`text-xs font-bold border px-4 py-2 rounded-full backdrop-blur ${getStatusStyle(
                            liveStatus
                          )}`}
                        >
                          {liveStatus}
                        </span>
                      </div>

                      <div className="p-6 space-y-6">
                        <div className="grid md:grid-cols-5 gap-4 text-sm">
                          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3">
                            <p className="text-blue-200">Vehicle Type</p>
                            <p className="font-bold text-white">
                              {order.vehicle_type}
                            </p>
                          </div>

                          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3">
                            <p className="text-blue-200">Total Amount</p>
                            <p className="font-bold text-cyan-300">
                              GHS {Number(order.total_amount || 0).toFixed(2)}
                            </p>
                          </div>

                          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3">
                            <p className="text-blue-200">Work Order</p>
                            <p className="font-mono text-xs text-blue-300">
                              {workOrderId || 'Not assigned yet'}
                            </p>
                          </div>
                        </div>

                        {order.selected_services && order.selected_services.length > 0 && (
                          <div className="pt-2 border-t border-white/10">
                            <p className="text-sm text-blue-200 mb-3">Services</p>
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(order.selected_services) ? order.selected_services : []).map((service: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-400/50 backdrop-blur"
                                >
                                  {typeof service === 'string' ? service : service.serviceName || service.service_name || 'Service'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {workOrder && (
                          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur border border-blue-400/30 rounded-2xl p-5">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-blue-300 text-sm">Queue Number</p>
                                <p className="text-3xl font-extrabold text-white">{workOrder?.queue_number || workOrder?.queueNumber || '-'}</p>
                              </div>
                              <div>
                                <p className="text-blue-300 text-sm">Position</p>
                                <p className="text-3xl font-extrabold text-white">#{workOrder?.queue_position || workOrder?.queuePosition || '-'}</p>
                              </div>
                              <div>
                                <p className="text-blue-300 text-sm">Vehicles Ahead</p>
                                <p className="text-3xl font-extrabold text-white">{Math.max(0, Number(workOrder?.queue_position || workOrder?.queuePosition || 1)-1)}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {workOrder && estimatedWait && (
                          <div className="bg-purple-500/20 backdrop-blur border border-purple-400/30 rounded-2xl p-5">
                            <div className="flex justify-between gap-4">
                              <div>
                                <p className="text-sm text-purple-300 font-semibold">
                                  Estimated Wait Time
                                </p>
                                <p className="text-3xl font-extrabold text-purple-200 mt-2">
                                  {estimatedWait.minutes} mins
                                </p>
                                <p className="text-sm text-purple-300 mt-1">
                                  Approx: {estimatedWait.timeFormat}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-sm text-purple-300 font-semibold">
                                  Based On
                                </p>
                                <p className="text-lg font-bold text-purple-200 mt-2">
                                  {estimatedWait.vehiclesAhead} vehicle{estimatedWait.vehiclesAhead !== 1 ? 's' : ''} ahead
                                </p>
                                <p className="text-xs text-purple-300 mt-1">
                                  ~{getTargetMinutes(workOrder)} min per vehicle
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {workOrder && countdown && (
                          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
                            <div className="flex justify-between gap-4">
                              <div>
                                <p className="text-sm text-blue-200">
                                  {countdown.label}
                                </p>
                                <p
                                  className={`text-4xl font-extrabold mt-1 ${
                                    countdown.overdue
                                      ? 'text-red-400'
                                      : 'text-blue-300'
                                  }`}
                                >
                                  {countdown.time}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-sm text-blue-200">
                                  Target Time
                                </p>
                                <p className="font-bold text-white">
                                  {getTargetMinutes(workOrder)} mins
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  countdown.overdue ? 'bg-red-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                }`}
                                style={{ width: `${countdown.percent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {workOrder?.customer_certified_at && (
                          <div className="bg-green-500/20 backdrop-blur border border-green-400/30 rounded-2xl p-5">
                            <h4 className="font-bold text-green-300">
                              ✓ Your Review / Certification
                            </h4>

                            <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-green-300">Satisfaction</p>
                                <p className="font-bold text-white">
                                  {workOrder.customer_satisfaction || 'N/A'}
                                </p>
                              </div>

                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-green-300">Rating</p>
                                <p className="font-bold text-white">
                                  {workOrder.customer_rating || 0}/5
                                </p>
                              </div>

                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-green-300">Quality Passed</p>
                                <p className="font-bold text-white">
                                  {workOrder.quality_passed
                                    ? 'Yes ✓'
                                    : 'No / Needs Attention'}
                                </p>
                              </div>
                            </div>

                            {workOrder.customer_comment && (
                              <p className="mt-3 text-sm text-blue-200">
                                "{workOrder.customer_comment}"
                              </p>
                            )}

                            <p className="mt-3 text-xs text-blue-300">
                              Certified on:{' '}
                              {new Date(
                                workOrder.customer_certified_at
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {!workOrder && order.status === 'converted' && (
                          <div className="bg-cyan-500/20 backdrop-blur border border-cyan-400/30 rounded-xl p-4 text-sm text-cyan-300">
                            ⏳ Your order has been converted. Live job details will appear once the job starts.
                          </div>
                        )}

                        {order.status !== 'converted' && !isCompleted && (
                          <div className="bg-amber-500/20 backdrop-blur border border-amber-400/30 rounded-xl p-4 text-sm text-amber-300">
                            ⏱️ Your order has been received and is awaiting work order processing.
                          </div>
                        )}

                        {isCompleted && (
                          <div className="bg-green-500/20 backdrop-blur border border-green-400/30 rounded-xl p-4 text-sm text-green-300">
                            ✓ This order has been completed.
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                          {isCompleted && (
                            <button
                              onClick={() => handleReorder(order)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                            >
                              🔄 Reorder
                            </button>
                          )}

                          <button
                            onClick={() => setShowDeleteConfirm(String(order.id))}
                            disabled={deletingOrderId === String(order.id)}
                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 text-red-300 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                          >
                            🗑️ {deletingOrderId === String(order.id) ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CustomerOrdersTrackingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-12 text-center">
            <div className="inline-flex items-center gap-2 text-blue-100">
              <div className="animate-spin">⏳</div>
              <span className="text-lg font-semibold">Loading live order tracking...</span>
            </div>
          </div>
        </main>
      }
    >
      <CustomerOrdersTrackingContent />
    </Suspense>
  );
}
