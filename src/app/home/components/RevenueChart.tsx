'use client';
import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface RevenueData {
  day: string;
  amount: number;
}

const weeklyData: RevenueData[] = [
  { day: 'Mon', amount: 420 },
  { day: 'Tue', amount: 680 },
  { day: 'Wed', amount: 540 },
  { day: 'Thu', amount: 790 },
  { day: 'Fri', amount: 920 },
  { day: 'Sat', amount: 1140 },
  { day: 'Sun', amount: 860 },
];

const maxAmount = Math.max(...weeklyData.map((d) => d.amount));

export default function RevenueChart() {
  const totalWeek = weeklyData.reduce((sum, d) => sum + d.amount, 0);
  const prevWeekTotal = 4820;
  const percentChange = (((totalWeek - prevWeekTotal) / prevWeekTotal) * 100).toFixed(1);
  const isPositive = totalWeek >= prevWeekTotal;

  return (
    <div
      className="bg-white rounded-xl border p-5"
      style={{ borderColor: 'hsl(210 18% 89%)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>
            Weekly Revenue
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(215 10% 48%)' }}>
            GH₵ {totalWeek.toLocaleString()} this week
          </p>
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isPositive ? (
            <ArrowTrendingUpIcon className="w-3 h-3" />
          ) : (
            <ArrowTrendingDownIcon className="w-3 h-3" />
          )}
          {isPositive ? '+' : ''}{percentChange}%
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-32">
        {weeklyData.map((item, i) => {
          const heightPercent = (item.amount / maxAmount) * 100;
          const isToday = i === 5; // Saturday highlighted
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end" style={{ height: '100px' }}>
                <div
                  className="w-full rounded-t-md bar-grow"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: isToday
                      ? 'hsl(205 78% 42%)'
                      : 'hsl(205 78% 42% / 0.2)',
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isToday ? 'hsl(205 78% 42%)' : 'hsl(215 10% 48%)' }}
              >
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
