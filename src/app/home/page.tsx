'use client';

import CustomerOrdersManager from './components/CustomerOrdersManager';
import MyWorkerJobs from './components/MyWorkerJobs';
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

const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
  '#dashboard': { title: 'Dashboard', subtitle: 'Overview of your car wash operations' },
  '#work-orders': { title: 'Work Orders', subtitle: 'Create, manage and track all vehicle service orders' },
  '#customer-orders': { title: 'Customer Orders', subtitle: 'Review online customer requests and convert them into work orders' },
  '#workers': { title: 'Workers', subtitle: 'Add and manage your car wash team' },
  '#attendance': { title: 'Attendance', subtitle: 'Log and track worker check-ins and hours' },
  '#commissions': { title: 'Commissions', subtitle: "Record and manage workers' earnings" },
  '#accounting': { title: 'Daily Accounting', subtitle: 'Track daily income and expenses' },
  '#analytics': { title: 'AI Analytics', subtitle: 'Intelligent insights for your business' },
  '#reports': { title: 'Reports & Export', subtitle: 'Generate and download business reports' },
  '#pricing': { title: 'Pricing', subtitle: 'Configure service prices per vehicle type' },
  '#utilities': { title: 'Utility Tracking', subtitle: 'Track daily electricity and water consumption' },
  '#expenditures': { title: 'Daily Expenditures', subtitle: 'Record daily business expenses and monitor profit/loss' },
};

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

  return (
    <div className="space-y-6">
      <StatsGrid
        todayOrders={todayOrders}
        activeJobs={activeJobs}
        todayRevenue={`GH₵ ${todayRevenue.toFixed(2)}`}
        activeWorkers={activeWorkers}
        todayExpenditure={`GH₵ ${todayExpenditure.toFixed(2)}`}
        netProfitOrLoss={`GH₵ ${netProfitOrLoss.toFixed(2)}`}
      />

      <UtilitySummaryCards />
      <RevenueChart />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border">
            <div className="p-5 border-b flex justify-between">
              <h2 className="font-semibold">Recent Work Orders</h2>
              <span className="text-xs">
                {workOrders.filter(o => o.status === 'Completed').length} completed today
              </span>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm">
                No work orders yet.
              </div>
            ) : (
              <div className="divide-y">
                {recentOrders.map(order => (
                  <div key={order.id} className="px-5 py-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {order.plate} — {order.vehicleType}
                      </p>
                      <p className="text-xs">
                        {order.services.join(', ') || 'No services'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold">
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border">
            <div className="p-5 border-b">
              <h2 className="font-semibold">Active Workers</h2>
            </div>

            {workers.filter(w => w.status === 'active').length === 0 ? (
              <div className="p-8 text-center text-sm">
                No active workers.
              </div>
            ) : (
              <div className="divide-y">
                {workers.filter(w => w.status === 'active').map(worker => (
                  <div key={worker.id} className="px-5 py-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{worker.name}</p>
                      <p className="text-xs">{worker.phone}</p>
                    </div>
                    <span className="text-xs">{worker.jobsToday} jobs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ServiceBreakdown />
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
      case '#customer-orders':
        return <CustomerOrdersManager />;
      case '#workers':
        return <WorkersManager />;
      case '#attendance':
        return <AttendanceManager />;
      case '#commissions':
        return <CommissionsManager />;
      case '#accounting':
        return <DailyAccounting />;
      case '#reports':
        return <ReportsExport />;
      case '#pricing':
        return <PricingManager />;
      case '#utilities':
        return <UtilityTracker />;
      case '#analytics':
        return (
          <>
            <UtilitySummaryCards />
            <RevenueChart />
            <ServiceBreakdown />
          </>
        );
      case '#expenditures':
        return <ExpenditureManager />;
      default:
        return <div>Coming soon</div>;
    }
  };

  return (
    <AuthGuard allowedRoles={['admin', 'cashier', 'worker']}>
      <div className="flex h-screen overflow-hidden">
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

        <div className="flex-1 flex flex-col">
          <TopHeader onMenuClick={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm mb-4">{subtitle}</p>

            {renderContent()}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
