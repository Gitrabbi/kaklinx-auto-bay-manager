'use client';
import React from 'react';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-xl border p-5 relative overflow-hidden card-hover"
      style={{ borderColor: 'hsl(210 18% 89%)' }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className="text-sm font-medium"
            style={{ color: 'hsl(215 10% 48%)' }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: 'hsl(215 25% 12%)' }}
          >
            {value}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'hsla(205, 78%, 42%, 0.1)', color: 'hsl(205 78% 42%)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

interface StatsGridProps {
  todayOrders: number;
  activeJobs: number;
  todayRevenue: string;
  activeWorkers: number;
}

export default function StatsGrid({ todayOrders, activeJobs, todayRevenue, activeWorkers }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      <StatCard
        label="Today's Orders"
        value={String(todayOrders)}
        icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
      />
      <StatCard
        label="Active Jobs"
        value={String(activeJobs)}
        icon={<ClockIcon className="w-5 h-5" />}
      />
      <StatCard
        label="Today's Revenue"
        value={todayRevenue}
        icon={<CurrencyDollarIcon className="w-5 h-5" />}
      />
      <StatCard
        label="Active Workers"
        value={String(activeWorkers)}
        icon={<UsersIcon className="w-5 h-5" />}
      />
    </div>
  );
}
