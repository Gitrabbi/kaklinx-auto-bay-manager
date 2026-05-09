'use client';
import CustomerCertificationsManager from './components/CustomerCertificationsManager';
import CustomerOrdersManager from './components/CustomerOrdersManager';
import MyWorkerJobs from './components/MyWorkerJobs';
import WorkerClockPage from './components/WorkerClockPage';
import { useUserProfile } from '@/hooks/useUserProfile';
import AuthGuard from '@/components/AuthGuard';
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import StatsGrid from './components/StatsGrid';
import RevenueChart from './components/RevenueChart';
import ServiceBreakdown from './components/ServiceBreakdown';
import WorkOrdersManager from './components/WorkOrdersManager';
import WorkersManager from './components/WorkersManager';
import AttendanceManager from './components/AttendanceManager';
import CommissionsManager from './components/CommissionsManager';
import ReportsExport from './components/ReportsExport';
import PricingManager from './components/PricingManager';
import { useAppData } from '../../context/AppDataContext';
import DailyAccounting from './components/DailyAccounting';
import UtilityTracker from './components/UtilityTracker';
import UtilitySummaryCards from './components/UtilitySummaryCards';
import ExpenditureManager from './components/ExpenditureManager';

type Section =
  | '#dashboard'
  | '#work-orders'
  | '#attendance-clock'
  | '#customer-orders'
  | '#workers'
  | '#attendance'
  | '#commissions'
  | '#accounting'
  | '#analytics'
  | '#reports'
  | '#pricing'
  | '#utilities'
  | '#expenditures';
  | '#customer-reviews'

const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
  '#dashboard': {
    title: 'Dashboard',
    subtitle: 'Executive overview of your washing bay operations',
  },
  '#work-orders': {
    title: 'Work Orders',
    subtitle: 'Create, assign, manage, and track all vehicle service orders',
  },
  '#attendance-clock': {
    title: 'Attendance Clock',
    subtitle: 'Clock in and out with worksite location verification',
  },
  '#customer-orders': {
    title: 'Customer Orders',
    subtitle: 'Review online customer requests and convert them into work orders',
  },
  '#workers': {
    title: 'Workers',
    subtitle: 'Add, manage, and monitor your car wash team',
  },
  '#attendance': {
    title: 'Attendance',
    subtitle: 'Log and track worker check-ins, check-outs, and hours',
  },
  '#commissions': {
    title: 'Commissions',
    subtitle: "Record and manage workers' earnings",
  },
  '#accounting': {
    title: 'Daily Accounting',
    subtitle: 'Track income, expenses, profit, and daily cash position',
  },
  '#analytics': {
    title: 'AI Analytics',
    subtitle: 'Intelligent insights for performance and business decisions',
  },
  '#reports': {
    title: 'Reports & Export',
    subtitle: 'Generate and download business reports',
  },
  '#pricing': {
    title: 'Pricing',
    subtitle: 'Configure service prices per vehicle type',
  },
  '#utilities': {
    title: 'Utility Tracking',
    subtitle: 'Track electricity and water usage across operations',
  },
  '#expenditures': {
    title: 'Daily Expenditures',
    subtitle: 'Record business expenses and monitor profit or loss',
  },
};

 '#customer-reviews': {
  title: 'Customer Reviews',
  subtitle: 'Monitor customer certifications, ratings, and service feedback',
},

function getStatusStyle(status: string) {
  if (status === 'Completed') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (status === 'In Progress') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }

  if (status === 'Pending') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return 'bg-red-50 text-red-700 border-red-200';
}

