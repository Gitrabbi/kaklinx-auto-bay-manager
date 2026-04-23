'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkOrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
export type WorkerStatus = 'active' | 'break' | 'offline';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day';

export const VEHICLE_TYPES = [
  'Saloon - Small', 'Saloon - Medium', 'Saloon - Large',
  'SUV - Medium', 'SUV - Large', 'SUV - Extra Large',
  'Pickup', 'Pickup Truck', 'Family Van', 'Van', '32 Seater Bus',
  'KIA Bongo', 'KIA Mighty', 'KIA Rhino',
  'Motorcycle', 'Motor Tricycle',
];

export const SERVICE_TYPES = [
  'Body Wash', 'Under Wash', 'Engine Wash', 'Vacuuming',
  'Water Blowing', 'Interior + Vacuuming', 'Interior Premium + Vacuuming + Body Wash',
];

export interface WorkOrder {
  id: string;
  plate: string;
  vehicleType: string;
  services: string[];
  status: WorkOrderStatus;
  assignedWorkers: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: string;
  notes?: string;
  totalAmount?: number;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  initials: string;
  status: WorkerStatus;
  jobsToday: number;
  commissionRate: number;
  joinDate: string;
  role: string;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  hoursWorked?: number;
}

export interface CommissionRecord {
  id: string;
  workerId: string;
  workerName: string;
  workerInitials: string;
  date: string;
  jobsCompleted: number;
  totalEarned: number;
  rate: number;
}

export interface PricingItem {
  id: string;
  vehicleType: string;
  serviceType: string;
  price: number;
}

// ─── Initial seed data ────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];

const initialWorkers: Worker[] = [
  { id: 'w1', name: 'Kofi Boateng', phone: '0551234567', initials: 'KB', status: 'active', jobsToday: 0, commissionRate: 15, joinDate: '2024-01-10', role: 'Car Washer' },
  { id: 'w2', name: 'Abena Osei', phone: '0271234567', initials: 'AO', status: 'active', jobsToday: 0, commissionRate: 15, joinDate: '2024-02-05', role: 'Car Washer' },
  { id: 'w3', name: 'Ama Mensah', phone: '0201234567', initials: 'AM', status: 'active', jobsToday: 0, commissionRate: 15, joinDate: '2024-03-01', role: 'Car Washer' },
  { id: 'w4', name: 'Kwame Asante', phone: '0244123456', initials: 'KA', status: 'active', jobsToday: 0, commissionRate: 15, joinDate: '2024-01-20', role: 'Car Washer' },
];

