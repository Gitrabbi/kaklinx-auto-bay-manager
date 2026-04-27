'use client';
import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAppData } from '../../../context/AppDataContext';

export default function ServiceBreakdown() {
  const { workOrders } = useAppData();

  const today = new Date().toISOString().split('T')[0];

  const todaysOrders = workOrders.filter(order =>
    order.createdAt?.startsWith(today)
  );

  const serviceMap: Record<string, { count: number; revenue: number }> = {};

  todaysOrders.forEach(order => {
    const services = order.services || [];
    services.forEach(service => {
      if (!serviceMap[service]) {
        serviceMap[service] = { count: 0, revenue: 0 };
      }
      serviceMap[service].count += 1;
      serviceMap[service].revenue += Number(order.totalAmount || 0) / Math.max(services.length, 1);
    });
  });

  const maxCount = Math.max(...Object.values(serviceMap).map(s => s.count), 1);

  const serviceStats = Object.entries(serviceMap).map(([name, data]) => ({
    name,
    count: data.count,
    revenue: `GH₵ ${data.revenue.toFixed(2)}`,
    percentage: (data.count / maxCount) * 100,
  }));

  const statusSummary = [
    {
      label: 'Completed',
      count: todaysOrders.filter(o => o.status === 'Completed').length,
      icon: <CheckCircleIcon className="w-4 h-4" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
    },
    {
      label: 'In Progress',
      count: todaysOrders.filter(o => o.status === 'In Progress').length,
      icon: <ClockIcon className="w-4 h-4" />,
      color: 'text-blue-500',
      bg: 'bg-blue-100',
    },
    {
      label: 'Pending',
      count: todaysOrders.filter(o => o.status === 'Pending').length,
      icon: <ExclamationCircleIcon className="w-4 h-4" />,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
    },
    {
      label: 'Cancelled',
      count: todaysOrders.filter(o => o.status === 'Cancelled').length,
      icon: <XCircleIcon className="w-4 h-4" />,
      color: 'text-red-500',
      bg: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'hsl(215 25% 12%)' }}>
          Services Today
        </h2>

        {serviceStats.length === 0 ? (
          <p className="text-sm" style={{ color: 'hsl(215 10% 48%)' }}>
            No services recorded today.
          </p>
        ) : (
          <div className="space-y-3">
            {serviceStats.map(service => (
              <div key={service.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: 'hsl(215 25% 12%)' }}>
                    {service.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'hsl(215 10% 48%)' }}>
                      {service.count} jobs
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>
                      {service.revenue}
                    </span>
                  </div>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'hsl(210 18% 89%)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${service.percentage}%`,
                      backgroundColor: 'hsl(205 78% 42%)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'hsl(215 25% 12%)' }}>
          Order Status Summary
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {statusSummary.map(item => (
            <div key={item.label} className="rounded-xl p-4 border card-hover" style={{ borderColor: 'hsl(210 18% 89%)' }}>
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                <span className={item.color}>{item.icon}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'hsl(215 25% 12%)' }}>
                {item.count}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(215 10% 48%)' }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mt-4 rounded-lg p-3 text-xs"
          style={{
            backgroundColor: 'hsla(205, 78%, 42%, 0.08)',
            color: 'hsl(205 78% 42%)',
          }}
        >
          <span className="font-semibold">Tip:</span> {statusSummary[2].count} orders are pending assignment.
        </div>
      </div>
    </div>
  );
}
