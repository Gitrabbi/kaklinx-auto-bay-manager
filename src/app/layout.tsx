import React from 'react';
import type { Metadata } from 'next';
import '../styles/tailwind.css';
import { AppDataProvider } from '../context/AppDataContext';

export const metadata: Metadata = {
  title: 'AutoWash — Bay Manager Dashboard',
  description: 'An all-in-one administrative suite to manage car wash work orders, staff commissions, time tracking, and vehicle identification for professional service bays.',
  icons: {
    icon: [
      { url: '/assets/images/app_logo.png', type: 'image/x-icon' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppDataProvider>
          {children}
        </AppDataProvider>

        <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fsuds177687838back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.18" />
        <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.2" /></body>
    </html>
  );
}