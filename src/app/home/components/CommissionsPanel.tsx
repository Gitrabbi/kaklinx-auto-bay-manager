'use client';
import React from 'react';
import { ArrowTrendingUpIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface CommissionEntry {
  worker: string;
  initials: string;
  jobsCompleted: number;
  totalEarned: string;
  rate: string;
  trend: 'up' | 'down' | 'same';
}

const commissions: CommissionEntry[] = [
  { worker: 'Kofi Boateng', initials: 'KB', jobsCompleted: 8, totalEarned: 'GH₵ 96', rate: '15%', trend: 'up' },
  { worker: 'Abena Osei', initials: 'AO', jobsCompleted: 6, totalEarned: 'GH₵ 72', rate: '15%', trend: 'up' },
  { worker: 'Kwame Asante', initials: 'KA', jobsCompleted: 7, totalEarned: 'GH₵ 84', rate: '15%', trend: 'same' },
  { worker: 'Ama Mensah', initials: 'AM', jobsCompleted: 5, totalEarned: 'GH₵ 60', rate: '15%', trend: 'down' },
];

export default function CommissionsPanel() {
  const totalPayout = 'GH₵ 312';

  return (
    <div
      className="bg-white rounded-xl border p-5"
      style={{ borderColor: 'hsl(210 18% 89%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>
            Today&apos;s Commissions
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(215 10% 48%)' }}>
            Total payout: <span className="font-semibold" style={{ color: 'hsl(205 78% 42%)' }}>{totalPayout}</span>
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: 'hsla(160, 60%, 40%, 0.1)',
            color: 'hsl(160 60% 40%)',
          }}
        >
          <TrophyIcon className="w-3.5 h-3.5" />
          Commission Day
        </div>
      </div>

      {/* Commission table */}
      <div className="space-y-2">
        {commissions.map((entry, i) => (
          <div
            key={entry.worker}
            className="flex items-center gap-3 p-3 rounded-lg table-row-hover transition-colors"
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
              style={{
                backgroundColor: 'hsla(25, 95%, 53%, 0.15)',
                color: 'hsl(25 95% 53%)',
              }}
            >
              {entry.initials}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'hsl(215 25% 12%)' }}>
                {entry.worker}
              </p>
              <p className="text-xs" style={{ color: 'hsl(215 10% 48%)' }}>
                {entry.jobsCompleted} jobs &middot; {entry.rate} rate
              </p>
            </div>

            {/* Trend */}
            <div className="shrink-0">
              {entry.trend === 'up' && (
                <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
              )}
              {entry.trend === 'down' && (
                <ArrowTrendingUpIcon className="w-4 h-4 text-red-400 rotate-180" />
              )}
              {entry.trend === 'same' && (
                <div className="w-4 h-0.5 rounded" style={{ backgroundColor: 'hsl(215 10% 48%)' }} />
              )}
            </div>

            {/* Earned */}
            <div
              className="text-sm font-bold shrink-0"
              style={{ color: 'hsl(215 25% 12%)' }}
            >
              {entry.totalEarned}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
