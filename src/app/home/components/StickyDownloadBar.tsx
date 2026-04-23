'use client';
import React, { useEffect, useState } from 'react';

export default function StickyDownloadBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.6 && !dismissed) {
        setVisible(true);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div className="sticky-bar-enter fixed bottom-0 left-0 right-0 z-50 bg-graphite/95 backdrop-blur-md border-t border-graphite-border px-4 py-3 md:py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="hidden sm:block">
          <div className="text-sm font-semibold text-clinical">Get the App Free</div>
          <div className="text-xs text-clinical-dim">20% off your first wash</div>
        </div>

        <div className="flex items-center gap-3 flex-1 sm:flex-none justify-center sm:justify-end">
          {/* iOS */}
          <a
            href="#"
            className="flex items-center gap-2 bg-clinical text-void px-4 py-2.5 rounded-xl hover:bg-white transition-colors text-sm font-bold"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span>App Store</span>
          </a>

          {/* Android */}
          <a
            href="#"
            className="flex items-center gap-2 bg-violet text-white px-4 py-2.5 rounded-xl hover:bg-violet-light transition-colors text-sm font-bold shadow-violet-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.76c.33.18.73.2 1.1.04l12.02-6.96-2.55-2.55-10.57 9.47zM.6 1.8C.23 2.17 0 2.75 0 3.52v16.96c0 .77.23 1.35.6 1.72l.09.08L9.6 13.38v-.2L.69 1.72.6 1.8zM20.47 10.36l-2.58-1.49-2.87 2.87 2.87 2.87 2.6-1.5c.74-.43.74-1.33-.02-1.75zM4.28.24L16.3 7.2l-2.55 2.55L3.18.28C3.55.12 3.95.06 4.28.24z"/>
            </svg>
            <span>Google Play</span>
          </a>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => { setDismissed(true); setVisible(false); }}
          className="text-clinical-dim hover:text-clinical transition-colors p-1.5 flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}