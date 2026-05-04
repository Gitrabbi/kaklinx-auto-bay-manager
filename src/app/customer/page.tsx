'use client';

import React, { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAppData } from '@/context/AppDataContext';

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
      phone,
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
    <main className="min-h-screen bg-slate-100">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_#38bdf8,_transparent_35%),radial-gradient(circle_at_bottom_left,_#2563eb,_transparent_35%)]" />

        <div className="relative max-w-6xl mx-auto px-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div className="w-44 h-24 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow">
              <img
                src="/kaklinx-logo.jpg"
                alt="Kaklinx Auto"
                className="w-full h-full object-contain"
              />
            </div>

            <button
              onClick={scrollToOrder}
              className="hidden sm:inline-flex bg-white text-blue-950 font-bold px-5 py-3 rounded-xl hover:bg-blue-50 transition"
            >
              Book a Wash
            </button>
          </header>

          <div className="grid lg:grid-cols-2 gap-10 items-center py-12">
            <div>
              <p className="inline-flex rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-blue-100">
                Premium Car Wash & Detailing Services
              </p>

              <h1 className="text-4xl lg:text-6xl font-extrabold mt-6 leading-tight">
                Give your car the clean, fresh look it deserves.
              </h1>

              <p className="text-blue-100 text-lg mt-5 max-w-xl">
                Select your vehicle type, choose the services you need, and submit
                your wash request online. Our team will review and process your
                order quickly.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={scrollToOrder}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
                >
                  Start Order
                </button>

                <button
                  onClick={() =>
                    document.getElementById('services')?.scrollIntoView({
                      behavior: 'smooth',
                    })
                  }
                  className="bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl"
                >
                  View Services
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl overflow-hidden shadow-2xl bg-white/10 border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80"
                  alt="Clean car"
                  className="h-64 w-full object-cover"
                />
              </div>

              <div className="rounded-3xl overflow-hidden shadow-2xl bg-white/10 border border-white/10 mt-10">
                <img
                  src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=80"
                  alt="Luxury car wash"
                  className="h-64 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Services for every vehicle type
          </h2>
          <p className="text-slate-500 mt-3">
            From quick exterior cleaning to full wash and detailing, choose the
            right service for your vehicle.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {[
            {
              title: 'Exterior Wash',
              desc: 'Body wash, rinsing, drying, and clean finishing.',
              img: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=900&q=80',
            },
            {
              title: 'Interior Cleaning',
              desc: 'Seats, dashboard, mats, and interior surface refresh.',
              img: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=80',
            },
            {
              title: 'Full Detailing',
              desc: 'A complete clean for customers who want the best finish.',
              img: 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=900&q=80',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-3xl overflow-hidden shadow-xl border"
            >
              <img
                src={item.img}
                alt={item.title}
                className="h-48 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-slate-500 mt-2 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="order-form" className="max-w-6xl mx-auto px-6 pb-14">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border p-6">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Create Your Order
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Fill in your vehicle details and choose your preferred services.
            </p>

            <form onSubmit={submitOrder} className="mt-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="border rounded-xl px-4 py-3" />
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="border rounded-xl px-4 py-3" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email optional" className="border rounded-xl px-4 py-3" />
                <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="License plate" className="border rounded-xl px-4 py-3" />
                <input value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="Vehicle make e.g. Toyota" className="border rounded-xl px-4 py-3" />
                <input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Vehicle model e.g. Corolla" className="border rounded-xl px-4 py-3" />
              </div>

              <select
                required
                value={vehicleType}
                onChange={(e) => {
                  setVehicleType(e.target.value);
                  setSelectedServices([]);
                }}
                className="w-full border rounded-xl px-4 py-3"
              >
                <option value="">Select vehicle type</option>
                {availableVehicleTypes.map((type: any) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {vehicleType && (
                <div className="border rounded-2xl p-4 bg-slate-50">
                  <h3 className="font-bold text-slate-800 mb-3">
                    Select Services
                  </h3>

                  <div className="space-y-2">
                    {servicesForVehicle.map((service: any, index: number) => {
                      const serviceName = getServiceName(service);
                      const servicePrice = getServicePrice(service);
                      const serviceKey = getServiceKey(service, index);

                      return (
                        <label
                          key={serviceKey}
                          className="flex items-center justify-between bg-white border rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400"
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(serviceKey)}
                              onChange={() => toggleService(serviceKey)}
                            />
                            {serviceName}
                          </span>

                          <span className="font-bold text-blue-700">
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
                placeholder="Additional notes optional"
                className="w-full border rounded-xl px-4 py-3 min-h-24"
              />

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                  {successMsg}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl py-4"
              >
                {loading ? 'Submitting...' : 'Submit Order Request'}
              </button>
            </form>
          </div>

          <aside className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white rounded-3xl shadow-xl border border-white/10 p-6 h-fit sticky top-6">
            <h2 className="text-xl font-bold">Order Summary</h2>

            <div className="mt-5 space-y-4 text-sm">
              <p>
                <span className="text-blue-200">Vehicle Type:</span>
                <br />
                <span className="font-bold">{vehicleType || 'Not selected'}</span>
              </p>

              <p>
                <span className="text-blue-200">Selected Services:</span>
                <br />
                <span className="font-bold">{selectedServices.length}</span>
              </p>

              <div className="border-t border-white/10 pt-4">
                <p className="text-blue-200 text-xs">Estimated Total</p>
                <p className="text-3xl font-extrabold">
                  GHS {totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
