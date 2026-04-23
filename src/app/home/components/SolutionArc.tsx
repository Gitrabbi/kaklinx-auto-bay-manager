'use client';
import React, { useEffect, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';

// Step card
function StepCard({ number, title, desc, delay = 0 }: {number: string;title: string;desc: string;delay?: number;}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {if (e.isIntersecting) setVisible(true);}, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`card-glow bg-graphite border border-graphite-border rounded-2xl p-6 relative overflow-hidden fade-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${delay}s` }}>
      <div className="absolute top-4 right-4 font-fraunces text-7xl font-bold text-clinical opacity-[0.04] leading-none select-none">{number}</div>
      <div className="w-10 h-10 rounded-xl bg-violet flex items-center justify-center text-white font-bold font-fraunces text-lg mb-5 relative z-10">
        {number}
      </div>
      <h3 className="font-fraunces text-xl font-semibold text-clinical mb-2 relative z-10">{title}</h3>
      <p className="text-sm text-clinical-dim leading-relaxed relative z-10">{desc}</p>
    </div>);

}

// Wash tier card
function WashTierCard({ tier, price, features, highlight, delay = 0

}: {tier: string;price: string;features: string[];highlight?: boolean;delay?: number;}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {if (e.isIntersecting) setVisible(true);}, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`card-glow rounded-2xl p-5 border fade-up ${visible ? 'visible' : ''} ${
      highlight ?
      'bg-violet-dim border-violet/40 shadow-violet-sm' :
      'bg-graphite border-graphite-border'}`
      }
      style={{ transitionDelay: `${delay}s` }}>
      
      {highlight &&
      <div className="inline-flex items-center gap-1.5 bg-violet text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          Most Popular
        </div>
      }
      <div className="text-xs text-clinical-dim uppercase tracking-widest mb-1">{tier}</div>
      <div className="font-fraunces text-3xl font-bold text-clinical mb-4">{price}<span className="text-sm font-normal text-clinical-dim">/wash</span></div>
      <ul className="space-y-2">
        {features.map((f, i) =>
        <li key={i} className="flex items-center gap-2 text-xs text-clinical-dim">
            <svg className={`w-3.5 h-3.5 flex-shrink-0 ${highlight ? 'text-violet-light' : 'text-clinical-dim'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        )}
      </ul>
    </div>);

}

const steps = [
{ number: '1', title: 'Pick your spot', desc: 'Drop a pin at your driveway, office parking lot, or apartment garage. Suds confirms availability in real time.' },
{ number: '2', title: 'Choose tier & time', desc: 'Select Express, Premium, or Full Detail. Pick a 30-minute arrival window — today, tomorrow, or recurring.' },
{ number: '3', title: 'Get on with your day', desc: 'Your washer arrives, does the work, and sends a photo confirmation. Your car glows. You did nothing.' }];


const tiers = [
{
  tier: 'Express',
  price: '$19',
  features: ['Exterior hand wash', 'Wheel clean', 'Windows', 'Tire shine', 'Door jambs'],
  highlight: false
},
{
  tier: 'Premium',
  price: '$39',
  features: ['Everything in Express', 'Interior vacuum', 'Dashboard wipe-down', 'Air freshener', 'Trunk clean'],
  highlight: true
},
{
  tier: 'Full Detail',
  price: '$89',
  features: ['Everything in Premium', 'Clay bar treatment', 'Hand wax / sealant', 'Leather conditioning', 'Engine bay clean'],
  highlight: false
}];


export default function SolutionArc() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const fleetRef = useRef<HTMLDivElement>(null);
  const [fleetVisible, setFleetVisible] = useState(false);

  useEffect(() => {
    const obs1 = new IntersectionObserver(([e]) => {if (e.isIntersecting) setHeaderVisible(true);}, { threshold: 0.3 });
    const obs2 = new IntersectionObserver(([e]) => {if (e.isIntersecting) setFleetVisible(true);}, { threshold: 0.2 });
    if (headerRef.current) obs1.observe(headerRef.current);
    if (fleetRef.current) obs2.observe(fleetRef.current);
    return () => {obs1.disconnect();obs2.disconnect();};
  }, []);

  return (
    <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
      {/* How It Works */}
      <div ref={headerRef} className={`mb-14 fade-up ${headerVisible ? 'visible' : ''}`}>
        <div className="inline-flex items-center gap-2 bg-void border border-graphite-border rounded-full px-4 py-1.5 mb-4">
          <span className="text-xs text-clinical-dim uppercase tracking-widest">How It Works</span>
        </div>
        <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-clinical tracking-tight leading-tight">
          Three taps.
          <span className="gradient-text"> One gleaming car.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
        {steps.map((s, i) => <StepCard key={i} {...s} delay={i * 0.1} />)}
      </div>

      {/* Wash Tiers */}
      <div className={`mb-10 fade-up ${headerVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.3s' }}>
        <div className="inline-flex items-center gap-2 bg-void border border-graphite-border rounded-full px-4 py-1.5 mb-4">
          <span className="text-xs text-clinical-dim uppercase tracking-widest">Wash Tiers</span>
        </div>
        <h2 className="font-fraunces text-3xl md:text-4xl font-bold text-clinical tracking-tight">
          Pick your level of
          <span className="text-clinical-dim italic font-light"> obsession.</span>
        </h2>
      </div>

      {/* Before/After + Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-20">
        {/* Before/After image */}
        <div className="lg:col-span-2 card-glow bg-graphite border border-graphite-border rounded-2xl overflow-hidden relative">
          <div className="relative h-64 lg:h-full min-h-[280px]">
            <AppImage
              src="https://img.rocket.new/generatedImages/rocket_gen_img_1728c61b3-1772184751142.png"
              alt="Freshly washed glossy black car paint close-up with violet reflections"
              fill
              className="object-cover" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-white bg-violet px-3 py-1 rounded-full">After Suds</span>
                <span className="text-xs text-clinical-dim">Premium Detail · 38 min</span>
              </div>
            </div>
            {/* Shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Tier cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tiers.map((t, i) => <WashTierCard key={i} {...t} delay={i * 0.12} />)}
        </div>
      </div>

      {/* Fleet Dashboard */}
      <div ref={fleetRef} id="fleet" className={`bg-graphite border border-graphite-border rounded-2xl overflow-hidden fade-up ${fleetVisible ? 'visible' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left: Fleet copy */}
          <div className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-graphite-border">
            <div className="inline-flex items-center gap-2 bg-void border border-graphite-border rounded-full px-4 py-1.5 mb-5">
              <span className="text-xs text-clinical-dim uppercase tracking-widest">Fleet Manager</span>
            </div>
            <h3 className="font-fraunces text-3xl md:text-4xl font-bold text-clinical tracking-tight mb-4">
              15 vehicles.<br />
              <span className="gradient-text">One dashboard.</span>
            </h3>
            <p className="text-clinical-dim text-sm leading-relaxed mb-6">
              Stop texting drivers to find out if their vehicle got washed. The Suds Fleet Dashboard shows every vehicle's wash status, last service date, and upcoming schedule in real time.
            </p>
            <ul className="space-y-3">
              {[
              'Bulk schedule all vehicles in 2 minutes',
              'Per-vehicle wash history & receipts',
              'Volume pricing from $14/wash',
              'Dedicated account manager'].
              map((item, i) =>
              <li key={i} className="flex items-center gap-3 text-sm text-clinical-dim">
                  <div className="w-5 h-5 rounded-full bg-violet-dim flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-violet-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              )}
            </ul>
            <button className="mt-8 inline-flex items-center gap-2 bg-violet text-white font-semibold px-6 py-3 rounded-full hover:bg-violet-light transition-colors text-sm shadow-violet-sm">
              Request Fleet Demo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </div>

          {/* Right: Fleet mini-dashboard */}
          <div className="p-6 md:p-8">
            <div className="text-xs text-clinical-dim uppercase tracking-widest mb-4">Fleet Overview · Acme Logistics</div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
              { label: 'Vehicles', value: '15' },
              { label: 'Scheduled', value: '12' },
              { label: 'Pending', value: '3' }].
              map((s) =>
              <div key={s.label} className="bg-graphite-light rounded-xl p-3 border border-graphite-border">
                  <div className="text-2xl font-bold font-fraunces text-clinical">{s.value}</div>
                  <div className="text-[10px] text-clinical-dim uppercase tracking-wide">{s.label}</div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {[
              { plate: 'IL-4821', type: 'Ford Transit', status: 'Washed Today', color: 'text-green-400' },
              { plate: 'IL-9034', type: 'Chevy Silverado', status: 'Scheduled 2PM', color: 'text-violet-light' },
              { plate: 'IL-2267', type: 'Toyota Camry', status: 'Washed Today', color: 'text-green-400' },
              { plate: 'IL-5518', type: 'Honda CR-V', status: 'Overdue 3 days', color: 'text-amber-400' },
              { plate: 'IL-7743', type: 'Ford F-150', status: 'Scheduled 4PM', color: 'text-violet-light' }].
              map((v, i) =>
              <div key={i} className="flex items-center justify-between bg-graphite-light rounded-lg px-3 py-2.5 border border-graphite-border">
                  <div className="flex items-center gap-3">
                    <div className="text-[10px] font-mono text-clinical bg-void rounded px-1.5 py-0.5">{v.plate}</div>
                    <div className="text-xs text-clinical-dim">{v.type}</div>
                  </div>
                  <div className={`text-[10px] font-semibold ${v.color}`}>{v.status}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>);

}