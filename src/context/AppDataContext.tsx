'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type WorkOrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
export type WorkerStatus = 'active' | 'break' | 'offline';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day';
export type UtilityType = 'electricity' | 'water';

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
  additionalServiceDescription?: string;
  additionalServiceCost?: number;
  discount?: number;
  customerRating?: number;
  customerComment?: string;
  customerSatisfaction?: string;
  customerCertifiedAt?: string;
  closureStatus?: 'open' | 'awaiting_customer' | 'closed';
  targetMinutes?: number;
  qualityPassed?: boolean;
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

export interface UtilityLog {
  id: string;
  logDate: string;
  utilityType: UtilityType;
  openingReading: number | null;
  closingReading: number | null;
  openingCost: number;
  closingCost: number;
  consumption?: number;
  costConsumed?: number;
  openingLoggedAt?: string;
  closingLoggedAt?: string;
  status: string;
}

export interface ExpenditureItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  notes?: string;
}

interface AppDataContextType {
  workOrders: WorkOrder[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  commissions: CommissionRecord[];
  pricing: PricingItem[];
  utilityLogs: UtilityLog[];
  expenditures: ExpenditureItem[];

  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'createdAt'>) => WorkOrder;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  startWorkOrder: (id: string) => void;
  completeWorkOrder: (id: string) => void;

