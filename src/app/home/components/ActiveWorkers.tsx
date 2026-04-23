'use client';
import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Worker {
  id: string;
  name: string;
  phone: string;
  initials: string;
  status: 'active' | 'break' | 'offline';
  jobsToday: number;
}

const workers: Worker[] = [
  { id: '1', name: 'Kofi Boateng', phone: '0551234567', initials: 'KB', status: 'active', jobsToday: 8 },
  { id: '2', name: 'Abena Osei', phone: '0271234567', initials: 'AO', status: 'active', jobsToday: 6 },
  { id: '3', name: 'Ama Mensah', phone: '0201234567', initials: 'AM', status: 'active', jobsToday: 5 },
  { id: '4', name: 'Kwame Asante', phone: '0244123456', initials: 'KA', status: 'active', jobsToday: 7 },
];

export default function ActiveWorkers() {
  return (
    <div
      className="bg-white rounded-xl border"
      style={{ borderColor: 'hsl(210 18% 89%)' }}
    >
      {/* Header */}
      <div
        className="p-5 border-b"
        style={{ borderColor: 'hsl(210 18% 89%)' }}
      >
        <h2 className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>
          Active Workers
        </h2>
      </div>

      {/* Worker list */}
      <div className="divide-y" style={{ borderColor: 'hsl(210 18% 89%)' }}>
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="px-5 py-3.5 flex items-center gap-3 table-row-hover transition-colors cursor-pointer"
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
              style={{
                backgroundColor: 'hsla(25, 95%, 53%, 0.15)',
                color: 'hsl(25 95% 53%)',
              }}
            >
              {worker.initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: 'hsl(215 25% 12%)' }}
              >
                {worker.name}
              </p>
              <p
                className="text-xs"
                style={{ color: 'hsl(215 10% 48%)' }}
              >
                {worker.phone}
              </p>
            </div>

            {/* Jobs today */}
            <span
              className="text-xs font-medium hidden sm:block shrink-0"
              style={{ color: 'hsl(215 10% 48%)' }}
            >
              {worker.jobsToday} jobs
            </span>

            {/* Status icon */}
            <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
