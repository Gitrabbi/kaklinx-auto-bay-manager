'use client';

import React from 'react';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  TrophyIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: string;
}

function StatCard({
  label,
  value,
  icon,
  gradient,
  trend,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 ${gradient}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-white/80">
            {label}
          </p>

          <h2 className="mt-3 text-3xl font-extrabold">
            {value}
          </h2>

          {trend && (
            <span className="inline-flex mt-3 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur">
              {trend}
            </span>
          )}
        </div>

        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
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
  todayExpenditure: string;
  netProfitOrLoss: string;
}

export default function StatsGrid({
  todayOrders,
  activeJobs,
  todayRevenue,
  activeWorkers,
  todayExpenditure,
  netProfitOrLoss,
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-5">

      <StatCard
        label="Vehicles Today"
        value={String(todayOrders)}
        icon={<ClipboardDocumentListIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-blue-600 to-blue-900"
        trend="+ Daily Orders"
      />

      <StatCard
        label="Active Jobs"
        value={String(activeJobs)}
        icon={<ClockIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-amber-500 to-orange-700"
        trend="Currently Running"
      />

      <StatCard
        label="Revenue"
        value={todayRevenue}
        icon={<CurrencyDollarIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-emerald-500 to-green-800"
        trend="Income"
      />

      <StatCard
        label="Workers"
        value={String(activeWorkers)}
        icon={<UsersIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-purple-500 to-indigo-800"
        trend="Available"
      />

      <StatCard
        label="Expenses"
        value={todayExpenditure}
        icon={<FireIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-red-500 to-rose-800"
        trend="Daily Cost"
      />

      <StatCard
        label="Profit / Loss"
        value={netProfitOrLoss}
        icon={<TrophyIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-cyan-500 to-blue-900"
        trend="Net Position"
      />

    </div>
  );
}
