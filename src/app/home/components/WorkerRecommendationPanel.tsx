'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Worker } from '../../../context/AppDataContext';

interface Props {
  workers: Worker[];
  selectedServices: string[];
  assignedWorkers: string[];
  onSelectWorker: (workerId: string) => void;
}

interface WorkerPerformance {
  workerId: string;
  jobsCompleted: number;
  averageCompletionMinutes: number;
  averageRating: number;
  speedScore: number;
  qualityScore: number;
  levelName: string;
  badgeName: string;
  extraCommissionRate: number;
}

function dbToPerformance(row: any): WorkerPerformance {
  return {
    workerId: row.worker_id,
    jobsCompleted: Number(row.jobs_completed || 0),
    averageCompletionMinutes: Number(row.average_completion_minutes || 0),
    averageRating: Number(row.average_rating || 0),
    speedScore: Number(row.speed_score || 0),
    qualityScore: Number(row.quality_score || 0),
    levelName: row.level_name || 'Starter',
    badgeName: row.badge_name || 'New Worker',
    extraCommissionRate: Number(row.extra_commission_rate || 0),
  };
}

export default function WorkerRecommendationPanel({
  workers,
  selectedServices,
  assignedWorkers,
  onSelectWorker,
}: Props) {
  const [performance, setPerformance] = useState<Record<string, WorkerPerformance>>({});
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadPerformance() {
      const { data, error } = await supabase
        .from('worker_performance')
        .select('*');

      if (error) {
        console.error('Worker recommendation load error:', error.message);
        setLoadError(`Failed to load worker performance: ${error.message}`);
        return;
      }
      setLoadError('');

      const mapped: Record<string, WorkerPerformance> = {};
      (data || []).forEach((row) => {
        const item = dbToPerformance(row);
        mapped[item.workerId] = item;
      });

      setPerformance(mapped);
    }

    loadPerformance();
  }, []);

  const recommendations = useMemo(() => {
    const activeWorkers = workers.filter((w) => w.status === 'active');

    return activeWorkers
      .map((worker) => {
        const perf = performance[worker.id];

        const speedScore = perf?.speedScore || 50;
        const qualityScore = perf?.qualityScore || 50;
        const ratingScore = perf?.averageRating ? perf.averageRating * 20 : 50;
        const experienceScore = Math.min((perf?.jobsCompleted || 0) * 2, 100);

        const isPremiumJob = selectedServices.some((s) =>
          s.toLowerCase().includes('premium') ||
          s.toLowerCase().includes('interior') ||
          s.toLowerCase().includes('engine')
        );

        const jobFitBonus = isPremiumJob
          ? qualityScore * 0.25 + ratingScore * 0.25
          : speedScore * 0.25 + experienceScore * 0.15;

        const finalScore =
          speedScore * 0.3 +
          qualityScore * 0.3 +
          ratingScore * 0.25 +
          experienceScore * 0.15 +
          jobFitBonus;

        let reason = 'Balanced performance';

        if (isPremiumJob && qualityScore >= 80) {
          reason = 'Best fit for premium/detailing job';
        } else if (speedScore >= 85) {
          reason = 'Fast completion history';
        } else if (ratingScore >= 85) {
          reason = 'High customer rating';
        } else if ((perf?.jobsCompleted || 0) >= 20) {
          reason = 'Experienced worker';
        }

        return {
          worker,
          perf,
          finalScore,
          reason,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 3);
  }, [workers, performance, selectedServices]);

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 p-3 bg-red-50">
        <p className="text-xs font-semibold text-red-700">AI Worker Recommendation</p>
        <p className="text-xs text-red-600 mt-1">{loadError}</p>
      </div>
    );
  }

  if (selectedServices.length === 0) {
    return (
      <div className="rounded-lg border p-3 bg-slate-50">
        <p className="text-xs font-semibold text-slate-700">
          AI Worker Recommendation
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Select services first to get worker recommendations.
        </p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="rounded-lg border p-3 bg-slate-50">
        <p className="text-xs font-semibold text-slate-700">
          AI Worker Recommendation
        </p>
        <p className="text-xs text-slate-500 mt-1">
          No active workers available for recommendation.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 bg-blue-50" style={{ borderColor: 'hsl(205 78% 42%)' }}>
      <p className="text-sm font-semibold text-blue-800">
        AI Worker Recommendation
      </p>
      <p className="text-xs text-blue-700 mt-1">
        Suggested workers based on speed, quality, rating, and job type.
      </p>

      <div className="space-y-2 mt-3">
        {recommendations.map(({ worker, perf, finalScore, reason }, index) => {
          const alreadyAssigned = assignedWorkers.includes(worker.id);

          return (
            <div
              key={worker.id}
              className="rounded-lg bg-white border p-3 flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                    {worker.initials}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {index + 1}. {worker.name}
                  </p>
                </div>

                <p className="text-xs text-slate-500 mt-1">{reason}</p>

                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Score {finalScore.toFixed(0)}%
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Rating {(perf?.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {perf?.badgeName || 'New Worker'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectWorker(worker.id)}
                disabled={alreadyAssigned}
                className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                  alreadyAssigned
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {alreadyAssigned ? 'Assigned' : 'Assign'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
