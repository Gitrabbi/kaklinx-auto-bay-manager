'use client';

import React, { useMemo, useState } from 'react';
import { useAppData } from '@/context/AppDataContext';

type UtilityType = 'electricity' | 'water';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function currentHour() {
  return new Date().getHours();
}

function money(value: number) {
  return `GH₵ ${Number(value || 0).toFixed(2)}`;
}

export default function UtilityTracker() {
  const { utilityLogs, saveUtilityOpening, saveUtilityClosing } = useAppData();

  const [electricityOpening, setElectricityOpening] = useState('');
  const [electricityOpeningCost, setElectricityOpeningCost] = useState('');
  const [electricityClosing, setElectricityClosing] = useState('');
  const [electricityClosingCost, setElectricityClosingCost] = useState('');

  const [waterOpening, setWaterOpening] = useState('');
  const [waterOpeningCost, setWaterOpeningCost] = useState('');
  const [waterClosing, setWaterClosing] = useState('');
  const [waterClosingCost, setWaterClosingCost] = useState('');

  const today = todayISO();
  const isAfter8pm = currentHour() >= 20;

  const electricityLog = utilityLogs.find((log: any) => log.logDate === today && log.utilityType === 'electricity');
  const waterLog = utilityLogs.find((log: any) => log.logDate === today && log.utilityType === 'water');

  const summary = useMemo(() => {
    const electricityConsumption = Number(electricityLog?.closingReading || 0) - Number(electricityLog?.openingReading || 0);
    const electricityCost = Number(electricityLog?.closingCost || 0) - Number(electricityLog?.openingCost || 0);
    const waterConsumption = Number(waterLog?.closingReading || 0) - Number(waterLog?.openingReading || 0);
    const waterCost = Number(waterLog?.closingCost || 0) - Number(waterLog?.openingCost || 0);

    return {
      electricityConsumption: Math.max(electricityConsumption, 0),
      electricityCost: Math.max(electricityCost, 0),
      waterConsumption: Math.max(waterConsumption, 0),
      waterCost: Math.max(waterCost, 0),
    };
  }, [electricityLog, waterLog]);

  const handleOpening = async (type: UtilityType) => {
    if (type === 'electricity') {
      await saveUtilityOpening({ utilityType: 'electricity', openingReading: Number(electricityOpening || 0), openingCost: Number(electricityOpeningCost || 0) });
      setElectricityOpening(''); setElectricityOpeningCost('');
    } else {
      await saveUtilityOpening({ utilityType: 'water', openingReading: Number(waterOpening || 0), openingCost: Number(waterOpeningCost || 0) });
      setWaterOpening(''); setWaterOpeningCost('');
    }
  };

  const handleClosing = async (type: UtilityType) => {
    if (isAfter8pm) {
      alert('Closing entry is closed for today. It must be logged before 8:00 PM.');
      return;
    }

    if (type === 'electricity') {
      await saveUtilityClosing({ utilityType: 'electricity', closingReading: Number(electricityClosing || 0), closingCost: Number(electricityClosingCost || 0) });
      setElectricityClosing(''); setElectricityClosingCost('');
    } else {
      await saveUtilityClosing({ utilityType: 'water', closingReading: Number(waterClosing || 0), closingCost: Number(waterClosingCost || 0) });
      setWaterClosing(''); setWaterClosingCost('');
    }
  };

  const renderStatus = (log: any) => {
    if (!log) return <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Not started</span>;
    if (log.openingReading && !log.closingReading) return <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Opening logged</span>;
    if (log.openingReading && log.closingReading) return <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Completed</span>;
    return <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-full">Pending</span>;
  };

  const inputClass = 'px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5"><p className="text-xs text-slate-500">Electricity Used Today</p><h2 className="text-2xl font-bold mt-2">{summary.electricityConsumption.toFixed(2)} kWh</h2></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-xs text-slate-500">Electricity Cost Today</p><h2 className="text-2xl font-bold mt-2">{money(summary.electricityCost)}</h2></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-xs text-slate-500">Water Used Today</p><h2 className="text-2xl font-bold mt-2">{summary.waterConsumption.toFixed(2)} L</h2></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-xs text-slate-500">Water Cost Today</p><h2 className="text-2xl font-bold mt-2">{money(summary.waterCost)}</h2></div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4"><div><h2 className="font-semibold">Electricity Meter Log</h2><p className="text-xs text-slate-500">Opening at 7:00 AM, closing before 8:00 PM</p></div>{renderStatus(electricityLog)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border p-4"><h3 className="text-sm font-semibold mb-3">Morning Opening Reading</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input type="number" value={electricityOpening} onChange={(e) => setElectricityOpening(e.target.value)} placeholder="Opening kWh" className={inputClass} /><input type="number" value={electricityOpeningCost} onChange={(e) => setElectricityOpeningCost(e.target.value)} placeholder="Opening GH₵" className={inputClass} /></div><button type="button" onClick={() => handleOpening('electricity')} className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'hsl(205 78% 42%)' }}>Save Opening</button></div>
          <div className="rounded-xl border p-4"><h3 className="text-sm font-semibold mb-3">Evening Closing Reading</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input type="number" value={electricityClosing} onChange={(e) => setElectricityClosing(e.target.value)} placeholder="Closing kWh" className={inputClass} /><input type="number" value={electricityClosingCost} onChange={(e) => setElectricityClosingCost(e.target.value)} placeholder="Closing GH₵" className={inputClass} /></div><button type="button" onClick={() => handleClosing('electricity')} disabled={isAfter8pm} className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: isAfter8pm ? '#94a3b8' : 'hsl(160 60% 40%)' }}>Save Closing</button></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4"><div><h2 className="font-semibold">Water Meter Log</h2><p className="text-xs text-slate-500">Water reading in liters</p></div>{renderStatus(waterLog)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border p-4"><h3 className="text-sm font-semibold mb-3">Morning Opening Reading</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input type="number" value={waterOpening} onChange={(e) => setWaterOpening(e.target.value)} placeholder="Opening liters" className={inputClass} /><input type="number" value={waterOpeningCost} onChange={(e) => setWaterOpeningCost(e.target.value)} placeholder="Opening GH₵" className={inputClass} /></div><button type="button" onClick={() => handleOpening('water')} className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'hsl(205 78% 42%)' }}>Save Opening</button></div>
          <div className="rounded-xl border p-4"><h3 className="text-sm font-semibold mb-3">Evening Closing Reading</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input type="number" value={waterClosing} onChange={(e) => setWaterClosing(e.target.value)} placeholder="Closing liters" className={inputClass} /><input type="number" value={waterClosingCost} onChange={(e) => setWaterClosingCost(e.target.value)} placeholder="Closing GH₵" className={inputClass} /></div><button type="button" onClick={() => handleClosing('water')} disabled={isAfter8pm} className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: isAfter8pm ? '#94a3b8' : 'hsl(160 60% 40%)' }}>Save Closing</button></div>
        </div>
      </div>
    </div>
  );
}
