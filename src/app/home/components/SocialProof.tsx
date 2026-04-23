'use client';
import React, { useEffect, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';

function StarRating({ rating }: {rating: number;}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) =>
      <svg key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-violet-light' : 'text-graphite-light'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
    </div>);

}

interface TestimonialCardProps {
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatar: string;
  avatarAlt: string;
  tag?: string;
  delay?: number;
}

function TestimonialCard({ name, role, quote, rating, avatar, avatarAlt, tag, delay = 0 }: TestimonialCardProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {if (e.isIntersecting) setVisible(true);}, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`card-glow bg-graphite border border-graphite-border rounded-2xl p-6 flex flex-col justify-between fade-up ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${delay}s` }}>
      
      <div>
        <div className="flex items-start justify-between mb-4">
          <StarRating rating={rating} />
          {tag &&
          <span className="text-[10px] text-violet-light border border-violet/30 rounded-full px-2 py-0.5 uppercase tracking-widest">{tag}</span>
          }
        </div>
        <p className="text-sm text-clinical leading-relaxed mb-5 font-light">"{quote}"</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-graphite-light">
          <AppImage
            src={avatar}
            alt={avatarAlt}
            width={36}
            height={36}
            className="w-full h-full object-cover" />
          
        </div>
        <div>
          <div className="text-sm font-semibold text-clinical">{name}</div>
          <div className="text-[11px] text-clinical-dim">{role}</div>
        </div>
      </div>
    </div>);

}

// Live counter
function LiveWashCounter() {
  const [count, setCount] = useState(84219);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {if (e.isIntersecting) setVisible(true);}, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 4) + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <div ref={ref} className={`card-glow bg-graphite border border-graphite-border rounded-2xl p-8 text-center fade-up ${visible ? 'visible' : ''}`}>
      <div className="text-xs text-clinical-dim uppercase tracking-widest mb-3">Total Washes Completed</div>
      <div className="font-fraunces text-5xl md:text-6xl font-bold live-counter gradient-text mb-2">
        {count.toLocaleString()}
      </div>
      <div className="flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-clinical-dim">and counting — live</span>
      </div>
    </div>);

}

const testimonials: TestimonialCardProps[] = [
{
  name: 'Deja Washington',
  role: 'Marketing Director · Chicago, IL',
  quote: 'I scheduled my first wash while I was brushing my teeth. By the time I got to work, I had a photo confirmation. My car looked like it just left a dealership.',
  rating: 5,
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_19892f663-1763301833185.png",
  avatarAlt: 'Deja Washington, smiling woman in professional attire',
  tag: 'Commuter'
},
{
  name: 'Rafael Mendoza',
  role: 'Operations Manager · Apex Logistics',
  quote: 'We run 14 vehicles out of our Chicago office. Before Suds, I spent 3 hours a week chasing wash receipts. Now I get a weekly report automatically. Game-changer for our fleet.',
  rating: 5,
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11a2e4a58-1763295038790.png",
  avatarAlt: 'Rafael Mendoza, man in business casual shirt',
  tag: 'Fleet'
},
{
  name: 'Priya Nair',
  role: 'Software Engineer · Remote',
  quote: 'The Premium tier is what got me. Interior vacuum, dashboard wipe, and the car smells new. I\'ve done it four times this month. Worth every dollar.',
  rating: 5,
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_170e2eca9-1772146199279.png",
  avatarAlt: 'Priya Nair, woman with dark hair smiling outdoors'
}];


export default function SocialProof() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {if (e.isIntersecting) setHeaderVisible(true);}, { threshold: 0.3 });
    if (headerRef.current) obs.observe(headerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div ref={headerRef} className={`mb-14 fade-up ${headerVisible ? 'visible' : ''}`}>
        <div className="inline-flex items-center gap-2 bg-void border border-graphite-border rounded-full px-4 py-1.5 mb-4">
          <span className="text-xs text-clinical-dim uppercase tracking-widest">Social Proof</span>
        </div>
        <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-clinical tracking-tight leading-tight">
          82,000+ drivers
          <span className="text-clinical-dim italic font-light"> already know.</span>
        </h2>
      </div>

      {/* Live counter — full width */}
      <div className="mb-4">
        <LiveWashCounter />
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {testimonials.map((t, i) =>
        <TestimonialCard key={i} {...t} delay={i * 0.1} />
        )}
      </div>

      {/* App store ratings bar */}
      <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 fade-up ${headerVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.4s' }}>
        {[
        { store: 'App Store', rating: '4.9', reviews: '18,400+', icon: 'M12.152 6.4l-2.4 4.8H6.4L9.6 6.4H12.152z' },
        { store: 'Google Play', rating: '4.8', reviews: '22,100+', icon: 'M3 12l9-9 9 9-9 9-9-9z' }].
        map((s) =>
        <div key={s.store} className="card-glow bg-graphite border border-graphite-border rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-void flex items-center justify-center">
                <svg className="w-5 h-5 text-clinical-dim" fill="currentColor" viewBox="0 0 24 24">
                  <path d={s.icon} />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-clinical">{s.store}</div>
                <div className="text-xs text-clinical-dim">{s.reviews} ratings</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-fraunces text-2xl font-bold text-clinical">{s.rating}</div>
              <StarRating rating={5} />
            </div>
          </div>
        )}
      </div>
    </section>);

}