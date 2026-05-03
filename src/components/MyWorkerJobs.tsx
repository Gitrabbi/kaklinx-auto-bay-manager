'use client';

import React from 'react';
import { useAppData } from '../../../context/AppDataContext';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function MyWorkerJobs() {
  const { workOrders } = useAppData();
  const { profile, loading } = useUserProfile();

  if (loading) {
    return <p>Loading your jobs...</p>;
  }

  const myJobs = workOrders.filter((order) =>
    order.assignedWorkers.includes(profile?.worker_id || '')
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-xl font-bold text-slate-900">My Jobs</h2>
        <p className="text-sm text-slate-500">
          Jobs assigned to you, including current and completed work.
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
                <th className="px-4 py-3 text-left">Plate</th>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Services</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Started</th>
                <th className="px-4 py-3 text-left">Completed</th>
              </tr>
            </thead>

            <tbody>
              {myJobs.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-3 font-mono">{order.id}</td>
                  <td className="px-4 py-3 font-semibold">{order.plate}</td>
                  <td className="px-4 py-3">{order.vehicleType}</td>
                  <td className="px-4 py-3">{order.services.join(', ')}</td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">
                    {order.startedAt
                      ? new Date(order.startedAt).toLocaleString()
                      : 'Not started'}
                  </td>
                  <td className="px-4 py-3">
                    {order.completedAt
                      ? new Date(order.completedAt).toLocaleString()
                      : 'Not completed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
