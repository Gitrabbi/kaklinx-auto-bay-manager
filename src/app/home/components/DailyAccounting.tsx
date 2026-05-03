'use client';
import React from 'react';
import { useAppData } from '../../../context/AppDataContext';

export default function DailyAccounting() {
  const { workOrders, workers } = useAppData();
  const { workOrders, workers, expenditures, getTodayExpenditure } = useAppData();

  const today = new Date().toISOString().split('T')[0];

  const todaysOrders = workOrders.filter(order =>
    order.createdAt?.startsWith(today)
  );

  const completedOrders = todaysOrders.filter(order => order.status === 'Completed');

  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  const pendingAmount = todaysOrders
    .filter(order => order.status !== 'Completed' && order.status !== 'Cancelled')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

  const totalOrders = todaysOrders.length;
  const completedCount = completedOrders.length;
  const pendingCount = todaysOrders.filter(order => order.status === 'Pending').length;
  const inProgressCount = todaysOrders.filter(order => order.status === 'In Progress').length;
  const todaysExpenditures = expenditures.filter(item => item.date === today);
  const totalExpenditure = getTodayExpenditure();
  const netProfitOrLoss = totalRevenue - totalExpenditure;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-500">Today&apos;s Revenue</p>
          <h2 className="text-2xl font-bold mt-2">GH₵ {totalRevenue.toFixed(2)}</h2>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-500">Pending Amount</p>
          <h2 className="text-2xl font-bold mt-2">GH₵ {pendingAmount.toFixed(2)}</h2>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-500">Orders Today</p>
          <h2 className="text-2xl font-bold mt-2">{totalOrders}</h2>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-500">Active Workers</p>
          <h2 className="text-2xl font-bold mt-2">
            {workers.filter(w => w.status === 'active').length}
          </h2>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-500">Daily Expenditure</p>
          <h2 className="text-2xl font-bold mt-2">GH₵ {totalExpenditure.toFixed(2)}</h2>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-500">Profit / Loss</p>
          <h2 className={`text-2xl font-bold mt-2 ${netProfitOrLoss < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            GH₵ {netProfitOrLoss.toFixed(2)}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Daily Order Accounting</h2>

        {todaysOrders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders recorded today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-3">Order ID</th>
                  <th>Plate</th>
                  <th>Vehicle</th>
                  <th>Services</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {todaysOrders.map(order => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 font-medium">{order.id}</td>
                    <td>{order.plate}</td>
                    <td>{order.vehicleType}</td>
                    <td>{order.services?.join(', ')}</td>
                    <td>{order.status}</td>
                    <td className="text-right font-semibold">
                      GH₵ {Number(order.totalAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Today&apos;s Expenditure Entries</h2>
        {todaysExpenditures.length === 0 ? (
          <p className="text-sm text-slate-500">No expenditures recorded today.</p>
        ) : (
          <div className="space-y-2">
            {todaysExpenditures.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <p className="text-sm font-semibold">GH₵ {Number(item.amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Today&apos;s Status Summary</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-xs text-emerald-700">Completed</p>
            <h3 className="text-xl font-bold text-emerald-800">{completedCount}</h3>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-xs text-blue-700">In Progress</p>
            <h3 className="text-xl font-bold text-blue-800">{inProgressCount}</h3>
          </div>

          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-xs text-amber-700">Pending</p>
            <h3 className="text-xl font-bold text-amber-800">{pendingCount}</h3>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-700">Total Orders</p>
            <h3 className="text-xl font-bold text-slate-800">{totalOrders}</h3>
          </div>
        </div>
      </div>
src/app/home/component