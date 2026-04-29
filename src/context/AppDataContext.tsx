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

interface AppDataContextType {
  workOrders: WorkOrder[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  commissions: CommissionRecord[];
  pricing: PricingItem[];
  utilityLogs: UtilityLog[];

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
    jobsToday: row.jobs_today || 0,
    commissionRate: Number(row.commission_rate || 0),
    joinDate: row.join_date || '',
    role: row.role || 'Car Washer',
  };
}

function workerToDb(w: Worker) {
  return {
    id: w.id,
    name: w.name,
    phone: w.phone,
    initials: w.initials,
    status: w.status,
    jobs_today: w.jobsToday,
    commission_rate: w.commissionRate,
    join_date: w.joinDate,
    role: w.role,
  };
}

function dbToPricing(row: any): PricingItem {
  return {
    id: row.id,
    vehicleType: row.vehicle_type,
    serviceType: row.service_type,
    price: Number(row.price || 0),
  };
}

function pricingToDb(p: PricingItem) {
  return {
    id: p.id,
    vehicle_type: p.vehicleType,
    service_type: p.serviceType,
    price: p.price,
  };
}

function dbToWorkOrder(row: any): WorkOrder {
  return {
    id: row.id,
    plate: row.plate,
    vehicleType: row.vehicle_type,
    services: row.services || [],
    status: row.status || 'Pending',
    assignedWorkers: row.assigned_workers || [],
    createdAt: row.created_at,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    duration: row.duration || undefined,
    notes: row.notes || '',
    totalAmount: Number(row.total_amount || 0),
    additionalServiceDescription: row.additional_service_description || '',
    additionalServiceCost: Number(row.additional_service_cost || 0),
    discount: Number(row.discount || 0),
  };
}

function workOrderToDb(wo: WorkOrder) {
  return {
    id: wo.id,
    plate: wo.plate,
    vehicle_type: wo.vehicleType,
    services: wo.services,
    status: wo.status,
    assigned_workers: wo.assignedWorkers,
    created_at: wo.createdAt,
    started_at: wo.startedAt || null,
    completed_at: wo.completedAt || null,
    duration: wo.duration || null,
    notes: wo.notes || '',
    total_amount: wo.totalAmount || 0,
    additional_service_description: wo.additionalServiceDescription || '',
    additional_service_cost: wo.additionalServiceCost || 0,
    discount: wo.discount || 0,
  };
}

function dbToAttendance(row: any): AttendanceRecord {
  return {
    id: row.id,
    workerId: row.worker_id,
    workerName: row.worker_name,
    date: row.date,
    checkIn: row.check_in || undefined,
    checkOut: row.check_out || undefined,
    status: row.status || 'Present',
    hoursWorked: row.hours_worked ? Number(row.hours_worked) : undefined,
  };
}

function attendanceToDb(a: AttendanceRecord) {
  return {
    id: a.id,
    worker_id: a.workerId,
    worker_name: a.workerName,
    date: a.date,
    check_in: a.checkIn || null,
    check_out: a.checkOut || null,
    status: a.status,
    hours_worked: a.hoursWorked || null,
  };
}

function dbToCommission(row: any): CommissionRecord {
  return {
    id: row.id,
    workerId: row.worker_id,
    workerName: row.worker_name,
    workerInitials: row.worker_initials,
    date: row.date,
    jobsCompleted: row.jobs_completed || 0,
    totalEarned: Number(row.total_earned || 0),
    rate: Number(row.rate || 0),
  };
}

