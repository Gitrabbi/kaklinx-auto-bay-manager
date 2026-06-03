'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAppData } from '../../../context/AppDataContext';
import { supabase } from '@/lib/supabaseClient';

type ReportType =
  | 'work-orders'
  | 'workers'
  | 'worker-performance'
  | 'attendance'
  | 'commissions'
  | 'pricing';

const reportTypes: { id: ReportType; label: string; description: string }[] = [
  {
    id: 'work-orders',
    label: 'Work Orders Report',
    description: 'All work orders with status, services, and revenue',
  },
  {
    id: 'workers',
    label: 'Workers Profile Report',
    description: 'Worker profile details and status',
  },
  {
    id: 'worker-performance',
    label: 'Worker Performance Report',
    description: 'Jobs done, time used, commissions, and revenue contribution',
  },
  {
    id: 'attendance',
    label: 'Attendance Report',
    description: 'Live attendance records from attendance logs',
  },
  {
    id: 'commissions',
    label: 'Commissions Report',
    description: 'Commission earnings per worker',
  },
  {
    id: 'pricing',
    label: 'Pricing Report',
    description: 'Service pricing by vehicle type',
  },
];

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
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

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
}

function formatTime(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateHours(start?: string, end?: string) {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e <= s) return 0;
  return (e - s) / (1000 * 60 * 60);
}

function parseDurationToMinutes(duration?: string) {
  if (!duration) return 0;

  const hourMatch = duration.match(/(\d+)h/);
  const minMatch = duration.match(/(\d+)m/);

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minMatch ? Number(minMatch[1]) : 0;

  return hours * 60 + minutes;
}

