'use client';
import React, { useState } from 'react';
import { Squares2X2Icon, ClipboardDocumentListIcon, UsersIcon, CalendarDaysIcon, CurrencyDollarIcon, BookOpenIcon, CpuChipIcon, ChartBarIcon, Cog6ToothIcon, XMarkIcon,  } from '@heroicons/react/24/outline';
import { Squares2X2Icon, ClipboardDocumentListIcon, UsersIcon, CalendarDaysIcon, CurrencyDollarIcon, BookOpenIcon, CpuChipIcon, ChartBarIcon, Cog6ToothIcon, XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';

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
  { label: 'Utilities', href: '#utilities' },
  { label: 'Expenditures', icon: <BanknotesIcon className="w-[18px] h-[18px] shrink-0" />, href: '#expenditures' },
];

interface SidebarProps {
  todayRevenue: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
  activeSection: string;
  onNavClick: (href: string) => void;
}

export default function Sidebar({ todayRevenue, mobileOpen, onMobileClose, activeSection, onNavClick }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 flex flex-col sidebar-transition lg:translate-x-0 lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
