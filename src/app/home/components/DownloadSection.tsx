'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function DownloadSection() {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setSent(true);
      setPhone('');
    }
  };

  return (
    <section id="download" ref={ref} className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className={`bg-graphite border border-graphite-border rounded-3xl overflow-hidden fade-up ${visible ? 'visible' : ''}`}>
          <div className="relative p-8 md:p-14 text-center">
            {/* Background glow */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, #7C3AED, transparent)' }}
            />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-violet-dim border border-violet/30 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-violet-light animate-pulse" />
                <span className="text-xs font-semibold text-violet-light uppercase tracking-widest">Free Download</span>
              </div>

              <h2 className="font-fraunces text-4xl md:text-6xl font-bold text-clinical tracking-tight mb-4 leading-tight">
                Your cleanest car
                <br />
                <span className="gradient-text">starts here.</span>
              </h2>

              <p className="text-clinical-dim text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-light">
                Join 82,000+ drivers who stopped sitting in waiting rooms. Download Suds free and get your first wash at 20% off.
              </p>

              {/* App store buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                {/* iOS */}
                <a
                  href="#"
                  className="flex items-center gap-3 bg-clinical text-void px-6 py-3.5 rounded-2xl hover:bg-white transition-colors duration-200 w-full sm:w-auto justify-center"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] font-medium opacity-70 uppercase tracking-wide leading-none mb-0.5">Download on the</div>
                    <div className="text-base font-bold leading-none">App Store</div>
                  </div>
                </a>

                {/* Android */}
                <a
                  href="#"
                  className="flex items-center gap-3 bg-clinical text-void px-6 py-3.5 rounded-2xl hover:bg-white transition-colors duration-200 w-full sm:w-auto justify-center"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.18 23.76c.33.18.73.2 1.1.04l12.02-6.96-2.55-2.55-10.57 9.47zM.6 1.8C.23 2.17 0 2.75 0 3.52v16.96c0 .77.23 1.35.6 1.72l.09.08L9.6 13.38v-.2L.69 1.72.6 1.8zM20.47 10.36l-2.58-1.49-2.87 2.87 2.87 2.87 2.6-1.5c.74-.43.74-1.33-.02-1.75zM4.28.24L16.3 7.2l-2.55 2.55L3.18.28C3.55.12 3.95.06 4.28.24z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] font-medium opacity-70 uppercase tracking-wide leading-none mb-0.5">Get it on</div>
                    <div className="text-base font-bold leading-none">Google Play</div>
                  </div>
                </a>
              </div>

              {/* Text Me the Link */}
              <div className="max-w-sm mx-auto">
                <div className="text-xs text-clinical-dim uppercase tracking-widest mb-3">Or text me the link</div>
                {sent ? (
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Link sent! Check your phone.
                  </div>
                ) : (
                  <form onSubmit={handleSendLink} className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(312) 555-0100"
                      className="flex-1 bg-void border border-graphite-border rounded-xl px-4 py-3 text-clinical text-sm placeholder:text-clinical-dim focus:outline-none focus:border-violet/50 transition-colors"
                    />
                    <button
                      type="submit"
                      className="bg-violet text-white font-semibold px-5 py-3 rounded-xl hover:bg-violet-light transition-colors text-sm whitespace-nowrap shadow-violet-sm"
                    >
                      Send
                    </button>
                  </form>
                )}
                <p className="text-[10px] text-clinical-dim mt-2 opacity-60">
                  US numbers only. Standard messaging rates apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}