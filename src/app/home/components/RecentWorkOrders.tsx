'use client';
import React from 'react';
import { TruckIcon } from '@heroicons/react/24/outline';


interface WorkOrder {
  id: string;
  plate: string;
  vehicleType: string;
  services: string[];
  status: 'Completed' | 'In Progress' | 'Pending' | 'Cancelled';
  time?: string;
}

const statusConfig = {
  Completed: { className: 'badge-completed', label: 'Completed' },
  'In Progress': { className: 'badge-in-progress', label: 'In Progress' },
  Pending: { className: 'badge-pending', label: 'Pending' },
  Cancelled: { className: 'badge-cancelled', label: 'Cancelled' },
};

const workOrders: WorkOrder[] = [
  {
    id: 'WO-001',
    plate: 'GR 1234-24',
    vehicleType: 'Saloon - Medium',
    services: ['Body Wash', 'Under Wash', 'Engine Wash'],
    status: 'Completed',
    time: '08:30 AM',
  },
  {
    id: 'WO-002',
    plate: 'AS 5678-23',
    vehicleType: 'SUV - Large',
    services: ['Body Wash', 'Interior Clean'],
    status: 'In Progress',
    time: '09:15 AM',
  },
  {
    id: 'WO-003',
    plate: 'BA 9012-22',
    vehicleType: 'Pickup - Large',
    services: ['Body Wash', 'Wax Polish'],
    status: 'Completed',
    time: '10:00 AM',
  },
  {
    id: 'WO-004',
    plate: 'GH 3456-24',
    vehicleType: 'Saloon - Small',
    services: ['Body Wash'],
    status: 'Pending',
    time: '10:45 AM',
  },
  {
    id: 'WO-005',
    plate: 'ER 7890-21',
    vehicleType: 'Minivan - Medium',
    services: ['Body Wash', 'Under Wash'],
    status: 'Completed',
    time: '11:20 AM',
  },
];

export default function RecentWorkOrders() {
  const todayCount = workOrders.filter((o) => o.status === 'Completed').length;

  return (
    <div
      className="bg-white rounded-xl border"
      style={{ borderColor: 'hsl(210 18% 89%)' }}
    >
      {/* Header */}
      <div
        className="p-5 border-b flex items-center justify-between"
        style={{ borderColor: 'hsl(210 18% 89%)' }}
      >
        <h2 className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>
          Recent Work Orders
        </h2>
        <span className="text-xs" style={{ color: 'hsl(215 10% 48%)' }}>
          {todayCount} completed today
        </span>
      </div>

      {/* List */}
      <div className="divide-y" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        {workOrders.map((order) => {
          const status = statusConfig[order.status];
          return (
            <div
              key={order.id}
              className="px-5 py-3.5 flex items-center gap-4 table-row-hover transition-colors cursor-pointer"
            >
              {/* Car icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'hsla(205, 78%, 42%, 0.1)' }}
              >
                <TruckIcon className="w-4 h-4" style={{ color: 'hsl(205 78% 42%)' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'hsl(215 25% 12%)' }}
                >
                  {order.plate} — {order.vehicleType}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'hsl(215 10% 48%)' }}
                >
                  {order.services.join(', ')}
                </p>
              </div>

              {/* Time */}
              {order.time && (
                <span
                  className="text-xs hidden sm:block shrink-0"
                  style={{ color: 'hsl(215 10% 48%)' }}
                >
                  {order.time}
                </span>
              )}

              {/* Status badge */}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
