'use client';

import React, { useMemo, useState } from 'react';
import { useAppData } from '../../../context/AppDataContext';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function ExpenditureManager() {
  const { expenditures, addExpenditure, deleteExpenditure, getTodayExpenditure, getTodayRevenue } = useAppData();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Supplies');
  const [amount, setAmount] = useState('');

  const today = todayISO();
  const todayExpenditures = useMemo(
    () => expenditures.filter((item) => item.date === today),
    [expenditures, today]
  );

  const totalExpenditure = getTodayExpenditure();
  const revenue = getTodayRevenue();
  const net = revenue - totalExpenditure;

  const handleAdd = () => {
    const parsed = Number(amount || 0);
    if (!description.trim() || parsed <= 0) {
      alert('Please enter a description and a valid amount greater than 0.');
      return;
    }

    addExpenditure({
      date: today,
      description: description.trim(),
      amount: parsed,
      category,
      notes: '',
    });

    setDescription('');
    setAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-500">Today&apos;s Revenue</p>
          <h2 className="text-2xl font-bold mt-2">GH₵ {revenue.toFixed(2)}</h2>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-500">Today&apos;s Expenditure</p>
          <h2 className="text-2xl font-bold mt-2">GH₵ {totalExpenditure.toFixed(2)}</h2>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-500">Net Profit / Loss</p>
          <h2 className={`text-2xl font-bold mt-2 ${net < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            GH₵ {net.toFixed(2)}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">Add Daily Expenditure</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="px-3 py-2 rounded-lg border text-sm" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
            <option>Supplies</option>
            <option>Utilities</option>
            <option>Maintenance</option>
            <option>Salaries</option>
            <option>Fuel</option>
            <option>Other</option>
          </select>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="Amount (GH₵)" className="px-3 py-2 rounded-lg border text-sm" />
          <button type="button" onClick={handleAdd} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'hsl(205 78% 42%)' }}>Save Expenditure</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Today&apos;s Expenditure Entries</h2>
        {todayExpenditures.length === 0 ? (
          <p className="text-sm text-slate-500">No expenditure entries recorded for today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-3">Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {todayExpenditures.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 font-medium">{item.description}</td>
                    <td>{item.category}</td>
                    <td>{item.date}</td>
                    <td className="text-right font-semibold">GH₵ {Number(item.amount || 0).toFixed(2)}</td>
                    <td className="text-right">
                      <button type="button" className="text-red-600 text-xs font-semibold" onClick={() => deleteExpenditure(item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