function commissionToDb(c: CommissionRecord) {
  return {
    id: c.id,
    worker_id: c.workerId,
    worker_name: c.workerName,
    worker_initials: c.workerInitials,
    date: c.date,
    jobs_completed: c.jobsCompleted,
    total_earned: c.totalEarned,
    rate: c.rate,
  };
}


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
    ] = await Promise.all([
      supabase.from('workers').select('*').order('name'),
      supabase.from('pricing').select('*').order('vehicle_type'),
      supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('attendance').select('*').order('date', { ascending: false }),
      supabase.from('commissions').select('*').order('date', { ascending: false }),
      supabase.from('utility_logs').select('*').order('log_date', { ascending: false }),
    ]);

    if (workersRes.data) setWorkers(workersRes.data.map(dbToWorker));
    if (pricingRes.data) setPricing(pricingRes.data.map(dbToPricing));
    if (workOrdersRes.data) setWorkOrders(workOrdersRes.data.map(dbToWorkOrder));
    if (attendanceRes.data) setAttendance(attendanceRes.data.map(dbToAttendance));
    if (commissionsRes.data) setCommissions(commissionsRes.data.map(dbToCommission));
    if (utilityLogsRes.data) setUtilityLogs(utilityLogsRes.data.map(dbToUtilityLog));

    const firstError = workersRes.error || pricingRes.error || workOrdersRes.error || attendanceRes.error || commissionsRes.error || utilityLogsRes.error;
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
  }, []);

  const deleteWorkOrder = useCallback((id: string) => {
    setWorkOrders(prev => prev.filter(wo => wo.id !== id));
    supabase.from('work_orders').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Delete work order error:', error.message);
    });
  }, []);

  const startWorkOrder = useCallback((id: string) => {
    updateWorkOrder(id, { status: 'In Progress', startedAt: new Date().toISOString() });
  }, [updateWorkOrder]);

  const completeWorkOrder = useCallback((id: string) => {
    const wo = workOrders.find(w => w.id === id);
    if (!wo) return;

    const completedAt = new Date().toISOString();
    let duration = '';

    if (wo.startedAt) {
      const ms = new Date(completedAt).getTime() - new Date(wo.startedAt).getTime();
      const mins = Math.floor(ms / 60000);
      duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
    }

    updateWorkOrder(id, { status: 'Completed', completedAt, duration });

    wo.assignedWorkers.forEach(wid => {
      const worker = workers.find(w => w.id === wid);
      if (worker) {
        updateWorker(wid, { jobsToday: worker.jobsToday + 1 });
      }
    });
  }, [workOrders, workers, updateWorkOrder]);

  const addWorker = useCallback((w: Omit<Worker, 'id' | 'initials' | 'jobsToday'>) => {
    const newW: Worker = { ...w, id: genId('W'), initials: getInitials(w.name), jobsToday: 0 };
    setWorkers(prev => [...prev, newW]);
    supabase.from('workers').insert(workerToDb(newW)).then(({ error }) => {
      if (error) console.error('Add worker error:', error.message);
    });
  }, []);

  const updateWorker = useCallback((id: string, updates: Partial<Worker>) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== id) return w;
      const updated = { ...w, ...updates };
      if (updates.name) updated.initials = getInitials(updates.name);
      supabase.from('workers').update(workerToDb(updated)).eq('id', id).then(({ error }) => {
        if (error) console.error('Update worker error:', error.message);
      });
      return updated;
    }));
  }, []);

  const deleteWorker = useCallback((id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
    supabase.from('workers').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Delete worker error:', error.message);
    });
  }, []);

  const addAttendance = useCallback((a: Omit<AttendanceRecord, 'id'>) => {
    const newA: AttendanceRecord = { ...a, id: genId('ATT') };
    setAttendance(prev => [newA, ...prev]);
    supabase.from('attendance').insert(attendanceToDb(newA)).then(({ error }) => {
      if (error) console.error('Add attendance error:', error.message);
    });
  }, []);

  const updateAttendance = useCallback((id: string, updates: Partial<AttendanceRecord>) => {
    setAttendance(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, ...updates };
      supabase.from('attendance').update(attendanceToDb(updated)).eq('id', id).then(({ error }) => {
        if (error) console.error('Update attendance error:', error.message);
      });
      return updated;
    }));
  }, []);

  const deleteAttendance = useCallback((id: string) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
    supabase.from('attendance').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Delete attendance error:', error.message);
    });
  }, []);

  const addCommission = useCallback((c: Omit<CommissionRecord, 'id'>) => {
    const newC: CommissionRecord = { ...c, id: genId('COM') };
    setCommissions(prev => [newC, ...prev]);
    supabase.from('commissions').insert(commissionToDb(newC)).then(({ error }) => {
      if (error) console.error('Add commission error:', error.message);
    });
  }, []);

  const updateCommission = useCallback((id: string, updates: Partial<CommissionRecord>) => {
    setCommissions(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates };
      supabase.from('commissions').update(commissionToDb(updated)).eq('id', id).then(({ error }) => {
        if (error) console.error('Update commission error:', error.message);
      });
      return updated;
    }));
  }, []);

  const deleteCommission = useCallback((id: string) => {
    setCommissions(prev => prev.filter(c => c.id !== id));
    supabase.from('commissions').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Delete commission error:', error.message);
    });
  }, []);

  const addPricing = useCallback((p: Omit<PricingItem, 'id'>) => {
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
      .from('utility_logs')
      .upsert(row, { onConflict: 'log_date,utility_type' });

    if (error) {
      console.error('Save utility opening error:', error.message);
      alert(error.message);
      return;
    }

    await loadUtilityLogs();
  }, [loadUtilityLogs]);

  const saveUtilityClosing = useCallback(async ({
    utilityType,
    closingReading,
    closingCost,
  }: {
    utilityType: UtilityType;
    closingReading: number;
    closingCost: number;
  }) => {
    const hour = new Date().getHours();

    if (hour >= 20) {
      alert('Closing entry is closed for today. It must be logged before 8:00 PM.');
      return;
    }

    const logDate = todayISO();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('utility_logs')
      .update({
        closing_reading: closingReading,
        closing_cost: closingCost,
        closing_logged_at: now,
        status: 'completed',
      })
      .eq('log_date', logDate)
      .eq('utility_type', utilityType);

    if (error) {
      console.error('Save utility closing error:', error.message);
      alert(error.message);
      return;
    }

    await loadUtilityLogs();
  }, [loadUtilityLogs]);

  const getTodayRevenue = useCallback(() => {
    const todayStr = todayISO();
    return workOrders
      .filter(wo => wo.status === 'Completed' && wo.completedAt?.startsWith(todayStr))
      .reduce((sum, wo) => sum + (wo.totalAmount || 0), 0);
  }, [workOrders]);

  const getTodayOrders = useCallback(() => {
    const todayStr = todayISO();
    return workOrders.filter(wo => wo.createdAt.startsWith(todayStr)).length;
  }, [workOrders]);

  const getActiveJobs = useCallback(() => workOrders.filter(wo => wo.status === 'In Progress').length, [workOrders]);
  const getActiveWorkers = useCallback(() => workers.filter(w => w.status === 'active').length, [workers]);


  const getTodayUtilitySummary = useCallback(() => {
    const todayStr = todayISO();

    const electricity = utilityLogs.find(
      log => log.logDate === todayStr && log.utilityType === 'electricity'
    );

    const water = utilityLogs.find(
      log => log.logDate === todayStr && log.utilityType === 'water'
    );

    const electricityConsumption = Math.max(
      Number(electricity?.closingReading || 0) - Number(electricity?.openingReading || 0),
      0
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

  return (
    <AppDataContext.Provider value={{
      workOrders, workers, attendance, commissions, pricing, utilityLogs,
      addWorkOrder, updateWorkOrder, deleteWorkOrder, startWorkOrder, completeWorkOrder,
      addWorker, updateWorker, deleteWorker,
      addAttendance, updateAttendance, deleteAttendance,
      addCommission, updateCommission, deleteCommission,
      addPricing, updatePricing, deletePricing,
      saveUtilityOpening, saveUtilityClosing,
      getTodayRevenue, getTodayOrders, getActiveJobs, getActiveWorkers, getTodayUtilitySummary,
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