  addWorker: (w: Omit<Worker, 'id' | 'initials' | 'jobsToday'>) => void;
  updateWorker: (id: string, updates: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;

  addAttendance: (a: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => void;
  deleteAttendance: (id: string) => void;

  addCommission: (c: Omit<CommissionRecord, 'id'>) => void;
  updateCommission: (id: string, updates: Partial<CommissionRecord>) => void;
  deleteCommission: (id: string) => void;

  addPricing: (p: Omit<PricingItem, 'id'>) => void;
  updatePricing: (id: string, updates: Partial<PricingItem>) => void;
  deletePricing: (id: string) => void;

  saveUtilityOpening: (data: {
    utilityType: UtilityType;
    openingReading: number;
    openingCost: number;
  }) => Promise<void>;

  saveUtilityClosing: (data: {
    utilityType: UtilityType;
    closingReading: number;
    closingCost: number;
  }) => Promise<void>;

  addExpenditure: (item: Omit<ExpenditureItem, 'id'>) => void;
  deleteExpenditure: (id: string) => void;

  getTodayRevenue: () => number;
  getTodayOrders: () => number;
  getActiveJobs: () => number;
  getActiveWorkers: () => number;
  getTodayUtilitySummary: () => {
    electricityConsumption: number;
    electricityCost: number;
    waterConsumption: number;
    waterCost: number;
  };
  getTodayExpenditure: () => number;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

let idCounter = Date.now();

function genId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function dbToWorker(row: any): Worker {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    initials: row.initials || getInitials(row.name || ''),
    status: row.status || 'active',

function dbToUtilityLog(row: any): UtilityLog {
  return {
    id: row.id,
    logDate: row.log_date,
    utilityType: row.utility_type,
    openingReading: row.opening_reading === null ? null : Number(row.opening_reading),
    closingReading: row.closing_reading === null ? null : Number(row.closing_reading),
    openingCost: Number(row.opening_cost || 0),
    closingCost: Number(row.closing_cost || 0),
    consumption: Number(row.consumption || 0),
    costConsumed: Number(row.cost_consumed || 0),
    openingLoggedAt: row.opening_logged_at || undefined,
    closingLoggedAt: row.closing_logged_at || undefined,
    status: row.status || 'pending',
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [utilityLogs, setUtilityLogs] = useState<UtilityLog[]>([]);
  const [expenditures, setExpenditures] = useState<ExpenditureItem[]>([]);


  const loadUtilityLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('utility_logs')
      .select('*')
      .order('log_date', { ascending: false });

    if (error) {
      console.error('Load utility logs error:', error.message);
      return;
    }

    if (data) setUtilityLogs(data.map(dbToUtilityLog));
  }, []);

  const loadAllData = useCallback(async () => {
    const [
      workersRes,
      pricingRes,
      workOrdersRes,
      attendanceRes,
      commissionsRes,
      utilityLogsRes,
      expendituresRes,
    ] = await Promise.all([
      supabase.from('workers').select('*').order('name'),
      supabase.from('pricing').select('*').order('vehicle_type'),
      supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('attendance').select('*').order('date', { ascending: false }),
      supabase.from('commissions').select('*').order('date', { ascending: false }),
      supabase.from('utility_logs').select('*').order('log_date', { ascending: false }),
      supabase.from('expenditures').select('*').order('date', { ascending: false }),
    ]);

    if (workersRes.data) setWorkers(workersRes.data.map(dbToWorker));
    if (pricingRes.data) setPricing(pricingRes.data.map(dbToPricing));
    if (workOrdersRes.data) setWorkOrders(workOrdersRes.data.map(dbToWorkOrder));
    if (attendanceRes.data) setAttendance(attendanceRes.data.map(dbToAttendance));
    if (commissionsRes.data) setCommissions(commissionsRes.data.map(dbToCommission));
    if (utilityLogsRes.data) setUtilityLogs(utilityLogsRes.data.map(dbToUtilityLog));

    const firstError = workersRes.error || pricingRes.error || workOrdersRes.error || attendanceRes.error || commissionsRes.error || utilityLogsRes.error;
    if (expendituresRes.data) setExpenditures(expendituresRes.data.map((row: any) => ({
      id: row.id,
      date: row.date,
      description: row.description,
      amount: Number(row.amount || 0),
      category: row.category || 'Other',
      notes: row.notes || '',
    })));

    const firstError = workersRes.error || pricingRes.error || workOrdersRes.error || attendanceRes.error || commissionsRes.error || utilityLogsRes.error || expendituresRes.error;
    if (firstError) console.error('Supabase load error:', firstError.message);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const addWorkOrder = useCallback((wo: Omit<WorkOrder, 'id' | 'createdAt'>): WorkOrder => {
    const newWO: WorkOrder = { ...wo, id: genId('WO'), createdAt: new Date().toISOString() };
    setWorkOrders(prev => [newWO, ...prev]);
    supabase.from('work_orders').insert(workOrderToDb(newWO)).then(({ error }) => {
      if (error) console.error('Add work order error:', error.message);
    });
    return newWO;
  }, []);

  const updateWorkOrder = useCallback((id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== id) return wo;
      const updated = { ...wo, ...updates };
      supabase.from('work_orders').update(workOrderToDb(updated)).eq('id', id).then(({ error }) => {
        if (error) console.error('Update work order error:', error.message);
      });
      return updated;
    }));

    const newP: PricingItem = { ...p, id: genId('PRC') };
    setPricing(prev => [...prev, newP]);
    supabase.from('pricing').insert(pricingToDb(newP)).then(({ error }) => {
      if (error) console.error('Add pricing error:', error.message);
    });
  }, []);

  const updatePricing = useCallback((id: string, updates: Partial<PricingItem>) => {
    setPricing(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };
      supabase.from('pricing').update(pricingToDb(updated)).eq('id', id).then(({ error }) => {
        if (error) console.error('Update pricing error:', error.message);
      });
      return updated;
    }));
  }, []);

  const deletePricing = useCallback((id: string) => {
    setPricing(prev => prev.filter(p => p.id !== id));
    supabase.from('pricing').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Delete pricing error:', error.message);
    });
  }, []);

  const addExpenditure = useCallback((item: Omit<ExpenditureItem, 'id'>) => {
    const newItem: ExpenditureItem = { ...item, id: genId('EXP') };
    setExpenditures(prev => [newItem, ...prev]);
    supabase.from('expenditures').insert({
      id: newItem.id,
      date: newItem.date,
      description: newItem.description,
      amount: newItem.amount,
      category: newItem.category,
      notes: newItem.notes || '',
    }).then(({ error }) => {
      if (error) console.error('Add expenditure error:', error.message);
    });
  }, []);

  const deleteExpenditure = useCallback((id: string) => {
    setExpenditures(prev => prev.filter(item => item.id !== id));
    supabase.from('expenditures').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Delete expenditure error:', error.message);
    });
  }, []);


  const saveUtilityOpening = useCallback(async ({
    utilityType,
    openingReading,
    openingCost,
  }: {
    utilityType: UtilityType;
    openingReading: number;
    openingCost: number;
  }) => {
    const logDate = todayISO();
    const id = `${utilityType}-${logDate}`;
    const now = new Date().toISOString();

    const row = {
      id,
      log_date: logDate,
      utility_type: utilityType,
      opening_reading: openingReading,
      opening_cost: openingCost,
      opening_logged_at: now,
      status: 'opening_logged',
    };

    const { error } = await supabase

    );

    const electricityCost = Math.max(
      Number(electricity?.closingCost || 0) - Number(electricity?.openingCost || 0),
      0
    );

    const waterConsumption = Math.max(
      Number(water?.closingReading || 0) - Number(water?.openingReading || 0),
      0
    );

    const waterCost = Math.max(
      Number(water?.closingCost || 0) - Number(water?.openingCost || 0),
      0
    );

    return {
      electricityConsumption,
      electricityCost,
      waterConsumption,
      waterCost,
    };
  }, [utilityLogs]);

  const getTodayExpenditure = useCallback(() => {
    const todayStr = todayISO();
    return expenditures
      .filter(item => item.date === todayStr)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [expenditures]);

  return (
    <AppDataContext.Provider value={{
      workOrders, workers, attendance, commissions, pricing, utilityLogs,
      workOrders, workers, attendance, commissions, pricing, utilityLogs, expenditures,
      addWorkOrder, updateWorkOrder, deleteWorkOrder, startWorkOrder, completeWorkOrder,
      addWorker, updateWorker, deleteWorker,
      addAttendance, updateAttendance, deleteAttendance,
      addCommission, updateCommission, deleteCommission,
      addPricing, updatePricing, deletePricing,
      saveUtilityOpening, saveUtilityClosing,
      getTodayRevenue, getTodayOrders, getActiveJobs, getActiveWorkers, getTodayUtilitySummary,
      addExpenditure, deleteExpenditure,
      getTodayRevenue, getTodayOrders, getActiveJobs, getActiveWorkers, getTodayUtilitySummary, getTodayExpenditure,
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
