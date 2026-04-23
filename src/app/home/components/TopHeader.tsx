'use client';
import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export default function TopHeader({ onMenuClick }: TopHeaderProps) {
  return (
    <header
      className="h-16 border-b flex items-center px-4 lg:px-6 shrink-0"
      style={{ backgroundColor: '#ffffff', borderColor: 'hsl(210 18% 89%)' }}
    >
      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 w-9 lg:hidden mr-2 hover:bg-gray-100"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>
      <div className="flex-1" />
    </header>
  );
}
