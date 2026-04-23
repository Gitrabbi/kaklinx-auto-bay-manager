'use client';
import React, { useEffect, useRef, useState } from 'react';

// Pulsing map dot component
function MapDot({ x, y, delay = 0 }: { x: string; y: string; delay?: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <div className="relative w-3 h-3">
        <div
          className="absolute inset-0 rounded-full bg-violet"
          style={{ animation: `pulseRing 2.5s ease-out ${delay}s infinite` }}
        />
        <div
          className="relative w-3 h-3 rounded-full bg-violet-light z-10"
          style={{ animation: `pulseDot 2.5s ease-in-out ${delay}s infinite` }}
        />
      </div>
    </div>
  );
}

// SVG Ring Chart
function SatisfactionRing({ animated }: { animated: boolean }) {
  const circumference = 2 * Math.PI * 45;
  const offset = animated ? circumference * 0.03 : circumference;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="#7C3AED"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 2.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-clinical font-fraunces">97%</span>
        <span className="text-[10px] text-clinical-dim uppercase tracking-widest">Satisfaction</span>
      </div>
    </div>
  );
}

export default function HeroDashboard() {
  const [ringAnimated, setRingAnimated] = useState(false);
  const [washCount, setWashCount] = useState(1247);
  const [textRevealed, setTextRevealed] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger text reveal
    const t = setTimeout(() => setTextRevealed(true), 200);

    // Trigger ring animation
    const t2 = setTimeout(() => setRingAnimated(true), 800);

    // Live counter tick
    const interval = setInterval(() => {
      setWashCount(prev => prev + Math.floor(Math.random() * 3));
    }, 4000);

    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden px-6 pt-24 pb-16">
      {/* Background glows */}
      <div
        className="glow-blob w-[600px] h-[600px] -top-40 left-1/2 -translate-x-1/2 opacity-20"
        style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
      />
      <div
        className="glow-blob w-[300px] h-[300px] bottom-20 -right-20 opacity-10"
        style={{ background: 'radial-gradient(circle, #9D5BF5 0%, transparent 70%)' }}
      />

      {/* Tagline above */}
      <div className="relative z-10 text-center mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-violet-dim border border-violet/30 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-violet-light animate-pulse" />
          <span className="text-xs font-semibold text-violet-light uppercase tracking-widest">Live · 1,200+ cities</span>
        </div>

        <h1 className="font-fraunces text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-clinical leading-[0.9] mb-4">
          <span className="reveal-text block">
            <span className={`reveal-inner block ${textRevealed ? 'revealed' : ''}`} style={{ transitionDelay: '0.05s' }}>
              Your car,
            </span>
          </span>
          <span className="reveal-text block">
            <span className={`reveal-inner block gradient-text ${textRevealed ? 'revealed' : ''}`} style={{ transitionDelay: '0.15s' }}>
              immaculate.
            </span>
          </span>
        </h1>
        <span className="reveal-text block">
          <span className={`reveal-inner block text-clinical-dim text-lg md:text-xl font-light max-w-xl mx-auto leading-relaxed mt-4 ${textRevealed ? 'revealed' : ''}`} style={{ transitionDelay: '0.3s' }}>
            Book a detail-quality wash in three taps. We come to your driveway, office lot, or anywhere your car sits.
          </span>
        </span>
      </div>

      {/* Dashboard Mockup — floating cards */}
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Central dashboard card */}
        <div className="float-c relative mx-auto max-w-2xl bg-graphite border border-graphite-border rounded-2xl p-6 shadow-card">
          {/* Dashboard header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[11px] text-clinical-dim uppercase tracking-widest mb-1">Today's Activity</div>
              <div className="live-counter text-4xl font-bold font-fraunces text-clinical tracking-tight">
                {washCount.toLocaleString()}
              </div>
              <div className="text-xs text-clinical-dim mt-0.5">washes booked today</div>
            </div>
            <div ref={ringRef}>
              <SatisfactionRing animated={ringAnimated} />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Avg. Wait', value: '00:08:32', sub: 'minutes' },
              { label: 'Active Washers', value: '342', sub: 'online now' },
              { label: 'Avg. Rating', value: '4.93', sub: 'out of 5.0' },
            ].map((stat) => (
              <div key={stat.label} className="bg-graphite-light rounded-xl p-3 border border-graphite-border">
                <div className="text-[10px] text-clinical-dim uppercase tracking-wide mb-1">{stat.label}</div>
                <div className="text-lg font-bold text-violet-light font-fraunces live-counter">{stat.value}</div>
                <div className="text-[10px] text-clinical-dim">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Mini map */}
          <div className="relative bg-void rounded-xl overflow-hidden h-36 border border-graphite-border">
            {/* Grid lines for map feel */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(124,58,237,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.4) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            {/* Road lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 144">
              <line x1="0" y1="72" x2="400" y2="72" stroke="#7C3AED" strokeWidth="1.5" />
              <line x1="200" y1="0" x2="200" y2="144" stroke="#7C3AED" strokeWidth="1.5" />
              <line x1="0" y1="36" x2="400" y2="36" stroke="#7C3AED" strokeWidth="0.5" />
              <line x1="0" y1="108" x2="400" y2="108" stroke="#7C3AED" strokeWidth="0.5" />
              <line x1="100" y1="0" x2="100" y2="144" stroke="#7C3AED" strokeWidth="0.5" />
              <line x1="300" y1="0" x2="300" y2="144" stroke="#7C3AED" strokeWidth="0.5" />
            </svg>
            {/* Pulsing washer dots */}
            <MapDot x="18%" y="25%" delay={0} />
            <MapDot x="35%" y="55%" delay={0.4} />
            <MapDot x="52%" y="30%" delay={0.8} />
            <MapDot x="65%" y="65%" delay={1.2} />
            <MapDot x="78%" y="40%" delay={0.2} />
            <MapDot x="44%" y="72%" delay={1.6} />
            <MapDot x="82%" y="20%" delay={0.6} />
            <div className="absolute bottom-2 right-3 text-[9px] text-clinical-dim uppercase tracking-widest">
              Live · Greater Chicago Metro
            </div>
          </div>
        </div>

        {/* Floating side card — left */}
        <div className="float-a absolute -left-4 md:-left-16 top-4 hidden md:block w-44 bg-graphite border border-graphite-border rounded-xl p-4 shadow-card">
          <div className="text-[10px] text-clinical-dim uppercase tracking-widest mb-2">Fleet Manager</div>
          <div className="text-2xl font-bold text-clinical font-fraunces">15</div>
          <div className="text-xs text-clinical-dim mb-3">vehicles scheduled</div>
          <div className="w-full bg-violet-dim rounded-full h-1.5">
            <div className="bg-violet rounded-full h-1.5 w-4/5" />
          </div>
          <div className="text-[10px] text-clinical-dim mt-1.5">12/15 confirmed</div>
        </div>

        {/* Floating side card — right */}
        <div className="float-b absolute -right-4 md:-right-16 top-8 hidden md:block w-44 bg-graphite border border-violet/20 rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-clinical-dim uppercase tracking-widest">Booking Now</span>
          </div>
          <div className="text-sm font-semibold text-clinical mb-1">Marcus T.</div>
          <div className="text-xs text-clinical-dim">Premium Detail</div>
          <div className="text-xs text-clinical-dim">ETA: 9 min</div>
          <div className="mt-3 bg-violet text-white text-[10px] font-semibold text-center py-1.5 rounded-lg">
            Washer En Route
          </div>
        </div>
      </div>

      {/* Hero tagline below dashboard */}
      <div className="relative z-10 mt-10 text-center">
        <p className={`reveal-text`}>
          <span className={`reveal-inner inline-block text-clinical-dim text-sm md:text-base font-light italic ${textRevealed ? 'revealed' : ''}`} style={{ transitionDelay: '0.5s' }}>
            "Your car's next wash is already scheduled. You just don't know it yet."
          </span>
        </p>
        <div className={`fade-up mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 ${textRevealed ? 'visible' : ''}`} style={{ transitionDelay: '0.6s' }}>
          <a
            href="#download"
            className="inline-flex items-center gap-2 bg-violet text-white font-semibold px-7 py-3.5 rounded-full hover:bg-violet-light transition-all duration-300 shadow-violet text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a.75.75 0 01.75.75v10.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L5.72 11.53a.75.75 0 111.06-1.06l2.47 2.47V2.75A.75.75 0 0110 2z"/></svg>
            Get the App Free
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 border border-graphite-border text-clinical-dim hover:text-clinical hover:border-clinical/30 font-medium px-7 py-3.5 rounded-full transition-all duration-300 text-sm"
          >
            See How It Works
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
        </div>
      </div>
    </section>
  );
}