const initialPricing: PricingItem[] = [
  { id: 'p1', vehicleType: 'Saloon - Small', serviceType: 'Body Wash', price: 20 },
  { id: 'p2', vehicleType: 'Saloon - Medium', serviceType: 'Body Wash', price: 25 },
  { id: 'p3', vehicleType: 'Saloon - Large', serviceType: 'Body Wash', price: 30 },
  { id: 'p4', vehicleType: 'SUV - Medium', serviceType: 'Body Wash', price: 35 },
  { id: 'p5', vehicleType: 'SUV - Large', serviceType: 'Body Wash', price: 40 },
  { id: 'p6', vehicleType: 'SUV - Extra Large', serviceType: 'Body Wash', price: 50 },
  { id: 'p7', vehicleType: 'Saloon - Small', serviceType: 'Under Wash', price: 15 },
  { id: 'p8', vehicleType: 'Saloon - Medium', serviceType: 'Under Wash', price: 20 },
  { id: 'p9', vehicleType: 'SUV - Medium', serviceType: 'Under Wash', price: 25 },
  { id: 'p10', vehicleType: 'Saloon - Small', serviceType: 'Engine Wash', price: 30 },
  { id: 'p11', vehicleType: 'Saloon - Medium', serviceType: 'Engine Wash', price: 35 },
  { id: 'p12', vehicleType: 'SUV - Medium', serviceType: 'Engine Wash', price: 40 },
  { id: 'p13', vehicleType: 'Saloon - Small', serviceType: 'Interior + Vacuuming', price: 25 },
  { id: 'p14', vehicleType: 'Saloon - Medium', serviceType: 'Interior + Vacuuming', price: 30 },
  { id: 'p15', vehicleType: 'SUV - Medium', serviceType: 'Interior + Vacuuming', price: 40 },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppDataContextType {
  workOrders: WorkOrder[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  commissions: CommissionRecord[];
  pricing: PricingItem[];

  // Work Orders
  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'createdAt'>) => WorkOrder;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  startWorkOrder: (id: string) => void;
  completeWorkOrder: (id: string) => void;

  // Workers
  addWorker: (w: Omit<Worker, 'id' | 'initials' | 'jobsToday'>) => void;
  updateWorker: (id: string, updates: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;

  // Attendance
  addAttendance: (a: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => void;
  deleteAttendance: (id: string) => void;

  // Commissions
  addCommission: (c: Omit<CommissionRecord, 'id'>) => void;
  updateCommission: (id: string, updates: Partial<CommissionRecord>) => void;
  deleteCommission: (id: string) => void;

  // Pricing
  addPricing: (p: Omit<PricingItem, 'id'>) => void;
  updatePricing: (id: string, updates: Partial<PricingItem>) => void;
  deletePricing: (id: string) => void;

  // Computed
  getTodayRevenue: () => number;
  getTodayOrders: () => number;
  getActiveJobs: () => number;
  getActiveWorkers: () => number;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

let idCounter = 1000;
function genId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>(initialPricing);

  // ── Work Orders ──
  const addWorkOrder = useCallback((wo: Omit<WorkOrder, 'id' | 'createdAt'>): WorkOrder => {
    const newWO: WorkOrder = {
      ...wo,
      id: genId('WO'),
      createdAt: new Date().toISOString(),
    };
    setWorkOrders(prev => [newWO, ...prev]);
    return newWO;
  }, []);

  const updateWorkOrder = useCallback((id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders(prev => prev.map(wo => wo.id === id ? { ...wo, ...updates } : wo));
  }, []);

  const deleteWorkOrder = useCallback((id: string) => {
    setWorkOrders(prev => prev.filter(wo => wo.id !== id));
  }, []);

  const startWorkOrder = useCallback((id: string) => {
    setWorkOrders(prev => prev.map(wo =>
      wo.id === id ? { ...wo, status: 'In Progress', startedAt: new Date().toISOString() } : wo
    ));
  }, []);

  const completeWorkOrder = useCallback((id: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== id) return wo;
      const completedAt = new Date().toISOString();
      let duration = '';
      if (wo.startedAt) {
        const ms = new Date(completedAt).getTime() - new Date(wo.startedAt).getTime();
        const mins = Math.floor(ms / 60000);
        duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
      }
      // Update worker job counts
      wo.assignedWorkers.forEach(wid => {
        setWorkers(pw => pw.map(w => w.id === wid ? { ...w, jobsToday: w.jobsToday + 1 } : w));
      });
      return { ...wo, status: 'Completed', completedAt, duration };
    }));
  }, []);

  // ── Workers ──
  const addWorker = useCallback((w: Omit<Worker, 'id' | 'initials' | 'jobsToday'>) => {
    const newW: Worker = {
      ...w,
      id: genId('W'),
      initials: getInitials(w.name),
      jobsToday: 0,
    };
    setWorkers(prev => [...prev, newW]);
  }, []);

  const updateWorker = useCallback((id: string, updates: Partial<Worker>) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== id) return w;
      const updated = { ...w, ...updates };
      if (updates.name) updated.initials = getInitials(updates.name);
      return updated;
    }));
  }, []);

  const deleteWorker = useCallback((id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
  }, []);

  // ── Attendance ──
  const addAttendance = useCallback((a: Omit<AttendanceRecord, 'id'>) => {
    setAttendance(prev => [{ ...a, id: genId('ATT') }, ...prev]);
  }, []);

  const updateAttendance = useCallback((id: string, updates: Partial<AttendanceRecord>) => {
    setAttendance(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const deleteAttendance = useCallback((id: string) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
  }, []);

  // ── Commissions ──
  const addCommission = useCallback((c: Omit<CommissionRecord, 'id'>) => {
    setCommissions(prev => [{ ...c, id: genId('COM') }, ...prev]);
  }, []);

  const updateCommission = useCallback((id: string, updates: Partial<CommissionRecord>) => {
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCommission = useCallback((id: string) => {
    setCommissions(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Pricing ──
  const addPricing = useCallback((p: Omit<PricingItem, 'id'>) => {
    setPricing(prev => [...prev, { ...p, id: genId('PRC') }]);
  }, []);

  const updatePricing = useCallback((id: string, updates: Partial<PricingItem>) => {
    setPricing(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePricing = useCallback((id: string) => {
    setPricing(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Computed ──
  const getTodayRevenue = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return workOrders
      .filter(wo => wo.status === 'Completed' && wo.completedAt?.startsWith(todayStr))
      .reduce((sum, wo) => sum + (wo.totalAmount || 0), 0);
  }, [workOrders]);

  const getTodayOrders = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return workOrders.filter(wo => wo.createdAt.startsWith(todayStr)).length;
  }, [workOrders]);

  const getActiveJobs = useCallback(() => {
    return workOrders.filter(wo => wo.status === 'In Progress').length;
  }, [workOrders]);

  const getActiveWorkers = useCallback(() => {
    return workers.filter(w => w.status === 'active').length;
  }, [workers]);

  return (
    <AppDataContext.Provider value={{
      workOrders, workers, attendance, commissions, pricing,
      addWorkOrder, updateWorkOrder, deleteWorkOrder, startWorkOrder, completeWorkOrder,
      addWorker, updateWorker, deleteWorker,
      addAttendance, updateAttendance, deleteAttendance,
      addCommission, updateCommission, deleteCommission,
      addPricing, updatePricing, deletePricing,
      getTodayRevenue, getTodayOrders, getActiveJobs, getActiveWorkers,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
