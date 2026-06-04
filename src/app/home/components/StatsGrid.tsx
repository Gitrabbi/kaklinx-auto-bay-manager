'use client';

import React from 'react';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  TrophyIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: string;
}

function StatCard({
  label,
  value,
  icon,
  color,
  bgColor,
  trend,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, ${color}, transparent)`,
        }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>

            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {value}
            </h3>

            {trend && (
              <div className="mt-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: bgColor,
                    color,
                  }}
                >
                  {trend}
                </span>
              </div>
            )}
          </div>

          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: bgColor,
              color,
            }}
          >
            {icon}
          </div>
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
        color="#0F4C81"
        bgColor="rgba(15,76,129,0.12)"
        trend="+ Today"
      />

      <StatCard
        label="Active Jobs"
        value={String(activeJobs)}
        icon={<ClockIcon className="w-7 h-7" />}
        color="#F59E0B"
        bgColor="rgba(245,158,11,0.12)"
        trend="In Progress"
      />

      <StatCard
        label="Revenue"
        value={todayRevenue}
        icon={<CurrencyDollarIcon className="w-7 h-7" />}
        color="#22C55E"
        bgColor="rgba(34,197,94,0.12)"
        trend="Today's Income"
      />

      <StatCard
        label="Workers"
        value={String(activeWorkers)}
        icon={<UsersIcon className="w-7 h-7" />}
        color="#8B5CF6"
        bgColor="rgba(139,92,246,0.12)"
        trend="Available"
      />

      <StatCard
        label="Expenses"
        value={todayExpenditure}
        icon={<CurrencyDollarIcon className="w-7 h-7" />}
        color="#EF4444"
        bgColor="rgba(239,68,68,0.12)"
        trend="Today's Cost"
      />

      <StatCard
        label="Profit / Loss"
        value={netProfitOrLoss}
        icon={<TrophyIcon className="w-7 h-7" />}
        color="#14B8A6"
        bgColor="rgba(20,184,166,0.12)"
        trend="Net Position"
      />

    </div>
  );
}
