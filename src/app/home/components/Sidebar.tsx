'use client';
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
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <Squares2X2Icon className="w-[18px] h-[18px] shrink-0" />, href: '#dashboard' },
  { label: 'Work Orders', icon: <ClipboardDocumentListIcon className="w-[18px] h-[18px] shrink-0" />, href: '#work-orders' },
  { label: 'Workers', icon: <UsersIcon className="w-[18px] h-[18px] shrink-0" />, href: '#workers' },
  { label: 'Attendance', icon: <CalendarDaysIcon className="w-[18px] h-[18px] shrink-0" />, href: '#attendance' },
  { label: 'Commissions', icon: <CurrencyDollarIcon className="w-[18px] h-[18px] shrink-0" />, href: '#commissions' },
  { label: 'Daily Accounting', icon: <BookOpenIcon className="w-[18px] h-[18px] shrink-0" />, href: '#accounting' },
  { label: 'AI Analytics', icon: <CpuChipIcon className="w-[18px] h-[18px] shrink-0" />, href: '#analytics' },
  { label: 'Reports & Export', icon: <ChartBarIcon className="w-[18px] h-[18px] shrink-0" />, href: '#reports' },
  { label: 'Pricing', icon: <Cog6ToothIcon className="w-[18px] h-[18px] shrink-0" />, href: '#pricing' },
  { label: 'Utilities', icon: <ChartBarIcon className="w-[18px] h-[18px] shrink-0" />, href: '#utilities' },
  { label: 'Expenditures', icon: <BanknotesIcon className="w-[18px] h-[18px] shrink-0" />, href: '#expenditures' },
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
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 flex flex-col sidebar-transition lg:translate-x-0 lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'hsl(215 28% 14%)', color: 'hsl(210 15% 85%)' }}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: 'hsl(215 20% 22%)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(205 78% 52%)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
              <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
            </svg>
          </div>
          <div>
            <h1 className="font-inter font-bold text-base text-white">AutoWash</h1>
            <p className="text-xs" style={{ color: 'hsla(210, 15%, 85%, 0.6)' }}>Bay Manager</p>
          </div>
          <button
            className="ml-auto lg:hidden hover:text-white transition-colors"
            style={{ color: 'hsla(210, 15%, 85%, 0.6)' }}
            onClick={onMobileClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeSection === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onNavClick(item.href);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? 'nav-link-active' : 'nav-link'
                }`}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t" style={{ borderColor: 'hsl(215 20% 22%)' }}>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(215 25% 20%)' }}>
            <p className="text-xs" style={{ color: 'hsla(210, 15%, 85%, 0.6)' }}>Today&apos;s Revenue</p>
            <p className="text-lg font-bold text-white mt-0.5">{todayRevenue}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
