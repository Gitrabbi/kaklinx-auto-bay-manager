'use client';
import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface PricingTier {
  name: string;
  price: string;
  services: string[];
  popular?: boolean;
  color: string;
  bgColor: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Basic Wash',
    price: 'GH₵ 25',
    services: ['Exterior Body Wash', 'Wheel Rinse', 'Window Clean', 'Air Dry'],
    color: 'hsl(215 10% 48%)',
    bgColor: 'hsl(210 15% 97%)',
  },
  {
    name: 'Standard Wash',
    price: 'GH₵ 45',
    services: ['Body Wash', 'Under Wash', 'Interior Vacuum', 'Dashboard Wipe', 'Air Freshener'],
    popular: true,
    color: 'hsl(205 78% 42%)',
    bgColor: 'hsla(205, 78%, 42%, 0.05)',
  },
  {
    name: 'Premium Detail',
    price: 'GH₵ 80',
    services: ['Full Body Wash', 'Engine Wash', 'Under Wash', 'Interior Detail', 'Wax Polish', 'Leather Conditioning'],
    color: 'hsl(25 95% 53%)',
    bgColor: 'hsla(25, 95%, 53%, 0.05)',
  },
];

export default function PricingSection() {
  return (
    <div
      className="bg-white rounded-xl border p-5"
      style={{ borderColor: 'hsl(210 18% 89%)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold" style={{ color: 'hsl(215 25% 12%)' }}>
          Service Pricing
        </h2>
        <button
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{
            backgroundColor: 'hsla(205, 78%, 42%, 0.1)',
            color: 'hsl(205 78% 42%)',
          }}
        >
          <PencilSquareIcon className="w-3.5 h-3.5" />
          Edit Pricing
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {pricingTiers.map((tier) => (
          <div
            key={tier.name}
            className="rounded-xl p-4 border relative card-hover"
            style={{
              borderColor: tier.popular ? tier.color : 'hsl(210 18% 89%)',
              backgroundColor: tier.bgColor,
            }}
          >
            {tier.popular && (
              <div
                className="absolute -top-2.5 left-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: 'hsl(205 78% 42%)' }}
              >
                <StarIcon className="w-2.5 h-2.5" />
                Most Popular
              </div>
            )}
            <div className="mb-3">
              <p
                className="text-xs font-medium uppercase tracking-widest mb-1"
                style={{ color: 'hsl(215 10% 48%)' }}
              >
                {tier.name}
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: 'hsl(215 25% 12%)' }}
              >
                {tier.price}
                <span
                  className="text-xs font-normal ml-1"
                  style={{ color: 'hsl(215 10% 48%)' }}
                >
                  /vehicle
                </span>
              </p>
            </div>
            <ul className="space-y-1.5">
              {tier.services.map((service) => (
                <li
                  key={service}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'hsl(215 25% 12%)' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tier.color }}
                  />
                  {service}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
