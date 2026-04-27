'use client';
import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { useAppData } from '../../../context/AppDataContext';

export default function RevenueChart() {
  const { workOrders } = useAppData();

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const weeklyData = days.map(day => ({ day, amount: 0 }));

  const now = new Date();
  const currentDay = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - currentDay);
  weekStart.setHours(0, 0, 0, 0);

  workOrders
    .filter(order => order.status === 'Completed' && order.completedAt)
    .forEach(order => {
      const completedDate = new Date(order.completedAt!);
      if (completedDate >= weekStart && completedDate <= now) {
        const dayIndex = completedDate.getDay();
        weeklyData[dayIndex].amount += Number(order.totalAmount || 0);
      }
    });

  const maxAmount = Math.max(...weeklyData.map(d => d.amount), 1);
  const totalWeek = weeklyData.reduce((sum, d) => sum + d.amount, 0);

  const prevWeekTotal = 1;
  const percentChange = totalWeek > 0 ? '100.0' : '0.0';
  const isPositive = totalWeek >= prevWeekTotal;

  return (
    <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'hsl(210 18% 89%)' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>Weekly Revenue</h2>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(215 10% 48%)' }}>
            GH₵ {totalWeek.toLocaleString()} this week
          </p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
        }`}>
          {isPositive ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
          {isPositive ? '+' : ''}{percentChange}%
        </div>
      </div>

      <div className="flex items-end gap-2 h-32">
        {weeklyData.map((item, i) => {
          const heightPercent = (item.amount / maxAmount) * 100;
          const isToday = i === currentDay;

          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end" style={{ height: '100px' }}>
                <div
                  className="w-full rounded-t-md bar-grow"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: isToday ? 'hsl(205 78% 42%)' : 'hsl(205 78% 42% / 0.2)',
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
              <span className="text-[10px] font-medium" style={{ color: isToday ? 'hsl(205 78% 42%)' : 'hsl(215 10% 48%)' }}>
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
