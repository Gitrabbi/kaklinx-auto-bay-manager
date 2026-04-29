'use client';

import React from 'react';
import { useAppData } from '../../../context/AppDataContext';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function UtilitySummaryCards() {
  const { utilityLogs, workOrders } = useAppData();
  const today = todayISO();

  const electricity = utilityLogs.find((log: any) => log.logDate === today && log.utilityType === 'electricity');
  const water = utilityLogs.find((log: any) => log.logDate === today && log.utilityType === 'water');

  const completedOrders = workOrders.filter(
    (order: any) => order.status === 'Completed' && order.completedAt?.startsWith(today)
  ).length;

  const electricityUsed = Math.max(Number(electricity?.closingReading || 0) - Number(electricity?.openingReading || 0), 0);
  const electricityCost = Math.max(Number(electricity?.closingCost || 0) - Number(electricity?.openingCost || 0), 0);
  const waterUsed = Math.max(Number(water?.closingReading || 0) - Number(water?.openingReading || 0), 0);
  const waterCost = Math.max(Number(water?.closingCost || 0) - Number(water?.openingCost || 0), 0);
  const costPerOrder = completedOrders > 0 ? (electricityCost + waterCost) / completedOrders : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="bg-white rounded-xl border p-5"><p className="text-xs text-slate-500">Electricity Today</p><h2 className="text-xl font-bold mt-2">{electricityUsed.toFixed(2)} kWh</h2></div>
      <div className="bg-white rounded-xl border p-5"><p className="text-xs text-slate-500">Electricity Cost</p><h2 className="text-xl font-bold mt-2">GH₵ {electricityCost.toFixed(2)}</h2></div>
      <div className="bg-white rounded-xl border p-5"><p className="text-xs text-slate-500">Water Today</p><h2 className="text-xl font-bold mt-2">{waterUsed.toFixed(2)} L</h2></div>
      <div className="bg-white rounded-xl border p-5"><p className="text-xs text-slate-500">Water Cost</p><h2 className="text-xl font-bold mt-2">GH₵ {waterCost.toFixed(2)}</h2></div>
      <div className="bg-white rounded-xl border p-5"><p className="text-xs text-slate-500">Utility Cost / Order</p><h2 className="text-xl font-bold mt-2">GH₵ {costPerOrder.toFixed(2)}</h2></div>
    </div>
  );
}
