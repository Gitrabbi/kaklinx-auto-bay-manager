'use client';

import React from 'react';
import { useAppData } from '@/context/AppDataContext';
import {
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';

export default function QueueManager() {
  const { workOrders, workers } = useAppData();

  const pendingOrders = [...workOrders]
    .filter((wo) => wo.status === 'Pending')
    .sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0));

  const activeOrders = workOrders.filter(
    (wo) => wo.status === 'In Progress'
  );

  const completedToday = workOrders.filter(
    (wo) =>
      wo.status === 'Completed' &&
      wo.completedAt?.startsWith(new Date().toISOString().split('T')[0])
  );

  const averageWait =
    pendingOrders.length > 0
      ? Math.round(
          pendingOrders.reduce(
            (sum, wo) => sum + (wo.targetMinutes || 20),
            0
          ) / pendingOrders.length
        )
      : 0;

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
                {completedToday.length}
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
    </div>
  );
}
