'use client';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useUserProfile } from '@/hooks/useUserProfile';
import React from 'react';
import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  UsersIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  CpuChipIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  roles: Array<'admin' | 'cashier' | 'worker'>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <Squares2X2Icon className="w-[18px] h-[18px] shrink-0" />,
    href: '#dashboard',
    roles: ['admin', 'cashier'],
  },
  {
    label: 'Work Orders',
    icon: <ClipboardDocumentListIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#work-orders',
    roles: ['admin', 'cashier', 'worker'],
  },
  {
    label: 'Attendance Clock',
    icon: <CalendarDaysIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#attendance-clock',
    roles: ['admin', 'cashier', 'worker'],
  },
  {
    label: 'Customer Orders',
    icon: <ClipboardDocumentListIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#customer-orders',
    roles: ['admin', 'cashier'],
  },
  {
  label: 'Customer Reviews',
  icon: <ChatBubbleLeftRightIcon className="w-[18px] h-[18px] shrink-0" />,
  href: '#customer-reviews',
  roles: ['admin', 'cashier'],
  },
  
  {
    label: 'Workers',
    icon: <UsersIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#workers',
    roles: ['admin'],
  },
  {
    label: 'Attendance',
    icon: <CalendarDaysIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#attendance',
    roles: ['admin', 'cashier'],
  },
  {
    label: 'Commissions',
    icon: <CurrencyDollarIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#commissions',
    roles: ['admin', 'cashier'],
  },
  {
    label: 'Daily Accounting',
    icon: <BookOpenIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#accounting',
    roles: ['admin', 'cashier'],
  },
  {
    label: 'AI Analytics',
    icon: <CpuChipIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#analytics',
    roles: ['admin'],
  },
  {
    label: 'Reports & Export',
    icon: <ChartBarIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#reports',
    roles: ['admin', 'cashier'],
  },
  {
    label: 'Pricing',
    icon: <Cog6ToothIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#pricing',
    roles: ['admin'],
  },
  {
    label: 'Utilities',
    icon: <ChartBarIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#utilities',
    roles: ['admin', 'cashier'],
  },
  {
    label: 'Expenditures',
    icon: <BanknotesIcon className="w-[18px] h-[18px] shrink-0" />,
    href: '#expenditures',
    roles: ['admin', 'cashier'],
  },
];

interface SidebarProps {
  todayRevenue: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
  activeSection: string;
  onNavClick: (href: string) => void;
}

export default function Sidebar({
  todayRevenue,
  mobileOpen,
  onMobileClose,
  activeSection,
  onNavClick,
}: SidebarProps) {
  const { profile, loading } = useUserProfile();
  const role = profile?.role;

  const visibleNavItems =
    loading || !role ? [] : navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 flex flex-col sidebar-transition lg:translate-x-0 lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background:
            'linear-gradient(180deg, #020617 0%, #0f172a 45%, #082f49 100%)',
          color: 'hsl(210 15% 85%)',
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-5 border-b"
          style={{ borderColor: 'rgba(148, 163, 184, 0.18)' }}
        >
          <div className="w-16 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
            <img
              src="/kaklinx-logo.jpg"
              alt="Kaklinx Auto"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <h1 className="font-inter font-bold text-base text-white truncate">
              Kaklinx Auto
            </h1>
            <p className="text-xs text-blue-200 truncate">
              Washing Bay Manager
            </p>
          </div>

          <button
            className="ml-auto lg:hidden hover:text-white transition-colors text-slate-400"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = activeSection === item.href;

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onNavClick(item.href);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </nav>

        {role !== 'worker' && (
          <div
            className="px-4 py-4 border-t"
            style={{ borderColor: 'rgba(148, 163, 184, 0.18)' }}
          >
            <div className="rounded-2xl p-4 bg-white/10 border border-white/10">
              <p className="text-xs text-blue-100">Today&apos;s Revenue</p>
              <p className="text-xl font-bold text-white mt-1">
                {todayRevenue}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