function DashboardContent() {
  const {
    getTodayOrders,
    getActiveJobs,
    getTodayRevenue,
    getActiveWorkers,
    getTodayExpenditure,
    workOrders,
    workers,
  } = useAppData();

  const todayOrders = getTodayOrders();
  const activeJobs = getActiveJobs();
  const todayRevenue = getTodayRevenue();
  const todayExpenditure = getTodayExpenditure();
  const activeWorkers = getActiveWorkers();
  const netProfitOrLoss = todayRevenue - todayExpenditure;

  const recentOrders = workOrders.slice(0, 5);
  const activeWorkerList = workers.filter((w) => w.status === 'active');

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
        <StatsGrid
          todayOrders={todayOrders}
          activeJobs={activeJobs}
          todayRevenue={`GH₵ ${todayRevenue.toFixed(2)}`}
          activeWorkers={activeWorkers}
          todayExpenditure={`GH₵ ${todayExpenditure.toFixed(2)}`}
          netProfitOrLoss={`GH₵ ${netProfitOrLoss.toFixed(2)}`}
        />
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
        <UtilitySummaryCards />
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
        <RevenueChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-white/90 rounded-3xl border border-white/70 shadow-xl shadow-slate-200/60 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-950 to-blue-950">
              <div>
                <h2 className="font-bold text-white">Recent Work Orders</h2>
                <p className="text-xs text-blue-100 mt-1">
                  Latest operational activity
                </p>
              </div>

              <span className="text-xs bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full">
                {workOrders.filter((o) => o.status === 'Completed').length}{' '}
                completed
              </span>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-500">
                  No work orders yet. Create one from the Work Orders section.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-blue-50/60 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {order.plate} — {order.vehicleType}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {order.services?.join(', ') || 'No services'}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-semibold border px-3 py-1 rounded-full shrink-0 ${getStatusStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white/90 rounded-3xl border border-white/70 shadow-xl shadow-slate-200/60 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-slate-950">
              <h2 className="font-bold text-white">Active Workers</h2>
              <p className="text-xs text-blue-100 mt-1">
                Team members currently available
              </p>
            </div>

            {activeWorkerList.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-500">
                  No active workers. Add workers in the Workers section.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeWorkerList.map((worker) => (
                  <div
                    key={worker.id}
                    className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-blue-50/60 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {worker.initials || worker.name?.slice(0, 2)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {worker.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {worker.phone}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full shrink-0">
                      {worker.jobsToday} jobs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
        <ServiceBreakdown />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('#work-orders');

  const { getTodayRevenue } = useAppData();
  const { profile } = useUserProfile();

  const role = profile?.role;
  const { title, subtitle } = sectionTitles[activeSection];
  const todayRevenue = getTodayRevenue();

  const renderContent = () => {
    switch (activeSection) {
      case '#dashboard':
        return <DashboardContent />;

      case '#work-orders':
        return role === 'worker' ? <MyWorkerJobs /> : <WorkOrdersManager />;

      case '#attendance-clock':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <WorkerClockPage />
          </div>
        );

      case '#customer-orders':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <CustomerOrdersManager />
          </div>
        );

      case '#workers':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <WorkersManager />
          </div>
        );

      case '#attendance':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <AttendanceManager />
          </div>
        );

      case '#commissions':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <CommissionsManager />
          </div>
        );

      case '#accounting':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <DailyAccounting />
          </div>
        );

      case '#reports':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <ReportsExport />
          </div>
        );

      case '#pricing':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <PricingManager />
          </div>
        );

      case '#utilities':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <UtilityTracker />
          </div>
        );

      case '#analytics':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
              <UtilitySummaryCards />
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
              <RevenueChart />
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
              <ServiceBreakdown />
            </div>
          </div>
        );

      case '#expenditures':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <ExpenditureManager />
          </div>
        );
      case '#customer-reviews':
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-5">
            <CustomerCertificationsManager />
          </div>
        );

      default:
        return (
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur p-10 text-center">
            <p className="text-sm text-slate-500">This section is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <AuthGuard allowedRoles={['admin', 'cashier', 'worker']}>
      <div className="flex h-screen overflow-hidden bg-slate-950">
        <Sidebar
          todayRevenue={`GH₵ ${todayRevenue.toFixed(2)}`}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          activeSection={activeSection}
          onNavClick={(href) => {
            setActiveSection(href as Section);
            setMobileOpen(false);
          }}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
          <TopHeader onMenuClick={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-4 lg:p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 border border-white/10 shadow-2xl shadow-slate-300/40">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_#38bdf8,_transparent_35%),radial-gradient(circle_at_bottom_left,_#1d4ed8,_transparent_35%)]" />

                <div className="relative p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-100 text-xs font-semibold mb-4">
                      Kaklinx Auto Operations Console
                    </div>

                    <h1 className="text-2xl lg:text-3xl font-bold text-white">
                      {title}
                    </h1>

                    <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                      {subtitle}
                    </p>
                  </div>

                  <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-4 min-w-[220px]">
                    <p className="text-xs text-blue-100">Today&apos;s Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      GH₵ {todayRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </section>

              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
