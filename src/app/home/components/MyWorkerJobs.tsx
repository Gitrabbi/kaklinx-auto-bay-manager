'use client';

import React from 'react';
import { useAppData } from '@/context/AppDataContext';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function MyWorkerJobs() {
  const { workOrders } = useAppData();
  const { profile, loading } = useUserProfile();

  if (loading) {
    return <p>Loading your jobs...</p>;
  }

  const workerId = profile?.worker_id;

  const myJobs = workOrders.filter((order: any) => {
    if (!workerId) return false;

    if (Array.isArray(order.assignedWorkers)) {
      return order.assignedWorkers.includes(workerId);
    }

    if (order.assignedTo) {
      return order.assignedTo === workerId;
    }

    return false;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-xl font-bold text-slate-900">My Jobs</h2>
        <p className="text-sm text-slate-500">
          Jobs currently assigned to you and jobs you have completed.
        </p>
      </div>

      {myJobs.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="font-semibold text-slate-700">No jobs assigned yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Services</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {myJobs.map((order: any) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-3 font-mono">{order.id}</td>
                  <td className="px-4 py-3">{order.customerName || 'N/A'}</td>
                  <td className="px-4 py-3">
                    {order.vehicleMake || order.vehicleType || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    {Array.isArray(order.services)
                      ? order.services.join(', ')
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-semibold">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
