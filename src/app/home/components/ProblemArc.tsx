'use client';
import React, { useEffect, useRef, useState } from 'react';

interface ProblemCardProps {
  icon: React.ReactNode;
  stat: string;
  statLabel: string;
  painTitle: string;
  painDesc: string;
  solutionTitle: string;
  solutionDesc: string;
  delay?: number;
}

function ProblemCard({ icon, stat, statLabel, painTitle, painDesc, solutionTitle, solutionDesc, delay = 0 }: ProblemCardProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`flip-card h-64 fade-up ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      <div className="flip-card-inner rounded-2xl">
        {/* Front — Pain */}
        <div className="flip-front bg-graphite border border-graphite-border rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-void flex items-center justify-center text-clinical-dim">
              {icon}
            </div>
            <span className="text-[10px] text-clinical-dim uppercase tracking-widest border border-graphite-border rounded-full px-2 py-1">Pain Point</span>
          </div>
          <div>
            <div className="text-4xl font-bold font-fraunces text-clinical tracking-tighter mb-1">{stat}</div>
            <div className="text-xs text-clinical-dim uppercase tracking-wide mb-3">{statLabel}</div>
            <div className="text-sm font-semibold text-clinical mb-1">{painTitle}</div>
            <div className="text-xs text-clinical-dim leading-relaxed">{painDesc}</div>
          </div>
        </div>
        {/* Back — Solution */}
        <div className="flip-back bg-violet-dim border border-violet/30 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-violet flex items-center justify-center text-white">
              {icon}
            </div>
            <span className="text-[10px] text-violet-light uppercase tracking-widest border border-violet/30 rounded-full px-2 py-1">Solved</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-clinical mb-2">{solutionTitle}</div>
            <div className="text-xs text-clinical-dim leading-relaxed">{solutionDesc}</div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-violet-light text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Suds handles this
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const problems = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
        <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
      </svg>
    ),
    stat: '3.2 hrs',
    statLabel: 'per month wasted',
    painTitle: 'The waiting room tax',
    painDesc: 'Every trip to a car wash costs you 40+ minutes you never budget for. That\'s almost a full work day every month.',
    solutionTitle: 'Your time, reclaimed',
    solutionDesc: 'Schedule while you sleep. A Suds washer arrives at your location — you don\'t move. Average on-site time: 22 minutes.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    stat: '6×',
    statLabel: 'appointments missed',
    painTitle: 'The scheduling black hole',
    painDesc: 'Car washes don\'t fit into calendars. You can\'t book them in advance, so they get pushed to "someday" — indefinitely.',
    solutionTitle: 'Recurring washes, zero effort',
    solutionDesc: 'Set a weekly or bi-weekly schedule once. Suds auto-books the slot, sends a reminder, and adjusts if you\'re out of town.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    stat: '$340',
    statLabel: 'overspent per year',
    painTitle: 'Inconsistent quality, premium price',
    painDesc: 'Tunnel washes scratch your paint. Detailers charge $200 a visit. You pay premium prices for mediocre, unpredictable results.',
    solutionTitle: 'Detail quality, subscription price',
    solutionDesc: 'Certified washers, clay-bar finish available from $29. Transparent pricing, no upsell pressure, same quality every time.',
  },
];

export default function ProblemArc() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHeaderVisible(true); },
      { threshold: 0.3 }
    );
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
      <div ref={headerRef} className={`mb-14 fade-up ${headerVisible ? 'visible' : ''}`}>
        <div className="inline-flex items-center gap-2 bg-void border border-graphite-border rounded-full px-4 py-1.5 mb-4">
          <span className="text-xs text-clinical-dim uppercase tracking-widest">The Problem</span>
        </div>
        <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-clinical tracking-tight leading-tight max-w-2xl">
          Why your car is still dirty
          <span className="text-clinical-dim italic font-light"> right now.</span>
        </h2>
        <p className="text-clinical-dim text-base mt-3 max-w-lg leading-relaxed">
          Hover each card to see how Suds flips the equation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {problems.map((p, i) => (
          <ProblemCard key={i} {...p} delay={i * 0.1} />
        ))}
      </div>
    </section>
  );
}