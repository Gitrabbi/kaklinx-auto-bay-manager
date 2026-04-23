'use client';
import React, { useState } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAppData } from '../../../context/AppDataContext';

type ReportType = 'work-orders' | 'workers' | 'attendance' | 'commissions' | 'pricing';

const reportTypes: { id: ReportType; label: string; description: string }[] = [
  { id: 'work-orders', label: 'Work Orders Report', description: 'All work orders with status, services, and revenue' },
  { id: 'workers', label: 'Workers Report', description: 'Worker profiles, roles, and performance' },
  { id: 'attendance', label: 'Attendance Report', description: 'Worker attendance records and hours' },
  { id: 'commissions', label: 'Commissions Report', description: 'Commission earnings per worker' },
  { id: 'pricing', label: 'Pricing Report', description: 'Service pricing by vehicle type' },
];

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsExport() {
  const { workOrders, workers, attendance, commissions, pricing } = useAppData();
  const [selected, setSelected] = useState<ReportType>('work-orders');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleExport = () => {
    const ts = new Date().toISOString().split('T')[0];
    switch (selected) {
      case 'work-orders': {
        const headers = ['Order ID', 'Plate', 'Vehicle Type', 'Services', 'Status', 'Assigned Workers', 'Total Amount', 'Created At', 'Started At', 'Completed At', 'Duration', 'Notes'];
        const rows = workOrders.map(wo => [
          wo.id, wo.plate, wo.vehicleType, wo.services.join('; '), wo.status,
          workers.filter(w => wo.assignedWorkers.includes(w.id)).map(w => w.name).join('; '),
          wo.totalAmount?.toString() || '',
          wo.createdAt, wo.startedAt || '', wo.completedAt || '', wo.duration || '', wo.notes || '',
        ]);
        downloadCSV(`work-orders-${ts}.csv`, toCSV(headers, rows));
        break;
      }
      case 'workers': {
        const headers = ['ID', 'Name', 'Phone', 'Role', 'Status', 'Commission Rate', 'Jobs Today', 'Join Date'];
        const rows = workers.map(w => [w.id, w.name, w.phone, w.role, w.status, `${w.commissionRate}%`, w.jobsToday.toString(), w.joinDate]);
        downloadCSV(`workers-${ts}.csv`, toCSV(headers, rows));
        break;
      }
      case 'attendance': {
        const headers = ['ID', 'Worker', 'Date', 'Status', 'Check In', 'Check Out', 'Hours Worked'];
        const rows = attendance.map(a => [a.id, a.workerName, a.date, a.status, a.checkIn || '', a.checkOut || '', a.hoursWorked?.toFixed(1) || '']);
        downloadCSV(`attendance-${ts}.csv`, toCSV(headers, rows));
        break;
      }
      case 'commissions': {
        const headers = ['ID', 'Worker', 'Date', 'Jobs Completed', 'Rate', 'Total Earned'];
        const rows = commissions.map(c => [c.id, c.workerName, c.date, c.jobsCompleted.toString(), `${c.rate}%`, `GH₵ ${c.totalEarned.toFixed(2)}`]);
        downloadCSV(`commissions-${ts}.csv`, toCSV(headers, rows));
        break;
      }
      case 'pricing': {
        const headers = ['ID', 'Vehicle Type', 'Service Type', 'Price (GH₵)'];
        const rows = pricing.map(p => [p.id, p.vehicleType, p.serviceType, p.price.toFixed(2)]);
        downloadCSV(`pricing-${ts}.csv`, toCSV(headers, rows));
        break;
      }
    }
  };

  // Summary stats
  const completedOrders = workOrders.filter(wo => wo.status === 'Completed');
  const totalRevenue = completedOrders.reduce((s, wo) => s + (wo.totalAmount || 0), 0);
  const totalCommissions = commissions.reduce((s, c) => s + c.totalEarned, 0);
  const presentDays = attendance.filter(a => a.status === 'Present').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Work Orders', value: workOrders.length.toString(), color: 'hsl(205 78% 42%)' },
          { label: 'Completed Orders', value: completedOrders.length.toString(), color: 'hsl(160 60% 35%)' },
          { label: 'Total Revenue', value: `GH₵ ${totalRevenue.toFixed(2)}`, color: 'hsl(25 95% 53%)' },
          { label: 'Total Commissions', value: `GH₵ ${totalCommissions.toFixed(2)}`, color: 'hsl(280 60% 50%)' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: 'hsl(210 18% 89%)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'hsl(215 10% 48%)' }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Export Panel */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        <div className="flex items-center gap-2 mb-5">
          <ArrowDownTrayIcon className="w-5 h-5" style={{ color: 'hsl(205 78% 42%)' }} />
          <h2 className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>Export Data</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {reportTypes.map(rt => (
            <button
              key={rt.id}
              onClick={() => setSelected(rt.id)}
              className={`p-4 rounded-xl border text-left transition-all ${selected === rt.id ? 'ring-2' : ''}`}
              style={{
                borderColor: selected === rt.id ? 'hsl(205 78% 42%)' : 'hsl(210 18% 89%)',
                backgroundColor: selected === rt.id ? 'hsla(205,78%,42%,0.05)' : 'transparent',
                ringColor: 'hsl(205 78% 42%)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <DocumentTextIcon className="w-4 h-4 shrink-0" style={{ color: selected === rt.id ? 'hsl(205 78% 42%)' : 'hsl(215 10% 48%)' }} />
                <p className="text-sm font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>{rt.label}</p>
              </div>
              <p className="text-xs" style={{ color: 'hsl(215 10% 48%)' }}>{rt.description}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(215 25% 12%)' }}>To Date</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2" style={{ borderColor: 'hsl(210 18% 89%)' }} />
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'hsl(205 78% 42%)' }}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export as CSV
          </button>
        </div>
        <p className="text-xs mt-3" style={{ color: 'hsl(215 10% 48%)' }}>
          Exports all records as a CSV file. Date filter applies to records with date fields.
        </p>
      </div>

      {/* Data Counts */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'hsl(215 25% 12%)' }}>Data Overview</h2>
        <div className="space-y-3">
          {[
            { label: 'Work Orders', count: workOrders.length, sub: `${completedOrders.length} completed` },
            { label: 'Workers', count: workers.length, sub: `${workers.filter(w => w.status === 'active').length} active` },
            { label: 'Attendance Records', count: attendance.length, sub: `${presentDays} present days` },
            { label: 'Commission Records', count: commissions.length, sub: `GH₵ ${totalCommissions.toFixed(2)} total` },
            { label: 'Pricing Entries', count: pricing.length, sub: 'service prices configured' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'hsl(210 18% 89%)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'hsl(215 25% 12%)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'hsl(215 10% 48%)' }}>{item.sub}</p>
              </div>
              <span className="text-lg font-bold" style={{ color: 'hsl(205 78% 42%)' }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
