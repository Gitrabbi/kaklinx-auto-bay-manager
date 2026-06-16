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


function ServiceHistoryContent() {
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const phoneFromUrl = searchParams.get('phone');

    if (phoneFromUrl) {
      setPhone(phoneFromUrl);
      loadOrderHistory(phoneFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!phone) return;

    const channel = supabase
      .channel('customer-history')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_orders',
          filter: `phone=eq.${phone}`,
        },
        () => {
          loadOrderHistory(phone);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [phone]);

  async function loadOrderHistory(phoneNumber?: string) {
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

  function getCompletedOrders(): any[] {
    return orders.filter(order => {
      const status = order.status;
      return status === 'completed' || status === 'Completed' || status === 'cancelled' || status === 'Cancelled';
    });
  }

  function calculateMetrics() {
    const completedOrders = getCompletedOrders();
    
    let totalSpent = 0;
    let totalRating = 0;
    let ratedOrders = 0;
    const serviceFrequency: Record<string, number> = {};

    completedOrders.forEach((order: any) => {
      totalSpent += Number(order.total_amount || 0);

      // Count services
      if (order.selected_services && Array.isArray(order.selected_services)) {
        order.selected_services.forEach((service: any) => {
          const serviceName = typeof service === 'string' ? service : service.serviceName || service.service_name || 'Service';
          serviceFrequency[serviceName] = (serviceFrequency[serviceName] || 0) + 1;
        });
      }

      // Calculate average rating
      const workOrderId = order.converted_work_order_id;
      const workOrder = workOrderId ? workOrders[String(workOrderId)] : null;
      if (workOrder?.customer_rating) {
        totalRating += Number(workOrder.customer_rating);
        ratedOrders += 1;
      }
    });

    const favoriteServices = Object.entries(serviceFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);

    const averageRating = ratedOrders > 0 ? (totalRating / ratedOrders).toFixed(1) : 'N/A';

    return {
      totalOrders: completedOrders.length,
      totalSpent: totalSpent.toFixed(2),
      averageRating,
      favoriteServices,
    };
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

  const completedOrders = getCompletedOrders();
  const metrics = calculateMetrics();

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
              <h1 className="text-3xl font-extrabold">Service History</h1>
              <p className="text-blue-100 mt-1">
                View your past orders, ratings, and service insights.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/customer/orders"
              className="hidden sm:inline-flex bg-white/10 border border-white/20 text-white font-bold px-5 py-3 rounded-xl hover:bg-white/20"
            >
              Track Orders
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
              onClick={() => loadOrderHistory()}
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl px-6 py-3"
            >
              {loading ? 'Loading...' : 'View History'}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {errorMsg}
            </div>
          )}
        </div>

        {searched && completedOrders.length > 0 && (
          <>
            {/* Metrics Dashboard */}
            <div className="mt-10 grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
                <p className="text-blue-100 text-sm font-semibold">Total Orders</p>
                <p className="text-4xl font-extrabold mt-2">{metrics.totalOrders}</p>
                <p className="text-blue-100 text-xs mt-1">Completed services</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
                <p className="text-green-100 text-sm font-semibold">Total Spent</p>
                <p className="text-4xl font-extrabold mt-2">GHS {metrics.totalSpent}</p>
                <p className="text-green-100 text-xs mt-1">Lifetime investment</p>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg">
                <p className="text-amber-100 text-sm font-semibold">Average Rating</p>
                <p className="text-4xl font-extrabold mt-2">{metrics.averageRating}/5</p>
                <p className="text-amber-100 text-xs mt-1">Customer satisfaction</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
                <p className="text-purple-100 text-sm font-semibold">Favorite Services</p>
                <div className="mt-2 space-y-1">
                  {metrics.favoriteServices.length > 0 ? (
                    metrics.favoriteServices.map((service: string, idx: number) => (
                      <p key={idx} className="text-sm font-semibold truncate">
                        {idx + 1}. {service}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm">No data yet</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-10">
          {loading ? (
            <div className="bg-white rounded-3xl shadow border p-8 text-center">
              Loading your service history...
            </div>
          ) : searched && orders.length === 0 ? (
            <div className="bg-white rounded-3xl shadow border p-8 text-center">
              <h3 className="font-bold text-slate-900">No service history</h3>
              <p className="text-slate-500 text-sm mt-1">
                We could not find any orders with this phone number.
              </p>
            </div>
          ) : searched && completedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl shadow border p-8 text-center">
              <h3 className="font-bold text-slate-900">No completed orders</h3>
              <p className="text-slate-500 text-sm mt-1">
                You have no completed orders in your history yet.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-slate-900">Order History</h3>
              {completedOrders.map((order) => {
                const workOrderId = order.converted_work_order_id;
                const workOrder = workOrderId
                  ? workOrders[String(workOrderId)]
                  : null;

                const completedAt = workOrder?.completed_at || workOrder?.completedAt;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl shadow border overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {order.vehicle_make || 'Vehicle'} {order.vehicle_model || ''}
                        </h3>
                        <p className="text-slate-600 text-sm">
                          Plate: {order.license_plate || 'N/A'} • Order #: {order.id}
                        </p>
                      </div>

                      <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-3 py-1 rounded-full">
                        ✓ Completed
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-slate-500">Date Completed</p>
                          <p className="font-bold text-slate-900 mt-1">
                            {completedAt
                              ? new Date(completedAt).toLocaleDateString()
                              : new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Vehicle Type</p>
                          <p className="font-bold text-slate-900 mt-1">
                            {order.vehicle_type}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Total Amount Paid</p>
                          <p className="font-bold text-green-700 mt-1 text-lg">
                            GHS {Number(order.total_amount || 0).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Service Duration</p>
                          <p className="font-bold text-slate-900 mt-1">
                            {workOrder ? `${Number(workOrder?.target_minutes || workOrder?.targetMinutes || 30)} mins` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Services Provided */}
                      {order.selected_services && order.selected_services.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-sm text-slate-600 font-semibold mb-2">Services Provided</p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(order.selected_services) ? order.selected_services : []).map((service: any, idx: number) => {
                              const serviceName = typeof service === 'string' ? service : service.serviceName || service.service_name || 'Service';
                              const servicePrice = typeof service === 'string' ? null : service.price || 0;
                              return (
                                <span
                                  key={idx}
                                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium border border-blue-200"
                                >
                                  {serviceName}
                                  {servicePrice ? ` (GHS ${Number(servicePrice).toFixed(2)})` : ''}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Customer Rating and Review */}
                      {workOrder?.customer_certified_at && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-sm text-slate-600 font-semibold mb-3">Your Rating & Review</p>
                          
                          <div className="grid md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-slate-500">Satisfaction</p>
                              <p className="font-bold text-slate-900 mt-1">
                                {workOrder.customer_satisfaction || 'N/A'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">Rating</p>
                              <div className="flex gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-xl ${
                                      i < Math.floor(Number(workOrder.customer_rating || 0))
                                        ? 'text-yellow-400'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">Quality Check</p>
                              <p className="font-bold text-slate-900 mt-1">
                                {workOrder.quality_passed ? '✅ Passed' : '⚠️ Needs Attention'}
                              </p>
                            </div>
                          </div>

                          {workOrder.customer_comment && (
                            <div className="bg-slate-50 rounded-lg p-3 mt-2 border border-slate-200">
                              <p className="text-sm italic text-slate-700">
                                "{workOrder.customer_comment}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Notes */}
                      {order.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-sm text-slate-600 font-semibold mb-2">Order Notes</p>
                          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                            {order.notes}
                          </p>
                        </div>
                      )}

                      {/* Reorder Button */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <button
                          onClick={() => handleReorder(order)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                        >
                          🔄 Reorder This Service
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
    </main>
  );
}

export default function ServiceHistoryPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl border p-8">
            Loading service history...
          </div>
        </main>
      }
    >
      <ServiceHistoryContent />
    </Suspense>
  );
}
