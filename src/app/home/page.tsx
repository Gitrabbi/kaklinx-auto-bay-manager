'use client';
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
  | '#workers'
  | '#attendance'
  | '#commissions'
  | '#accounting'
  | '#analytics'
  | '#reports'
  | '#pricing'
  | '#utilities';
  | '#utilities'
  | '#expenditures';



const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
  '#dashboard': { title: 'Dashboard', subtitle: 'Overview of your car wash operations' },
  '#work-orders': { title: 'Work Orders', subtitle: 'Create, manage and track all vehicle service orders' },
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
  const { getTodayOrders, getActiveJobs, getTodayRevenue, getActiveWorkers, workOrders, workers } = useAppData();
  const { getTodayOrders, getActiveJobs, getTodayRevenue, getActiveWorkers, getTodayExpenditure, workOrders, workers } = useAppData();
  const todayOrders = getTodayOrders();
  const activeJobs = getActiveJobs();
  const todayRevenue = getTodayRevenue();
  const todayExpenditure = getTodayExpenditure();
  const activeWorkers = getActiveWorkers();
  const netProfitOrLoss = todayRevenue - todayExpenditure;

  // Recent work orders for dashboard (last 5)
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
          {/* Live recent work orders */}
          <div className="bg-white rounded-xl border" style={{ borderColor: 'hsl(210 18% 89%)' }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'hsl(210 18% 89%)' }}>
              <h2 className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>Recent Work Orders</h2>
              <span className="text-xs" style={{ color: 'hsl(215 10% 48%)' }}>
                {workOrders.filter(o => o.status === 'Completed').length} completed today
              </span>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm" style={{ color: 'hsl(215 10% 48%)' }}>No work orders yet. Create one from the Work Orders section.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'hsl(210 18% 89%)' }}>
                {recentOrders.map(order => (
                  <div key={order.id} className="px-5 py-3.5 flex items-center gap-4 table-row-hover transition-colors">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsla(205,78%,42%,0.1)' }}>
                      <svg className="w-4 h-4" style={{ color: 'hsl(205 78% 42%)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
@@ -154,50 +161,52 @@ export default function HomePage() {
        return <DashboardContent />;
      case '#work-orders':
        return <WorkOrdersManager />;
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
          <div className="space-y-6">
            <UtilitySummaryCards />
            <RevenueChart />
            <ServiceBreakdown />
          </div>
        );
      case '#expenditures':
        return <ExpenditureManager />;
      default:
        return (
          <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: 'hsl(210 18% 89%)' }}>
            <p className="text-sm" style={{ color: 'hsl(215 10% 48%)' }}>This section is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen font-inter overflow-hidden" style={{ backgroundColor: 'hsl(210 20% 98%)' }}>
      <Sidebar
        todayRevenue={`GH₵ ${todayRevenue.toFixed(2)}`}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        activeSection={activeSection}
        onNavClick={(href) => { setActiveSection(href as Section); setMobileOpen(false); }}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="fade-in space-y-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'hsl(215 25% 12%)' }}>{title}</h1>
              <p className="text-sm mt-1" style={{ color: 'hsl(215 10% 48%)' }}>{subtitle}</p>
