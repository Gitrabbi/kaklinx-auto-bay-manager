'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CustomerOrdersManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from('customer_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function markAsReviewed(orderId: string) {
    const { error } = await supabase
      .from('customer_orders')
      .update({ status: 'reviewed' })
      .eq('id', orderId);

    if (!error) {
      setMessage('Order marked as reviewed.');
      loadOrders();
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-xl font-bold text-slate-900">
          Customer Order Requests
        </h2>
        <p className="text-sm text-slate-500">
          Online requests submitted from the customer portal.
        </p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {message}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border p-6">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border p-6">
          No customer orders yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {order.customer_name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {order.phone} {order.email ? `• ${order.email}` : ''}
                  </p>
                </div>

                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full h-fit">
                  {order.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
                <p>
                  <strong>Vehicle:</strong>{' '}
                  {order.vehicle_make || 'N/A'} {order.vehicle_model || ''}
                </p>
                <p>
                  <strong>Plate:</strong> {order.license_plate || 'N/A'}
                </p>
                <p>
                  <strong>Vehicle Type:</strong> {order.vehicle_type}
                </p>
                <p>
                  <strong>Total:</strong> GHS {Number(order.total_amount || 0).toFixed(2)}
                </p>
              </div>

              <div className="mt-4">
                <strong className="text-sm">Services:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {(order.selected_services || []).map((service: any, index: number) => (
                    <li key={index} className="flex justify-between border rounded-lg px-3 py-2">
                      <span>{service.serviceName}</span>
                      <span>GHS {Number(service.price || 0).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {order.notes && (
                <p className="mt-4 text-sm">
                  <strong>Notes:</strong> {order.notes}
                </p>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => markAsReviewed(order.id)}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold"
                >
                  Mark Reviewed
                </button>

                <button
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
                >
                  Convert to Work Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
                  }
