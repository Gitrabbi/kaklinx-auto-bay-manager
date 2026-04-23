import React from 'react';

const items = [
  'Detail-Quality Results',
  '★',
  'Arrives in Under 15 Min',
  '★',
  'No Waiting Rooms',
  '★',
  'Fleet Dashboard',
  '★',
  '97% Satisfaction Rate',
  '★',
  'Book in 3 Taps',
  '★',
  'Eco-Friendly Products',
  '★',
  'Background-Checked Washers',
  '★',
];

export default function MarqueeTicker() {
  return (
    <div className="py-5 border-y border-graphite-border overflow-hidden bg-graphite/40">
      <div className="whitespace-nowrap overflow-hidden">
        <span className="animate-marquee inline-flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-clinical-dim">
          {[...items, ...items]?.map((item, i) => (
            <span
              key={i}
              className={item === '★' ? 'text-violet' : ''}
            >
              {item}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}