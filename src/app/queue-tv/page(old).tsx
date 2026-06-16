'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function QueueTVPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    loadQueue();

    const clock = setInterval(() => {
      setNow(new Date());
    }, 1000);

    const channel = supabase
      .channel('queue-tv-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
        },
        () => {
          loadQueue();
        }
      )
      .subscribe();

    return () => {
      clearInterval(clock);
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadQueue() {
    const { data } = await supabase
      .from('work_orders')
      .select('*')
      .order('queue_position', { ascending: true });

    setWorkOrders(data || []);
  }

  const activeJobs = useMemo(
    () =>
      workOrders.filter(
        (w) =>
          w.status === 'In Progress' ||
          w.status === 'in_progress'
      ),
    [workOrders]
  );

  const pendingJobs = useMemo(
    () =>
      workOrders
        .filter(
          (w) =>
            w.status === 'Pending' ||
            w.status === 'pending'
        )
        .sort(
          (a, b) =>
            Number(a.queue_position || a.queuePosition || 0) -
            Number(b.queue_position || b.queuePosition || 0)
        ),
    [workOrders]
  );

  const completedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return workOrders.filter((w) => {
      const completed =
        w.completed_at ||
        w.completedAt;

      return (
        completed &&
        String(completed).startsWith(today)
      );
    }).length;
  }, [workOrders]);

  const averageWait = useMemo(() => {
    if (!pendingJobs.length) return 0;

    const total = pendingJobs.reduce(
      (sum, w) =>
        sum +
        Number(
          w.target_minutes ||
            w.targetMinutes ||
            20
        ),
      0
    );

    return Math.round(total / pendingJobs.length);
  }, [pendingJobs]);

  const nowServing = activeJobs[0];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">

      {/* Header */}

      <div className="flex justify-between items-center mb-10">

        <div>
          <h1 className="text-5xl font-black tracking-wide">
            KAKLINX AUTO
          </h1>

          <p className="text-slate-300 text-xl mt-2">
            LIVE SERVICE QUEUE
          </p>
        </div>

        <div className="text-right">
          <div className="text-5xl font-bold">
            {now.toLocaleTimeString()}
          </div>

          <div className="text-slate-400">
            Real-Time Display
          </div>
        </div>

      </div>

      {/* Stats */}

      <div className="grid grid-cols-3 gap-6 mb-10">

        <div className="bg-blue-600 rounded-3xl p-6 text-center">
          <div className="text-lg text-blue-100">
            Waiting
          </div>

          <div className="text-6xl font-black">
            {pendingJobs.length}
          </div>
        </div>

        <div className="bg-green-600 rounded-3xl p-6 text-center">
          <div className="text-lg text-green-100">
            In Service
          </div>

          <div className="text-6xl font-black">
            {activeJobs.length}
          </div>
        </div>

        <div className="bg-purple-600 rounded-3xl p-6 text-center">
          <div className="text-lg text-purple-100">
            Avg Wait
          </div>

          <div className="text-6xl font-black">
            {averageWait}
          </div>

          <div className="text-xl">
            min
          </div>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-8">

        {/* Now Serving */}

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-8">

          <div className="text-3xl font-bold mb-6">
            NOW SERVING
          </div>

          {nowServing ? (
            <>
              <div className="text-8xl font-black mb-4">
                {nowServing.queue_number ||
                  nowServing.queueNumber}
              </div>

              <div className="text-3xl font-semibold">
                {nowServing.vehicle_type ||
                  nowServing.vehicleType ||
                  'Vehicle'}
              </div>

              <div className="mt-6 inline-block bg-white/20 px-5 py-2 rounded-full text-xl">
                IN PROGRESS
              </div>
            </>
          ) : (
            <div className="text-4xl text-green-100">
              No Active Vehicle
            </div>
          )}

        </div>

        {/* Queue */}

        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-700">

          <div className="text-3xl font-bold mb-6">
            UP NEXT
          </div>

          <div className="space-y-4">

            {pendingJobs.slice(0, 8).map(
              (job, index) => {
                const eta = pendingJobs
                  .slice(0, index)
                  .reduce(
                    (sum, j) =>
                      sum +
                      Number(
                        j.target_minutes ||
                          j.targetMinutes ||
                          20
                      ),
                    0
                  );

                return (
                  <div
                    key={job.id}
                    className="flex justify-between items-center bg-slate-800 rounded-2xl px-6 py-4"
                  >
                    <div>
                      <div className="text-3xl font-bold text-blue-400">
                        {job.queue_number ||
                          job.queueNumber}
                      </div>

                      <div className="text-slate-300">
                        Position #
                        {job.queue_position ||
                          job.queuePosition}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {eta} min
                      </div>

                      <div className="text-slate-400">
                        Estimated Wait
                      </div>
                    </div>
                  </div>
                );
              }
            )}

          </div>

        </div>

      </div>

      {/* Footer */}

      <div className="mt-10 text-center text-slate-500 text-lg">
        Completed Today: {completedToday}
      </div>

    </main>
  );
          }
