'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAppData } from '@/context/AppDataContext';


function normalizePhone(phone: string) {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('233')) {
    cleaned = '0' + cleaned.slice(3);
  }

  if (!cleaned.startsWith('0') && cleaned.length === 9) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}


export default function CustomerPortalPage() {
  const { pricing } = useAppData();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');  
  const [email, setEmail] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = [
    'https://images.pexels.com/photos/6873088/pexels-photo-6873088.jpeg?auto=compress&cs=tinysrgb&w=900',
    'https://images.pexels.com/photos/6873081/pexels-photo-6873081.jpeg?auto=compress&cs=tinysrgb&w=900',
    'https://images.pexels.com/photos/6873083/pexels-photo-6873083.jpeg?auto=compress&cs=tinysrgb&w=900',
    'https://images.pexels.com/photos/6873087/pexels-photo-6873087.jpeg?auto=compress&cs=tinysrgb&w=900',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    const savedData = localStorage.getItem('kaklinx_customer_order');

    if (!savedData) return;

    try {
      const data = JSON.parse(savedData);

      setCustomerName(data.customerName || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setVehicleMake(data.vehicleMake || '');
      setVehicleModel(data.vehicleModel || '');
      setLicensePlate(data.licensePlate || '');
      setVehicleType(data.vehicleType || '');
      setSelectedServices(data.selectedServices || []);
      setNotes(data.notes || '');
    } catch {
      localStorage.removeItem('kaklinx_customer_order');
    }
  }, []);

  useEffect(() => {
    const data = {
      customerName,
      phone,
      email,
      vehicleMake,
      vehicleModel,
      licensePlate,
      vehicleType,
      selectedServices,
      notes,
    };

    localStorage.setItem('kaklinx_customer_order', JSON.stringify(data));
  }, [
    customerName,
    phone,
    email,
    vehicleMake,
    vehicleModel,
    licensePlate,
    vehicleType,
    selectedServices,
    notes,
  ]);

  function getServiceName(service: any) {
    return (
      service.serviceName ||
      service.service_name ||
      service.service ||
      service.name ||
      service.description ||
      service.serviceType ||
      service.service_type ||
      service.title ||
      service.label ||
      service.type ||
      'Unnamed Service'
    );
  }

  function getServicePrice(service: any) {
    return Number(service.price || service.amount || service.cost || 0);
  }

  function getServiceKey(service: any, index: number) {
    return String(service.id || `${getServiceName(service)}-${index}`);
  }

  const availableVehicleTypes = useMemo(() => {
    const types = pricing.map((p: any) => p.vehicleType).filter(Boolean);
    return Array.from(new Set(types));
  }, [pricing]);

  const servicesForVehicle = useMemo(() => {
    if (!vehicleType) return [];
    return pricing.filter((p: any) => p.vehicleType === vehicleType);
  }, [pricing, vehicleType]);

  const totalAmount = useMemo(() => {
    return servicesForVehicle
      .filter((service: any, index: number) =>
        selectedServices.includes(getServiceKey(service, index))
      )
      .reduce((sum: number, service: any) => sum + getServicePrice(service), 0);
  }, [servicesForVehicle, selectedServices]);

  function toggleService(serviceKey: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceKey)
        ? prev.filter((s) => s !== serviceKey)
        : [...prev, serviceKey]
    );
  }

  function scrollToOrder() {
    document.getElementById('order-form')?.scrollIntoView({
      behavior: 'smooth',
    });
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (selectedServices.length === 0) {
      setErrorMsg('Please select at least one service.');
      setLoading(false);
      return;
    }

    const selectedServiceDetails = servicesForVehicle
      .filter((service: any, index: number) =>
        selectedServices.includes(getServiceKey(service, index))
      )
      .map((service: any) => ({
        serviceName: getServiceName(service),
        price: getServicePrice(service),
      }));

    const { error } = await supabase.from('customer_orders').insert({
      customer_name: customerName,
      phone: normalizePhone(phone),
      email,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      license_plate: licensePlate,
      vehicle_type: vehicleType,
      selected_services: selectedServiceDetails,
      total_amount: totalAmount,
      notes,
      status: 'pending',
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    localStorage.removeItem('kaklinx_customer_order');

    setSuccessMsg(
      'Your order has been submitted successfully. Our team will review it shortly.'
    );

    setCustomerName('');
    setPhone('');
    setEmail('');
    setVehicleMake('');
    setVehicleModel('');
    setLicensePlate('');
    setVehicleType('');
    setSelectedServices([]);
    setNotes('');
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/30 border-b border-white/5 shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="w-40 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg hover:bg-white/15 transition">
              <img
                src="/kaklinx-logo.jpg"
                alt="Kaklinx Auto"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-3">
              <Link
                href="/customer/orders"
                className="group flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition text-white font-bold shadow-lg"
              >
                <span>📍 Track Orders</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-sm text-blue-100 shadow-lg">
                  ✨ Premium Car Wash & Detailing
                </div>

                <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-lg">
                  Give your car the shine it deserves.
                </h1>

                <p className="text-blue-100 text-lg max-w-xl drop-shadow">
                  Select your vehicle, choose services, submit online, and track your order in real-time.
                </p>

                <button
                  onClick={scrollToOrder}
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5"
                >
                  <span>🚗 Start Order</span>
                  <span className="group-hover:translate-x-1 transition">→</span>
                </button>
              </div>

              {/* Hero Image Carousel */}
              <div className="relative h-[430px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/5 backdrop-blur-md">
                {heroImages.map((image, index) => (
                  <img
                    key={image}
                    src={image}
                    alt="Kaklinx Auto car wash"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                      index === currentImageIndex
                        ? 'opacity-100 scale-105'
                        : 'opacity-0 scale-100'
                    }`}
                  />
                ))}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 drop-shadow-lg">
                  <p className="text-sm text-blue-100">Premium wash experience</p>
                  <h3 className="text-2xl font-bold text-white">
                    Clean cars. Fresh look. Easy booking.
                  </h3>
                </div>

                <div className="absolute top-5 right-5 flex gap-2 z-10">
                  {heroImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? 'w-8 bg-white'
                          : 'w-2.5 bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Show image ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
                  <div
                    key={currentImageIndex}
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-[progress_4.5s_linear_forwards]"
                  />
                </div>

                <style jsx>{`
                  @keyframes progress {
                    from {
                      width: 0%;
                    }
                    to {
                      width: 100%;
                    }
                  }
                `}</style>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-4xl font-extrabold text-white drop-shadow">
              Services for every vehicle
            </h2>
            <p className="text-blue-100 mt-3">
              From quick exterior cleaning to full detailing, we have it all.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Exterior Wash',
                desc: 'Body wash, rinsing, drying, and clean finishing.',
                icon: '🚿',
              },
              {
                title: 'Interior Cleaning',
                desc: 'Seats, dashboard, mats, and interior surface refresh.',
                icon: '🧹',
              },
              {
                title: 'Full Detailing',
                desc: 'A complete clean for customers who want the best finish.',
                icon: '✨',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl hover:bg-white/15 hover:border-white/30 transition transform hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-blue-100 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Order Form Section */}
        <section id="order-form" className="max-w-6xl mx-auto px-6 pb-14">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-extrabold text-white drop-shadow">
                Create Your Order
              </h2>
              <p className="text-blue-100 text-sm mt-2">
                Fill in your vehicle details and choose services.
              </p>

              <form onSubmit={submitOrder} className="mt-8 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition"
                  />

                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition"
                  />

                  <input
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="License plate"
                    className="bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition"
                  />

                  <input
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="Vehicle make (e.g., Toyota)"
                    className="bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition"
                  />

                  <input
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Vehicle model (e.g., Corolla)"
                    className="bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition"
                  />
                </div>

                <select
                  required
                  value={vehicleType}
                  onChange={(e) => {
                    setVehicleType(e.target.value);
                    setSelectedServices([]);
                  }}
                  className="w-full bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition"
                >
                  <option value="">Select vehicle type</option>
                  {availableVehicleTypes.map((type: any) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                {vehicleType && (
                  <div className="border border-white/20 rounded-2xl p-6 bg-white/5 backdrop-blur">
                    <h3 className="font-bold text-white mb-4">Select Services</h3>

                    <div className="space-y-2">
                      {servicesForVehicle.map((service: any, index: number) => {
                        const serviceName = getServiceName(service);
                        const servicePrice = getServicePrice(service);
                        const serviceKey = getServiceKey(service, index);

                        return (
                          <label
                            key={serviceKey}
                            className="flex items-center justify-between bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 cursor-pointer hover:bg-white/10 hover:border-white/40 transition"
                          >
                            <span className="flex items-center gap-3 text-white">
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(serviceKey)}
                                onChange={() => toggleService(serviceKey)}
                                className="w-4 h-4 cursor-pointer"
                              />
                              {serviceName}
                            </span>

                            <span className="font-bold text-blue-300">
                              GHS {servicePrice.toFixed(2)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes (optional)"
                  className="w-full bg-white/5 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition min-h-24"
                />

                {errorMsg && (
                  <div className="bg-red-500/20 backdrop-blur border border-red-400/50 text-red-200 rounded-xl p-3 text-sm">
                    ⚠️ {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="bg-green-500/20 backdrop-blur border border-green-400/50 text-green-200 rounded-xl p-3 text-sm">
                    ✅ {successMsg}
                  </div>
                )}

                <button
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl py-4 shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5"
                >
                  {loading ? '⏳ Submitting...' : '✓ Submit Order Request'}
                </button>
              </form>
            </div>

            {/* Summary Sidebar */}
            <aside className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 h-fit sticky top-24">
              <h2 className="text-2xl font-bold text-white drop-shadow">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-3">
                  <p className="text-blue-200">Vehicle Type</p>
                  <p className="font-bold text-white text-lg">
                    {vehicleType || '—'}
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-3">
                  <p className="text-blue-200">Selected Services</p>
                  <p className="font-bold text-white text-lg">
                    {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur border border-white/20 rounded-xl p-4">
                  <p className="text-blue-200 text-xs">Estimated Total</p>
                  <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                    GHS {totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
