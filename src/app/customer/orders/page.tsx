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
      return 'bg-green-50 text-green-700 border-green-200';
    }

    if (status === 'In Progress' || status === 'in_progress') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }

    if (status === 'converted') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }

    return 'bg-amber-50 text-amber-700 border-amber-200';
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

    // Don't show wait time if work order is already completed or in progress
    const workOrderStatus = workOrder?.status?.toLowerCase() || '';
    if (workOrderStatus === 'completed' || workOrderStatus === 'in_progress') {
      return null;
    }

    const vehiclesAhead = Math.max(0, Number(workOrder?.queue_position || workOrder?.queuePosition || 1) - 1);
    
    if (vehiclesAhead === 0) return null;

    const targetMinutes = getTargetMinutes(workOrder);
    const totalWaitMinutes = targetMinutes * vehiclesAhead;

    // Calculate future time
    const futureMs = now + (totalWaitMinutes * 60 * 1000);
    const futureDate = new Date(futureMs);

    // Format as HH:MM
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
    // Only these statuses are considered active
    return status === 'pending' || status === 'converted' || status === 'in_progress';
  }

  function isOrderCompletedByCustomerOrder(order: any): boolean {
    const status = order.status?.toLowerCase() || '';
    // Check if order has been completed in customer_orders table
    return status === 'completed' || status === 'cancelled';
  }

  function isOrderCompletedByWorkOrder(order: any): boolean {
    const workOrderId = order.converted_work_order_id;
    const workOrder = workOrderId ? workOrders[String(workOrderId)] : null;
    
    if (!workOrder) return false;
    
    const workOrderStatus = workOrder?.status?.toLowerCase() || '';
    return workOrderStatus === 'completed';
  }

  function isOrderCompleted(order: any): boolean {
    // Order is considered completed if EITHER the customer_order OR work_order is completed
    return isOrderCompletedByCustomerOrder(order) || isOrderCompletedByWorkOrder(order);
  }

  function getFilteredOrders(): any[] {
    if (activeTab === 'active') {
      return orders.filter(order => isOrderActive(order) && !isOrderCompleted(order));
    } else {
      return orders.filter(order => isOrderCompleted(order));
    }
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
  const activeCount = orders.filter(o => isOrderActive(o) && !isOrderCompleted(o)).length;
  const historyCount = orders.filter(o => isOrderCompleted(o)).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6 py-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-32 h-20 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow">
              <img
                src="/kaklinx-logo.jpg"
                alt="Kaklinx Auto"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold">Live Order Tracking</h1>
              <p className="text-blue-100 mt-1">
                Track your request, job status, countdown, and past reviews.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/customer/orders/history"
              className="hidden sm:inline-flex bg-white/10 border border-white/20 text-white font-bold px-5 py-3 rounded-xl hover:bg-white/20"
            >
              Service History
            </Link>

            <Link
              href="/customer"
              className="hidden sm:inline-flex bg-white text-blue-950 font-bold px-5 py-3 rounded-xl hover:bg-blue-50"
            >
              New Order
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl shadow-xl border p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Enter Your Phone Number
          </h2>

          <p className="text-slate-500 text-sm mt-1">
            Use the same phone number you used when creating your order.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0240000000"
              className="flex-1 border rounded-xl px-4 py-3"
            />

            <button
              onClick={() => loadOrders()}
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl px-6 py-3"
            >
              {loading ? 'Checking...' : 'Check Orders'}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {errorMsg}
            </div>
          )}
        </div>

        {searched && orders.length > 0 && (
          <div className="mt-8">
            <div className="flex gap-4 border-b border-slate-200 bg-white rounded-t-2xl px-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-4 font-bold transition ${
                  activeTab === 'active'
                    ? 'text-blue-700 border-b-2 border-blue-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Orders ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-bold transition ${
                  activeTab === 'history'
                    ? 'text-blue-700 border-b-2 border-blue-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Order History ({historyCount})
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="bg-white rounded-3xl shadow border p-8 text-center">
              Loading your orders...
            </div>
          ) : searched && orders.length === 0 ? (
            <div className="bg-white rounded-3xl shadow border p-8 text-center">
              <h3 className="font-bold text-slate-900">No orders found</h3>
              <p className="text-slate-500 text-sm mt-1">
                We could not find any orders with this phone number.
              </p>
            </div>
          ) : searched && filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl shadow border p-8 text-center">
              <h3 className="font-bold text-slate-900">
                {activeTab === 'active' ? 'No active orders' : 'No order history'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
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
                    className="bg-white rounded-3xl shadow-xl border overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-slate-950 to-blue-950 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {order.vehicle_make || 'Vehicle'}{' '}
                          {order.vehicle_model || ''}
                        </h3>

                        <p className="text-blue-100 text-sm">
                          Plate: {order.license_plate || 'N/A'} •{' '}
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-bold border px-3 py-1 rounded-full ${getStatusStyle(
                          liveStatus
                        )}`}
                      >
                        {liveStatus}
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="grid md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Vehicle Type</p>
                          <p className="font-bold text-slate-900">
                            {order.vehicle_type}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Total Amount</p>
                          <p className="font-bold text-blue-700">
                            GHS {Number(order.total_amount || 0).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Work Order</p>
                          <p className="font-mono text-xs text-slate-700">
                            {workOrderId || 'Not assigned yet'}
                          </p>
                        </div>
                      </div>

                      {order.selected_services && order.selected_services.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-sm text-slate-500 mb-2">Services</p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(order.selected_services) ? order.selected_services : []).map((service: any, idx: number) => (
                              <span
                                key={idx}
                                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200"
                              >
                                {typeof service === 'string' ? service : service.serviceName || service.service_name || 'Service'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {workOrder && (
<div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5">
<div className="grid grid-cols-3 gap-4 text-center">
<div><p className="text-blue-100 text-sm">Queue Number</p><p className="text-3xl font-extrabold">{workOrder?.queue_number || workOrder?.queueNumber || '-'}</p></div>
<div><p className="text-blue-100 text-sm">Position</p><p className="text-3xl font-extrabold">#{workOrder?.queue_position || workOrder?.queuePosition || '-'}</p></div>
<div><p className="text-blue-100 text-sm">Vehicles Ahead</p><p className="text-3xl font-extrabold">{Math.max(0, Number(workOrder?.queue_position || workOrder?.queuePosition || 1)-1)}</p></div>
</div>
</div>)}

{workOrder && estimatedWait && (
                        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-2xl p-5">
                          <div className="flex justify-between gap-4">
                            <div>
                              <p className="text-sm text-purple-700 font-semibold">
                                Estimated Wait Time
                              </p>
                              <p className="text-3xl font-extrabold text-purple-900 mt-2">
                                {estimatedWait.minutes} mins
                              </p>
                              <p className="text-sm text-purple-600 mt-1">
                                Approx: {estimatedWait.timeFormat}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-purple-700 font-semibold">
                                Based On
                              </p>
                              <p className="text-lg font-bold text-purple-900 mt-2">
                                {estimatedWait.vehiclesAhead} vehicle{estimatedWait.vehiclesAhead !== 1 ? 's' : ''} ahead
                              </p>
                              <p className="text-xs text-purple-600 mt-1">
                                ~{getTargetMinutes(workOrder)} min per vehicle
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

{workOrder && countdown && (
                        <div className="mt-6 bg-slate-50 border rounded-2xl p-5">
                          <div className="flex justify-between gap-4">
                            <div>
                              <p className="text-sm text-slate-500">
                                {countdown.label}
                              </p>
                              <p
                                className={`text-4xl font-extrabold mt-1 ${
                                  countdown.overdue
                                    ? 'text-red-700'
                                    : 'text-blue-700'
                                }`}
                              >
                                {countdown.time}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-slate-500">
                                Target Time
                              </p>
                              <p className="font-bold text-slate-900">
                                {getTargetMinutes(workOrder)} mins
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                countdown.overdue ? 'bg-red-600' : 'bg-blue-600'
                              }`}
                              style={{ width: `${countdown.percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {workOrder?.customer_certified_at && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5">
                          <h4 className="font-bold text-green-800">
                            Your Review / Certification
                          </h4>

                          <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-green-700">Satisfaction</p>
                              <p className="font-bold text-slate-900">
                                {workOrder.customer_satisfaction || 'N/A'}
                              </p>
                            </div>

                            <div>
                              <p className="text-green-700">Rating</p>
                              <p className="font-bold text-slate-900">
                                {workOrder.customer_rating || 0}/5
                              </p>
                            </div>

                            <div>
                              <p className="text-green-700">Quality Passed</p>
                              <p className="font-bold text-slate-900">
                                {workOrder.quality_passed
                                  ? 'Yes'
                                  : 'No / Needs Attention'}
                              </p>
                            </div>
                          </div>

                          {workOrder.customer_comment && (
                            <p className="mt-3 text-sm text-slate-700">
                              "{workOrder.customer_comment}"
                            </p>
                          )}

                          <p className="mt-3 text-xs text-slate-500">
                            Certified on:{' '}
                            {new Date(
                              workOrder.customer_certified_at
                            ).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {!workOrder && order.status === 'converted' && (
                        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                          Your order has been converted. Live job details will appear once the job starts.
                        </div>
                      )}

                      {order.status !== 'converted' && !isCompleted && (
                        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
                          Your order has been received and is awaiting work order processing.
                        </div>
                      )}

                      {isCompleted && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                          ✓ This order has been completed.
                        </div>
                      )}

                      {isCompleted && (
                        <div className="mt-6">
                          <button
                            onClick={() => handleReorder(order)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                          >
                            🔄 Reorder This Service
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function CustomerOrdersTrackingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl border p-8">
            Loading live order tracking...
          </div>
        </main>
      }
    >
      <CustomerOrdersTrackingContent />
    </Suspense>
  );
}
