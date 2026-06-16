'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type WorkOrder = {
  id: string;
  queue_number?: string;
  queueNumber?: string;
  queue_position?: number;
  queuePosition?: number;
  vehicle_type?: string;
  vehicleType?: string;
  plate?: string;
  services?: string[] | string;
  status?: string;
  completed_at?: string;
  completedAt?: string;
  target_minutes?: number;
  targetMinutes?: number;
};

export default function QueueTVPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    loadQueue();

    const timer = setInterval(() => setNow(new Date()), 1000);

    const channel = supabase
      .channel('queue-tv-live-premium')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        () => loadQueue()
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadQueue() {
    const { data } = await supabase
      .from('work_orders')
      .select('*')
      .order('queue_position', { ascending: true });

    setWorkOrders((data as WorkOrder[]) || []);
  }

  const activeJobs = useMemo(
    () =>
      workOrders.filter((w) =>
        ['in progress', 'in_progress'].includes(
          String(w.status || '').toLowerCase()
        )
      ),
    [workOrders]
  );

  const pendingJobs = useMemo(
    () =>
      workOrders.filter((w) =>
        ['pending'].includes(String(w.status || '').toLowerCase())
      ),
    [workOrders]
  );

  const completedJobs = useMemo(
    () =>
      workOrders
        .filter((w) => {
          const s = String(w.status || '').toLowerCase();
          return s === 'completed' || !!(w.completed_at || w.completedAt);
        })
        .slice(-10)
        .reverse(),
    [workOrders]
  );

  const nowServing = activeJobs[0];

  const averageWait = Math.round(
    pendingJobs.reduce(
      (a, b) => a + Number(b.target_minutes || b.targetMinutes || 20),
      0
    ) / Math.max(pendingJobs.length, 1)
  );

  const completedToday = completedJobs.length;

  const serviceBadgeClass = (service: string) => {
    const value = service.toLowerCase();
    if (value.includes('wash')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    if (value.includes('oil')) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (value.includes('repair')) return 'bg-red-500/20 text-red-300 border-red-500/40';
    if (value.includes('diagnostic')) return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  const renderServices = (services: WorkOrder['services']) => {
    const items = Array.isArray(services)
      ? services
      : String(services || 'General Service')
          .split(',')
          .map((s) => s.trim());

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {items.map((service, idx) => (
          <span
            key={idx}
            className={`px-3 py-1 rounded-full border text-sm font-semibold ${serviceBadgeClass(
              service
            )}`}
          >
            {service}
          </span>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-6xl font-black tracking-wider">
            KAKLINX AUTO MANAGEMENT
          </h1>
          <p className="text-slate-400 text-xl mt-2">Premium Queue Display</p>
        </div>

        <div className="text-right">
          <div className="text-5xl font-bold">{now.toLocaleTimeString()}</div>
          <div className="text-slate-400">{now.toLocaleDateString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          ['Waiting', pendingJobs.length],
          ['In Service', activeJobs.length],
          ['Completed', completedToday],
          ['Avg Wait (min)', averageWait],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
          >
            <div className="text-slate-400">{label}</div>
            <div className="text-5xl font-black mt-2">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-5 rounded-[2rem] bg-gradient-to-br from-emerald-500/25 to-green-900/40 border border-emerald-400/20 p-8">
          <h2 className="text-3xl font-bold mb-6">NOW SERVING</h2>

          {nowServing ? (
            <>
              <div className="text-8xl font-black">
                {nowServing.queue_number || nowServing.queueNumber}
              </div>

              <div className="mt-4 text-3xl font-semibold">
                {nowServing.vehicle_type || nowServing.vehicleType || 'Vehicle'}
              </div>

              <div className="text-2xl text-slate-200 mt-2">
                Plate: {nowServing.plate || 'N/A'}
              </div>

              {renderServices(nowServing.services)}

              <div className="mt-6 inline-flex rounded-full bg-emerald-500 px-5 py-2 font-bold">
                IN PROGRESS
              </div>
            </>
          ) : (
            <div className="text-3xl text-slate-300">No vehicle in service</div>
          )}
        </section>

        <section className="col-span-4 rounded-[2rem] bg-white/5 border border-white/10 p-8">
          <h2 className="text-3xl font-bold mb-6">UP NEXT</h2>

          <div className="space-y-4">
            {pendingJobs.slice(0, 8).map((job) => (
              <div
                key={job.id}
                className="rounded-2xl bg-slate-800/80 p-4 border border-white/5"
              >
                <div className="flex justify-between">
                  <div className="text-3xl font-black text-cyan-400">
                    {job.queue_number || job.queueNumber}
                  </div>
                  <div className="text-slate-400">
                    #{job.queue_position || job.queuePosition}
                  </div>
                </div>

                <div className="mt-2 font-semibold">
                  {job.vehicle_type || job.vehicleType}
                </div>
                <div className="text-slate-400">Plate: {job.plate || 'N/A'}</div>
                {renderServices(job.services)}
              </div>
            ))}
          </div>
        </section>

        <section className="col-span-3 rounded-[2rem] bg-white/5 border border-white/10 p-8">
          <h2 className="text-3xl font-bold mb-6">RECENTLY COMPLETED</h2>

          <div className="space-y-3">
            {completedJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl bg-slate-900/80 p-3 border border-white/5"
              >
                <div className="font-bold text-green-400">
                  {job.queue_number || job.queueNumber}
                </div>
                <div className="text-sm text-slate-300">
                  {job.vehicle_type || job.vehicleType}
                </div>
                <div className="text-xs text-slate-500">
                  {job.plate || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
