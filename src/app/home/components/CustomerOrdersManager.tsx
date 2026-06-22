'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAppData } from '@/context/AppDataContext';

export default function CustomerOrdersManager() {
  const { workers, pricing, addWorkOrder } = useAppData();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<Record<string, string[]>>({});
  const [convertingId, setConvertingId] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('customer_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(`Error loading orders: ${error.message}`);
      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function getServiceNames(order: any) {
    return (order.selected_services || []).map((service: any) =>
      service.serviceName ||
      service.service_type ||
      service.serviceType ||
      service.name ||
      'Service'
    );
  }

  function calculateTargetMinutes(vehicleType: string, services: string[]) {
    return services.reduce((sum: number, serviceName: string) => {
      const priceRow = pricing.find(
        (p: any) =>
          p.vehicleType === vehicleType &&
          p.serviceType === serviceName
      );

      return sum + Number(priceRow?.recommendedMinutes || 0);
    }, 0);
  }

  function toggleWorker(orderId: string, workerId: string) {
    setSelectedWorkers((prev) => {
      const current = prev[orderId] || [];

      const updated = current.includes(workerId)
        ? current.filter((id) => id !== workerId)
        : [...current, workerId];

      return {
        ...prev,
        [orderId]: updated,
      };
    });
  }

  async function markAsReviewed(orderId: string) {
    const { error } = await supabase
      .from('customer_orders')
      .update({ status: 'reviewed' })
      .eq('id', orderId);

    if (!error) {
      setMessage('Order marked as reviewed.');
      loadOrders();
    } else {
      setMessage(`Error: ${error.message}`);
    }
  }

  async function convertToWorkOrder(order: any) {
    setMessage('');

    const assignedWorkerIds = selectedWorkers[order.id] || [];

    if (assignedWorkerIds.length === 0) {
      setMessage('Please assign at least one worker before converting.');
      return;
    }

    setConvertingId(order.id);

    const services = getServiceNames(order);
    const targetMinutes = calculateTargetMinutes(order.vehicle_type, services);

    const newWorkOrder = addWorkOrder({
      plate: order.license_plate || 'N/A',
      vehicleType: order.vehicle_type,
      services,
      status: 'Pending',
      assignedWorkers: assignedWorkerIds,
      notes: order.notes
        ? `Customer order request: ${order.notes}`
        : 'Created from customer online order request.',
      totalAmount: Number(order.total_amount || 0),
      additionalServiceDescription: '',
      additionalServiceCost: 0,
      discount: 0,
      closureStatus: 'open',
      targetMinutes: targetMinutes > 0 ? targetMinutes : 30,
      qualityPassed: true,
      extensionMinutes: 0,
      source:'customer_app',
    });

    const { error } = await supabase
      .from('customer_orders')
      .update({
        status: 'converted',
        converted_work_order_id: newWorkOrder.id,
      })
      .eq('id', order.id);

    if (error) {
      setMessage(`Work order created, but customer order status update failed: ${error.message}`);
      setConvertingId(null);
      return;
    }

    setMessage('Customer order converted to work order successfully.');
    setConvertingId(null);
    loadOrders();
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
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 text-sm">
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
          {orders.map((order) => {
            const isConverted = order.status === 'converted';

            return (
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

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full h-fit ${
                      isConverted
                        ? 'bg-green-50 text-green-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
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
                    <strong>Total:</strong> GHS{' '}
                    {Number(order.total_amount || 0).toFixed(2)}
                  </p>
                </div>

                <div className="mt-4">
                  <strong className="text-sm">Services:</strong>

                  <ul className="mt-2 space-y-1 text-sm">
                    {(order.selected_services || []).map(
                      (service: any, index: number) => (
                        <li
                          key={index}
                          className="flex justify-between border rounded-lg px-3 py-2"
                        >
                          <span>
                            {service.serviceName ||
                              service.service_type ||
                              service.serviceType ||
                              service.name ||
                              'Service'}
                          </span>

                          <span>
                            GHS {Number(service.price || 0).toFixed(2)}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {order.notes && (
                  <p className="mt-4 text-sm">
                    <strong>Notes:</strong> {order.notes}
                  </p>
                )}

                {!isConverted && (
                  <div className="mt-5 border rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-slate-800 mb-3">
                      Assign Worker(s)
                    </h4>

                    <div className="grid md:grid-cols-2 gap-2">
                      {workers.map((worker: any) => (
                        <label
                          key={worker.id}
                          className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(selectedWorkers[order.id] || []).includes(worker.id)}
                            onChange={() => toggleWorker(order.id, worker.id)}
                          />
                          {worker.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  {!isConverted && (
                    <>
                      <button
                        onClick={() => markAsReviewed(order.id)}
                        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold"
                      >
                        Mark Reviewed
                      </button>

                      <button
                        onClick={() => convertToWorkOrder(order)}
                        disabled={convertingId === order.id}
                        className="px-4 py-2 rounded-lg bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold"
                      >
                        {convertingId === order.id
                          ? 'Converting...'
                          : 'Convert to Work Order'}
                      </button>
                    </>
                  )}

                  {isConverted && (
                    <div className="text-sm text-green-700 font-semibold">
                      Converted to Work Order: {order.converted_work_order_id || 'Created'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