export default function ReportsExport() {
  const { workOrders, workers, commissions, pricing } = useAppData();

  const [selected, setSelected] = useState<ReportType>('work-orders');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadAttendanceLogs();
  }, []);

  async function loadAttendanceLogs() {
    setLoadingLogs(true);

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setAttendanceLogs(data || []);
    }

    setLoadingLogs(false);
  }

  function inDateRange(dateValue?: string) {
    if (!dateValue) return true;

    const date = formatDate(dateValue);

    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;

    return true;
  }

  function workerName(workerId?: string) {
    if (!workerId) return '';
    return workers.find((w: any) => w.id === workerId)?.name || 'Unknown Worker';
  }

  function workerPhone(workerId?: string) {
    if (!workerId) return '';
    return workers.find((w: any) => w.id === workerId)?.phone || '';
  }

  function assignedWorkerNames(workerIds: string[]) {
    return workers
      .filter((w: any) => workerIds.includes(w.id))
      .map((w: any) => w.name)
      .join('; ');
  }

  const completedOrders = workOrders.filter((wo) => wo.status === 'Completed');
  const totalRevenue = completedOrders.reduce((s, wo) => s + (wo.totalAmount || 0), 0);
  const totalCommissions = commissions.reduce((s, c) => s + c.totalEarned, 0);

  const workerPerformanceRows = useMemo(() => {
    const targetWorkers = selectedWorkerId
      ? workers.filter((w: any) => w.id === selectedWorkerId)
      : workers;

    return targetWorkers.map((worker: any) => {
      const workerJobs = workOrders.filter((wo) =>
        wo.assignedWorkers?.includes(worker.id)
      );

      const completedJobs = workerJobs.filter((wo) => wo.status === 'Completed');

      const workerCommissionRecords = commissions.filter(
        (c) => c.workerId === worker.id
      );

      const totalCommission = workerCommissionRecords.reduce(
        (sum, c) => sum + Number(c.totalEarned || 0),
        0
      );

      const totalRevenueContributed = completedJobs.reduce(
        (sum, wo) => sum + Number(wo.totalAmount || 0),
        0
      );

      const totalMinutes = completedJobs.reduce((sum, wo) => {
        if (wo.startedAt && wo.completedAt) {
          return (
            sum +
            (new Date(wo.completedAt).getTime() -
              new Date(wo.startedAt).getTime()) /
              60000
          );
        }

        return sum + parseDurationToMinutes(wo.duration);
      }, 0);

      const averageMinutes =
        completedJobs.length > 0 ? totalMinutes / completedJobs.length : 0;

      const attendanceCount = attendanceLogs.filter(
        (log) => log.worker_id === worker.id
      ).length;

      const activeAttendance = attendanceLogs.some(
        (log) => log.worker_id === worker.id && log.status === 'clocked_in'
      );

      return {
        worker,
        assignedJobs: workerJobs.length,
        completedJobs: completedJobs.length,
        totalRevenueContributed,
        totalCommission,
        averageMinutes,
        attendanceCount,
        activeAttendance,
      };
    });
  }, [workers, workOrders, commissions, attendanceLogs, selectedWorkerId]);


  const vehicleBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    workOrders.forEach((wo: any) => {
      map[wo.vehicleType] = (map[wo.vehicleType] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1]));
  }, [workOrders]);

  const serviceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    workOrders.forEach((wo: any) => {
      (wo.services || []).forEach((service: string) => {
        map[service] = (map[service] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1]));
  }, [workOrders]);

  const revenueByVehicle = useMemo(() => {
    const map: Record<string, number> = {};
    completedOrders.forEach((wo: any) => {
      map[wo.vehicleType] =
        (map[wo.vehicleType] || 0) + Number(wo.totalAmount || 0);
    });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1]));
  }, [completedOrders]);

  const topWorkers = useMemo(() => {
    return [...workerPerformanceRows]
      .sort((a, b) => b.completedJobs - a.completedJobs)
      .slice(0, 5);
  }, [workerPerformanceRows]);


  const handleExport = async () => {
    const ts = new Date().toISOString().split('T')[0];

    switch (selected) {
      case 'work-orders': {
        const headers = [
          'Order ID',
          'Plate',
          'Vehicle Type',
          'Services',
          'Status',
          'Assigned Workers',
          'Total Amount',
          'Created At',
          'Started At',
          'Completed At',
          'Duration',
          'Notes',
        ];

        const rows = workOrders
          .filter((wo) => inDateRange(wo.createdAt))
          .map((wo) => [
            wo.id,
            wo.plate,
            wo.vehicleType,
            wo.services.join('; '),
            wo.status,
            assignedWorkerNames(wo.assignedWorkers || []),
            String(wo.totalAmount || 0),
            wo.createdAt,
            wo.startedAt || '',
            wo.completedAt || '',
            wo.duration || '',
            wo.notes || '',
          ]);

        downloadCSV(`work-orders-${ts}.csv`, toCSV(headers, rows));
        break;
      }

      case 'workers': {
        const headers = [
          'ID',
          'Name',
          'Phone',
          'Role',
          'Status',
          'Commission Rate',
          'Jobs Today',
          'Join Date',
        ];

        const targetWorkers = selectedWorkerId
          ? workers.filter((w: any) => w.id === selectedWorkerId)
          : workers;

        const rows = targetWorkers.map((w: any) => [
          w.id,
          w.name,
          w.phone,
          w.role,
          w.status,
          `${w.commissionRate}%`,
          String(w.jobsToday),
          w.joinDate,
        ]);

        downloadCSV(`workers-profile-${ts}.csv`, toCSV(headers, rows));
        break;
      }

      case 'worker-performance': {
        const headers = [
          'Worker ID',
          'Worker Name',
          'Phone',
          'Role',
          'Status',
          'Assigned Jobs',
          'Completed Jobs',
          'Average Time Per Completed Job (mins)',
          'Total Revenue Contributed',
          'Total Commission',
          'Attendance Records',
          'Currently Clocked In',
        ];

        const rows = workerPerformanceRows.map((row) => [
          row.worker.id,
          row.worker.name,
          row.worker.phone,
          row.worker.role,
          row.worker.status,
          String(row.assignedJobs),
          String(row.completedJobs),
          row.averageMinutes.toFixed(1),
          `GH₵ ${row.totalRevenueContributed.toFixed(2)}`,
          `GH₵ ${row.totalCommission.toFixed(2)}`,
          String(row.attendanceCount),
          row.activeAttendance ? 'Yes' : 'No',
        ]);

        const filename = selectedWorkerId
          ? `worker-performance-${workerName(selectedWorkerId)}-${ts}.csv`
          : `worker-performance-all-${ts}.csv`;

        downloadCSV(filename, toCSV(headers, rows));
        break;
      }

      case 'attendance': {
        const headers = [
          'ID',
          'Name',
          'Role',
          'Phone',
          'Date',
          'Clock In',
          'Clock Out',
          'Hours Worked',
          'Clock In Method',
          'Clock Out Method',
          'Status',
          'Reason/Note',
        ];

        const rows = attendanceLogs
          .filter((log) => inDateRange(log.clock_in_time || log.created_at))
          .filter((log) =>
            selectedWorkerId ? log.worker_id === selectedWorkerId : true
          )
          .map((log) => {
            const isWorker = Boolean(log.worker_id);
            const name = isWorker ? workerName(log.worker_id) : log.staff_name || 'Staff Member';
            const role = isWorker ? 'worker' : log.staff_role || 'staff';
            const phone = isWorker ? workerPhone(log.worker_id) : '';

            return [
              log.id,
              name,
              role,
              phone,
              formatDate(log.clock_in_time || log.created_at),
              formatTime(log.clock_in_time),
              formatTime(log.clock_out_time),
              calculateHours(log.clock_in_time, log.clock_out_time).toFixed(1),
              log.clock_in_method || '',
              log.clock_out_method || '',
              log.status || '',
              log.clock_out_reason || '',
            ];
          });

        downloadCSV(`attendance-logs-${ts}.csv`, toCSV(headers, rows));
        break;
      }

      case 'commissions': {
        const headers = [
          'ID',
          'Worker',
          'Date',
          'Jobs Completed',
          'Rate',
          'Total Earned',
        ];

        const rows = commissions
          .filter((c) => inDateRange(c.date))
          .filter((c) => (selectedWorkerId ? c.workerId === selectedWorkerId : true))
          .map((c) => [
            c.id,
            c.workerName,
            c.date,
            String(c.jobsCompleted),
            `${c.rate}%`,
            `GH₵ ${c.totalEarned.toFixed(2)}`,
          ]);

        downloadCSV(`commissions-${ts}.csv`, toCSV(headers, rows));
        break;
      }

      case 'pricing': {
        const headers = ['ID', 'Vehicle Type', 'Service Type', 'Price (GH₵)', 'Recommended Minutes'];

        const rows = pricing.map((p) => [
          p.id,
          p.vehicleType,
          p.serviceType,
          p.price.toFixed(2),
          String(p.recommendedMinutes || ''),
        ]);

        downloadCSV(`pricing-${ts}.csv`, toCSV(headers, rows));
        break;
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Work Orders',
            value: workOrders.length.toString(),
            color: 'hsl(205 78% 42%)',
          },
          {
            label: 'Completed Orders',
            value: completedOrders.length.toString(),
            color: 'hsl(160 60% 35%)',
          },
          {
            label: 'Total Revenue',
            value: `GH₵ ${totalRevenue.toFixed(2)}`,
            color: 'hsl(25 95% 53%)',
          },
          {
            label: 'Total Commissions',
            value: `GH₵ ${totalCommissions.toFixed(2)}`,
            color: 'hsl(280 60% 50%)',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: 'hsl(210 18% 89%)' }}
          >
            <p
              className="text-xs font-medium mb-1"
              style={{ color: 'hsl(215 10% 48%)' }}
            >
              {s.label}
            </p>
            <p className="text-xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div
        className="bg-white rounded-xl border p-5"
        style={{ borderColor: 'hsl(210 18% 89%)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <ArrowDownTrayIcon
            className="w-5 h-5"
            style={{ color: 'hsl(205 78% 42%)' }}
          />
          <h2 className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>
            Export Data
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {reportTypes.map((rt) => (
            <button
              key={rt.id}
              onClick={() => setSelected(rt.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected === rt.id ? 'ring-2' : ''
              }`}
              style={{
                borderColor:
                  selected === rt.id
                    ? 'hsl(205 78% 42%)'
                    : 'hsl(210 18% 89%)',
                backgroundColor:
                  selected === rt.id ? 'hsla(205,78%,42%,0.05)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <DocumentTextIcon
                  className="w-4 h-4 shrink-0"
                  style={{
                    color:
                      selected === rt.id
                        ? 'hsl(205 78% 42%)'
                        : 'hsl(215 10% 48%)',
                  }}
                />
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'hsl(215 25% 12%)' }}
                >
                  {rt.label}
                </p>
              </div>
              <p className="text-xs" style={{ color: 'hsl(215 10% 48%)' }}>
                {rt.description}
              </p>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-[auto_auto_1fr] gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border outline-none"
            />
          </div>

          {(selected === 'workers' ||
            selected === 'worker-performance' ||
            selected === 'attendance' ||
            selected === 'commissions') && (
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Worker Filter Optional
              </label>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              >
                <option value="">All workers</option>
                {workers.map((worker: any) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} {worker.phone ? `— ${worker.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={handleExport}
          disabled={loadingLogs}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:bg-blue-300"
          style={{ backgroundColor: 'hsl(205 78% 42%)' }}
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          {loadingLogs ? 'Preparing...' : 'Export as CSV'}
        </button>

        <p className="text-xs mt-3" style={{ color: 'hsl(215 10% 48%)' }}>
          Attendance export now uses the new attendance_logs table. Worker performance can be exported for all workers or one selected worker.
        </p>
      </div>


      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Vehicle Breakdown</h2>
          {vehicleBreakdown.map(([vehicle, count]) => (
            <div key={String(vehicle)} className="flex justify-between py-2 border-b">
              <span>{String(vehicle)}</span>
              <span className="font-semibold">{String(count)}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Service Breakdown</h2>
          {serviceBreakdown.map(([service, count]) => (
            <div key={String(service)} className="flex justify-between py-2 border-b">
              <span>{String(service)}</span>
              <span className="font-semibold">{String(count)}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Revenue By Vehicle Type</h2>
          {revenueByVehicle.map(([vehicle, amount]) => (
            <div key={String(vehicle)} className="flex justify-between py-2 border-b">
              <span>{String(vehicle)}</span>
              <span className="font-semibold">GH₵ {Number(amount).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Top Performing Workers</h2>
          {topWorkers.map((worker, index) => (
            <div key={worker.worker.id} className="flex justify-between py-2 border-b">
              <span>{index + 1}. {worker.worker.name}</span>
              <span className="font-semibold">{worker.completedJobs} jobs</span>
            </div>
          ))}
        </div>
      </div>


      <div
        className="bg-white rounded-xl border p-5"
        style={{ borderColor: 'hsl(210 18% 89%)' }}
      >
        <h2
          className="font-semibold mb-4"
          style={{ color: 'hsl(215 25% 12%)' }}
        >
          Data Overview
        </h2>

        <div className="space-y-3">
          {[
            {
              label: 'Work Orders',
              count: workOrders.length,
              sub: `${completedOrders.length} completed`,
            },
            {
              label: 'Workers',
              count: workers.length,
              sub: `${workers.filter((w) => w.status === 'active').length} active`,
            },
            {
              label: 'Attendance Logs',
              count: attendanceLogs.length,
              sub: `${attendanceLogs.filter((l) => l.status === 'clocked_in').length} currently clocked in`,
            },
            {
              label: 'Commission Records',
              count: commissions.length,
              sub: `GH₵ ${totalCommissions.toFixed(2)} total`,
            },
            {
              label: 'Pricing Entries',
              count: pricing.length,
              sub: 'service prices configured',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b last:border-0"
              style={{ borderColor: 'hsl(210 18% 89%)' }}
            >
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: 'hsl(215 25% 12%)' }}
                >
                  {item.label}
                </p>
                <p className="text-xs" style={{ color: 'hsl(215 10% 48%)' }}>
                  {item.sub}
                </p>
              </div>
              <span
                className="text-lg font-bold"
                style={{ color: 'hsl(205 78% 42%)' }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
