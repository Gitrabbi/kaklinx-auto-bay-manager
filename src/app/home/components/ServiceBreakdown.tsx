'use client';
import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface ServiceStat {
  name: string;
  count: number;
  revenue: string;
  percentage: number;
  color: string;
}

const serviceStats: ServiceStat[] = [
  { name: 'Body Wash', count: 42, revenue: 'GH₵ 840', percentage: 78, color: 'hsl(205 78% 42%)' },
  { name: 'Under Wash', count: 28, revenue: 'GH₵ 560', percentage: 52, color: 'hsl(25 95% 53%)' },
  { name: 'Engine Wash', count: 15, revenue: 'GH₵ 450', percentage: 28, color: 'hsl(160 60% 40%)' },
  { name: 'Interior Clean', count: 19, revenue: 'GH₵ 570', percentage: 35, color: 'hsl(280 55% 55%)' },
  { name: 'Wax Polish', count: 8, revenue: 'GH₵ 320', percentage: 15, color: 'hsl(340 70% 55%)' },
];

const statusSummary = [
  { label: 'Completed', count: 38, icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { label: 'In Progress', count: 5, icon: <ClockIcon className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-100' },
  { label: 'Pending', count: 9, icon: <ExclamationCircleIcon className="w-4 h-4" />, color: 'text-amber-500', bg: 'bg-amber-100' },
  { label: 'Cancelled', count: 2, icon: <XCircleIcon className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-100' },
];

export default function ServiceBreakdown() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Service stats */}
      <div
        className="bg-white rounded-xl border p-5"
        style={{ borderColor: 'hsl(210 18% 89%)' }}
      >
        <h2 className="font-semibold mb-4" style={{ color: 'hsl(215 25% 12%)' }}>
          Services Today
        </h2>
        <div className="space-y-3">
          {serviceStats.map((service) => (
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
              <div
                className="w-full rounded-full h-1.5"
                style={{ backgroundColor: 'hsl(210 18% 89%)' }}
              >
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${service.percentage}%`,
                    backgroundColor: service.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status summary */}
      <div
        className="bg-white rounded-xl border p-5"
        style={{ borderColor: 'hsl(210 18% 89%)' }}
      >
        <h2 className="font-semibold mb-4" style={{ color: 'hsl(215 25% 12%)' }}>
          Order Status Summary
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {statusSummary.map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-4 border card-hover"
              style={{ borderColor: 'hsl(210 18% 89%)' }}
            >
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                <span className={item.color}>{item.icon}</span>
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: 'hsl(215 25% 12%)' }}
              >
                {item.count}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'hsl(215 10% 48%)' }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Quick note */}
        <div
          className="mt-4 rounded-lg p-3 text-xs"
          style={{
            backgroundColor: 'hsla(205, 78%, 42%, 0.08)',
            color: 'hsl(205 78% 42%)',
          }}
        >
          <span className="font-semibold">Tip:</span> 9 orders are pending assignment. Assign workers to keep the queue moving.
        </div>
      </div>
    </div>
  );
}
