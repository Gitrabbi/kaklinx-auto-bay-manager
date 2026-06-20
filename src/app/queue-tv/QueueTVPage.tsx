'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type WorkOrder = {
  id: string;
  queue_number: string;
  queue_position: number;
  vehicle_type: string;
  plate: string;
  services: string[] | string;
  status: string;
  completed_at: string | null;
  created_at: string;
  target_minutes: number;
  source: 'customer_app' | 'walk_in';
  is_vip: boolean;
  bay_number: number | null;
  priority_position: number | null;
  queue_date: string | null;
};

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function QueueTVPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [now, setNow] = useState(new Date());
  const [loadError, setLoadError] = useState(false);
  const [servingIndex, setServingIndex] = useState(0);

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

  // Cycle through active jobs every 5 seconds
  useEffect(() => {
    const cycleTimer = setInterval(() => {
      setServingIndex((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(cycleTimer);
  }, []);

  async function loadQueue() {
    const today = todayISO();
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('queue_date', today)
      .order('queue_position', { ascending: true });

    if (error) {
      console.error('Queue TV load error:', error.message);
      setLoadError(true);
      return;
    }

    setLoadError(false);
    setWorkOrders((data as WorkOrder[]) || []);
  }

  const activeJobs = useMemo(
    () =>
      workOrders.filter(
        (w) => w.status === 'In Progress'
      ),
    [workOrders]
  );

  const pendingJobs = useMemo(
    () =>
      workOrders.filter(
        (w) => w.status === 'Pending'
      ),
    [workOrders]
  );

  const completedJobs = useMemo(
    () =>
      workOrders
        .filter(
          (w) => w.status === 'Completed' && w.completed_at
        )
        .slice(-12)
        .reverse(),
    [workOrders]
  );

  const nowServing = activeJobs.length > 0
    ? activeJobs[servingIndex % activeJobs.length]
    : null;

  const averageWait = Math.round(
    pendingJobs.reduce(
      (a, b) => a + Number(b.target_minutes || 20),
      0
    ) / Math.max(pendingJobs.length, 1)
  );

  const completedToday = completedJobs.length;

  const serviceBadgeClass = (service: string) => {
    const value = service.toLowerCase();
    if (value.includes('wash')) return 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30';
    if (value.includes('oil')) return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
    if (value.includes('repair')) return 'bg-rose-500/15 text-rose-300 border-rose-400/30';
    if (value.includes('diagnostic')) return 'bg-violet-500/15 text-violet-300 border-violet-400/30';
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
  };

  const sourceBadge = (order: WorkOrder) => {
    if (order.is_vip) {
      return (
        <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-300 border-yellow-400/30">
          ⭐ VIP
        </span>
      );
    }
    if (order.source === 'customer_app') {
      return (
        <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 border-violet-400/30">
          📱 Booked
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-slate-500/15 text-slate-300 border-slate-400/30">
        🚶 Walk-in
      </span>
    );
  };

  const bayBadge = (order: WorkOrder) => {
    if (!order.bay_number) return null;
    const colors: Record<number, string> = {
      1: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
      2: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
      3: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    };
    const cls = colors[order.bay_number] || 'bg-slate-500/15 text-slate-300 border-slate-400/30';
    return (
      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cls}`}>
        Bay {order.bay_number}
      </span>
    );
  };

  const renderServices = (services: WorkOrder['services']) => {
    const items = Array.isArray(services)
      ? services
      : String(services || 'General Service')
          .split(',')
          .map((s) => s.trim());

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((service, idx) => (
          <span
            key={idx}
            className={`px-3 py-1 rounded-full border text-xs font-semibold tracking-wide ${serviceBadgeClass(
              service
            )}`}
          >
            {service}
          </span>
        ))}
      </div>
    );
  };

  const stats: { label: string; value: string | number; tone: string }[] = [
    { label: 'Waiting', value: pendingJobs.length, tone: 'text-cyan-300' },
    { label: 'In Service', value: activeJobs.length, tone: 'text-emerald-300' },
    { label: 'Completed', value: completedToday, tone: 'text-sky-300' },
    { label: 'Avg Wait (min)', value: averageWait, tone: 'text-blue-300' },
  ];

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-[#02060d] text-white"
      style={{
        backgroundImage:
          'radial-gradient(1200px 700px at 50% 0%, rgba(34,211,238,0.10), transparent 60%), radial-gradient(900px 600px at 90% 100%, rgba(59,130,246,0.10), transparent 60%), radial-gradient(900px 600px at 5% 100%, rgba(14,165,233,0.08), transparent 60%), linear-gradient(180deg, #02060d 0%, #050a15 50%, #02060d 100%)',
      }}
    >
      {/* Ambient glow layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[1100px] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/4 h-[420px] w-[900px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute top-1/2 -right-40 h-[420px] w-[700px] rounded-full bg-sky-500/10 blur-[140px]" />
      </div>

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage:
            'radial-gradient(ellipse at center, black 50%, transparent 100%)',
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-col p-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-14 w-14 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 backdrop-blur-2xl flex items-center justify-center shadow-[0_0_40px_-10px_rgba(34,211,238,0.6)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/0" />
              <span className="relative text-2xl font-black tracking-tight text-cyan-300">
                K
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-[0.2em] text-white">
                KAKLINX <span className="text-cyan-300">AUTO</span> BAY MANAGER
              </h1>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.4em] text-slate-400">
                Live Service Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {loadError && (
              <div className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-1.5 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
                  Reconnecting
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                Live
              </span>
            </div>
            <div className="text-right">
              <div className="font-mono text-4xl font-bold tracking-tight text-white tabular-nums">
                {now.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {now.toLocaleDateString([], {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-4 gap-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl"
            >
              <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl transition-all group-hover:bg-cyan-500/20" />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                    {s.label}
                  </div>
                  <div className={`mt-2 text-5xl font-black tracking-tight tabular-nums ${s.tone}`}>
                    {s.value}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="mt-6 grid flex-1 min-h-0 grid-cols-12 gap-6">
          {/* UP NEXT */}
          <section className="col-span-3 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-3xl shadow-[0_0_60px_-20px_rgba(34,211,238,0.25)]">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                Up Next
              </h2>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                {pendingJobs.length}
              </span>
            </div>
            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-5 [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.3)_transparent]">
              {pendingJobs.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Queue is clear
                </div>
              )}
              {pendingJobs.map((job) => (
                <div
                  key={job.id}
                  className={`rounded-2xl border p-4 backdrop-blur-xl transition-colors ${
                    job.is_vip
                      ? 'border-yellow-400/30 bg-yellow-900/10 hover:border-yellow-400/50'
                      : 'border-white/5 bg-slate-900/40 hover:border-cyan-400/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-3xl font-black tracking-tight tabular-nums ${
                      job.is_vip ? 'text-yellow-300' : 'text-cyan-300'
                    }`}>
                      {job.queue_number}
                    </div>
                    <div className="flex items-center gap-2">
                      {sourceBadge(job)}
                    </div>
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-white">
                    {job.vehicle_type || 'Vehicle'}
                  </div>
                  <div className="text-xs text-slate-400">Plate: {job.plate || 'N/A'}</div>
                  <div className="mt-3">{renderServices(job.services)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* NOW SERVING */}
          <section className="col-span-6 relative flex min-h-0 flex-col overflow-hidden rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.07] via-blue-600/[0.04] to-transparent backdrop-blur-3xl shadow-[0_0_120px_-30px_rgba(34,211,238,0.5)]">
            {/* Ambient inner glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[120px]" />
              <div className="absolute -bottom-40 left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />
            </div>

            <div className="relative flex items-center justify-between border-b border-white/5 px-10 py-5">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
                </span>
                <h2 className="text-base font-semibold uppercase tracking-[0.4em] text-cyan-200">
                  Now Serving
                </h2>
              </div>
              {nowServing && (
                <div className="flex items-center gap-3">
                  {activeJobs.length > 1 && (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      {(servingIndex % activeJobs.length) + 1}/{activeJobs.length}
                    </span>
                  )}
                  {nowServing.is_vip && (
                    <span className="rounded-full border border-yellow-300/40 bg-yellow-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-200 backdrop-blur-xl">
                      ⭐ VIP
                    </span>
                  )}
                  {bayBadge(nowServing) && (
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] backdrop-blur-xl ${
                      nowServing.bay_number === 1 ? 'border-orange-300/40 bg-orange-400/15 text-orange-200' :
                      nowServing.bay_number === 2 ? 'border-blue-300/40 bg-blue-400/15 text-blue-200' :
                      'border-emerald-300/40 bg-emerald-400/15 text-emerald-200'
                    }`}>
                      Bay {nowServing.bay_number}
                    </span>
                  )}
                  <div className="rounded-full border border-cyan-300/40 bg-cyan-400/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-200 backdrop-blur-xl">
                    In Progress
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center px-10 py-8">
              {nowServing ? (
                <>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-400">
                    Queue Number
                  </div>
                  <div
                    className="mt-3 bg-gradient-to-b from-white via-cyan-100 to-cyan-300 bg-clip-text font-black leading-none tracking-tighter text-transparent"
                    style={{ fontSize: 'clamp(7rem, 14vw, 13rem)' }}
                  >
                    {nowServing.queue_number}
                  </div>

                  <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="text-3xl font-bold tracking-tight text-white">
                      {nowServing.vehicle_type || 'Vehicle'}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full border border-white/10 bg-white/5 px-5 py-1.5 text-base font-medium tracking-wider text-slate-200 backdrop-blur-xl">
                        Plate &middot; <span className="text-white">{nowServing.plate || 'N/A'}</span>
                      </div>
                      {sourceBadge(nowServing)}
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap justify-center gap-2">
                    {(Array.isArray(nowServing.services)
                      ? nowServing.services
                      : String(nowServing.services || 'General Service')
                          .split(',')
                          .map((s) => s.trim())
                    ).map((service, idx) => {
                      const cls = serviceBadgeClass(service);
                      return (
                        <span
                          key={idx}
                          className={`rounded-full border px-4 py-1.5 text-sm font-semibold backdrop-blur-xl ${cls}`}
                        >
                          {service}
                        </span>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex items-center gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-5 py-3 backdrop-blur-xl">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                    <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-200">
                      Service in progress &middot; Thank you for your patience
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.5em] text-slate-500">
                    Idle
                  </div>
                  <div className="text-6xl font-black tracking-tight text-slate-300">
                    Awaiting next vehicle
                  </div>
                  <div className="text-base text-slate-500">
                    The service bay is currently empty
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RECENTLY COMPLETED */}
          <section className="col-span-3 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-3xl shadow-[0_0_60px_-20px_rgba(59,130,246,0.25)]">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                Recently Completed
              </h2>
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-300">
                {completedJobs.length}
              </span>
            </div>
            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-5 [scrollbar-width:thin] [scrollbar-color:rgba(56,189,248,0.3)_transparent]">
              {completedJobs.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No completed jobs yet
                </div>
              )}
              {completedJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-white/5 bg-slate-900/40 p-3 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-black tracking-tight text-sky-300 tabular-nums">
                      {job.queue_number}
                    </div>
                    <div className="flex items-center gap-2">
                      {sourceBadge(job)}
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        Done
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-white">
                    {job.vehicle_type || 'Vehicle'}
                  </div>
                  <div className="text-xs text-slate-400">Plate: {job.plate || 'N/A'}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
