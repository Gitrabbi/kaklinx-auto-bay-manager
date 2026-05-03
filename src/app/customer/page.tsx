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
      .filter((service: any, index: number) => {
        const serviceKey = getServiceKey(service, index);
        return selectedServices.includes(serviceKey);
      })
      .reduce(
        (sum: number, service: any) => sum + getServicePrice(service),
        0
      );
  }, [servicesForVehicle, selectedServices]);

  function toggleService(serviceKey: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceKey)
        ? prev.filter((s) => s !== serviceKey)
        : [...prev, serviceKey]
    );
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
      .filter((service: any, index: number) => {
        const serviceKey = getServiceKey(service, index);
        return selectedServices.includes(serviceKey);
      })
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
      <section className="bg-slate-900 text-white px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold">KaklinxAuto Washing Bay</h1>
          <p className="text-slate-300 mt-2">
            View services and request a car wash order online.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow border p-6">
          <h2 className="text-xl font-bold text-slate-900">Create Order</h2>

          <form onSubmit={submitOrder} className="mt-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="border rounded-lg px-3 py-2"
              />

              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="border rounded-lg px-3 py-2"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email optional"
                className="border rounded-lg px-3 py-2"
              />

              <input
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="License plate"
                className="border rounded-lg px-3 py-2"
              />

              <input
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="Vehicle make e.g. Toyota"
                className="border rounded-lg px-3 py-2"
              />

              <input
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Vehicle model e.g. Corolla"
                className="border rounded-lg px-3 py-2"
              />
            </div>

            <select
              required
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value);
                setSelectedServices([]);
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select vehicle type</option>
              {availableVehicleTypes.map((type: any) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {vehicleType && (
              <div className="border rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-3">
                  Select Services
                </h3>

                <div className="space-y-2">
                  {servicesForVehicle.map((service: any, index: number) => {
                    console.log('SERVICE DATA:', service);
                    const serviceName = getServiceName(service);
                    const servicePrice = getServicePrice(service);
                    const serviceKey = getServiceKey(service, index);

                    return (
                      <label
                        key={serviceKey}
                        className="flex items-center justify-between border rounded-lg px-3 py-2 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(serviceKey)}
                            onChange={() => toggleService(serviceKey)}
                          />
                          {serviceName}
                        </span>

                        <span className="font-semibold">
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
              className="w-full border rounded-lg px-3 py-2 min-h-24"
            />

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
                {successMsg}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold rounded-lg py-3"
            >
              {loading ? 'Submitting...' : 'Submit Order Request'}
            </button>
          </form>
        </div>

        <aside className="bg-white rounded-2xl shadow border p-6 h-fit">
          <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Vehicle Type:</span>{' '}
              <span className="font-semibold">
                {vehicleType || 'Not selected'}
              </span>
            </p>

            <p>
              <span className="text-slate-500">Services:</span>{' '}
              <span className="font-semibold">{selectedServices.length}</span>
            </p>

            <p className="text-2xl font-bold text-blue-700 pt-3">
              GHS {totalAmount.toFixed(2)}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
