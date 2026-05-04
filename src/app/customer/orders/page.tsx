'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CustomerOrdersTrackingPage() {
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const phoneFromUrl = searchParams.get('phone');

    if (phoneFromUrl) {
      setPhone(phoneFromUrl);
      loadOrders(phoneFromUrl);
    }
  }, [searchParams]);

  function getStatusStyle(status: string) {
    if (status === 'converted') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'reviewed') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
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
      .eq('phone', searchPhone.trim())
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

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
              <h1 className="text-3xl font-extrabold">Track Your Orders</h1>
              <p className="text-blue-100 mt-1">
                View your previous and current washing bay requests.
              </p>
            </div>
          </div>

          <Link
            href="/customer"
            className="hidden sm:inline-flex bg-white text-blue-950 font-bold px-5 py-3 rounded-xl hover:bg-blue-50"
          >
            New Order
          </Link>
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
          ) : (
            <div className="space-y-5">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl shadow-xl border overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-slate-950 to-blue-950 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {order.vehicle_make || 'Vehicle'} {order.vehicle_model || ''}
                      </h3>

                      <p className="text-blue-100 text-sm">
                        Plate: {order.license_plate || 'N/A'} •{' '}
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold border px-3 py-1 rounded-full ${getStatusStyle(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
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
                        <p className="text-slate-500">Order ID</p>
                        <p className="font-mono text-xs text-slate-700">
                          {order.id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="font-bold text-slate-900 mb-2">Services</p>

                      <div className="space-y-2">
                        {(order.selected_services || []).map(
                          (service: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between border rounded-xl px-4 py-3 text-sm"
                            >
                              <span>
                                {service.serviceName ||
                                  service.service_type ||
                                  service.serviceType ||
                                  service.name ||
                                  'Service'}
                              </span>

                              <span className="font-bold text-blue-700">
                                GHS {Number(service.price || 0).toFixed(2)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                      {order.status === 'pending' &&
                        'Your order has been received and is awaiting review.'}

                      {order.status === 'reviewed' &&
                        'Your order has been reviewed by our team.'}

                      {order.status === 'converted' &&
                        'Your order has been converted into a work order and is being processed.'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
                          }
