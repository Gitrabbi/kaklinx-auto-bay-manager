'use client';

import React from 'react';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  TrophyIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  subtitle: string;
}

function StatCard({
  label,
  value,
  icon,
  gradient,
  subtitle,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 ${gradient}`}
    >
      {/* Decorative Glow */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/80 font-semibold">
            {label}
          </p>

          <h3 className="mt-3 text-3xl font-extrabold">
            {value}
          </h3>

          <p className="mt-2 text-xs text-white/80">
            {subtitle}
          </p>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

      <StatCard
        label="Vehicles Today"
        value={String(todayOrders)}
        subtitle="Orders created today"
        icon={<ClipboardDocumentListIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-blue-600 to-cyan-500"
      />

      <StatCard
        label="Active Jobs"
        value={String(activeJobs)}
        subtitle="Currently being serviced"
        icon={<ClockIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-amber-500 to-orange-500"
      />

      <StatCard
        label="Revenue"
        value={todayRevenue}
        subtitle="Today's earnings"
        icon={<CurrencyDollarIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-emerald-500 to-green-600"
      />

      <StatCard
        label="Workers"
        value={String(activeWorkers)}
        subtitle="Available team members"
        icon={<UsersIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-violet-500 to-purple-700"
      />

      <StatCard
        label="Expenses"
        value={todayExpenditure}
        subtitle="Today's spending"
        icon={<BanknotesIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-rose-500 to-red-600"
      />

      <StatCard
        label="Profit / Loss"
        value={netProfitOrLoss}
        subtitle="Net business position"
        icon={<TrophyIcon className="w-7 h-7" />}
        gradient="bg-gradient-to-br from-teal-500 to-cyan-700"
      />
    </div>
  );
}
