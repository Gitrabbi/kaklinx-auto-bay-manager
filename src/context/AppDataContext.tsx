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
  extensionMinutes?: number;
  extensionReasonCategory?: 'operational' | 'worker_inability' | 'customer_extra_requests';
  extensionReason?: string;
  autoClosedAt?: string;
  completedWithinTarget?: boolean;
  queueNumber?: string;
  queuePosition?: number;
  queueDate?: string;
  source?: 'customer_app' | 'walk_in';
  isVip?: boolean;
  bayNumber?: number;
  priorityPosition?: number;
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
  recommendedMinutes?: number;
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

export function genId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function getQueueDate(value: Pick<WorkOrder, 'createdAt' | 'queueDate'>) {
  return value.queueDate || value.createdAt.slice(0, 10) || todayISO();
}

export function normalizeQueueOrders(orders: WorkOrder[]) {
  const queueDate = todayISO();

  const todaysOrders = orders
    .filter((wo) => getQueueDate(wo) === queueDate)
    .sort((a, b) => {
      // VIP always comes first
      if ((a.isVip || false) !== (b.isVip || false)) {
        return a.isVip ? -1 : 1;
      }

      // Then by manual priority position (lower = higher priority)
      const aPriority = a.priorityPosition ?? 999999;
      const bPriority = b.priorityPosition ?? 999999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then FIFO by creation time
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      return aTime - bTime;
    });

  // "Active" = currently in the queue (being served or waiting).
  // Vehicles ahead = count of active orders sorted ahead of you.
  // Queue Number and Position are unified: both = 1-indexed rank among actives.
  // As cars complete and drop out, everyone behind moves up by one.
  const inProgressOrders = todaysOrders.filter(
  (wo) => wo.status === 'In Progress'
);
const pendingOrders = todaysOrders.filter(
  (wo) => wo.status === 'Pending'
);

const queueNumberById = new Map<string, string>();
const queuePositionById = new Map<string, number>();

// In Progress orders = position 0 (now serving, no vehicles ahead)
inProgressOrders.forEach((wo) => {
  queueNumberById.set(wo.id, wo.queueNumber || '');
  queuePositionById.set(wo.id, 0);
});

// Pending orders = position 1, 2, 3... (vehicles ahead = position - 1)
pendingOrders.forEach((wo, index) => {
  const rank = index + 1;
  queueNumberById.set(wo.id, `A-${String(rank).padStart(3, '0')}`);
  queuePositionById.set(wo.id, rank);
});

  return orders.map((wo) => {
    if (getQueueDate(wo) !== queueDate) return wo;

    return {
      ...wo,
      queueDate,
      // Active orders get position-derived numbers; completed/cancelled keep
      // their last value so receipts / history still make sense.
      queueNumber: queueNumberById.get(wo.id) || wo.queueNumber || '',
      queuePosition: queuePositionById.get(wo.id) ?? wo.queuePosition ?? 0,
    };
  });
}

export function dbToWorker(row: any): Worker {
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

export function workerToDb(w: Worker) {
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

export function dbToPricing(row: any): PricingItem {
  return {
    id: row.id,
    vehicleType: row.vehicle_type,
    serviceType: row.service_type,
    price: Number(row.price || 0),
    recommendedMinutes: Number(row.recommended_minutes || 0),
  };
}

export function pricingToDb(p: PricingItem) {
  return {
    id: p.id,
    vehicle_type: p.vehicleType,
    service_type: p.serviceType,
    price: p.price,
    recommended_minutes: p.recommendedMinutes || 0,
  };
}

export function dbToWorkOrder(row: any): WorkOrder {
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
    customerRating: row.customer_rating ? Number(row.customer_rating) : undefined,
    customerComment: row.customer_comment || '',
    customerSatisfaction: row.customer_satisfaction || '',
    customerCertifiedAt: row.customer_certified_at || undefined,
    closureStatus: row.closure_status || 'open',
    targetMinutes: Number(row.target_minutes || 30),
    qualityPassed: row.quality_passed ?? true,
    extensionMinutes: Number(row.extension_minutes || 0),
    extensionReasonCategory: row.extension_reason_category || undefined,
    extensionReason: row.extension_reason || undefined,
    autoClosedAt: row.auto_closed_at || undefined,
    completedWithinTarget: row.completed_within_target ?? undefined,
    queueNumber: row.queue_number || '',
    queuePosition: Number(row.queue_position || 0),
    queueDate: row.queue_date || undefined,
    source: row.source || 'walk_in',
    isVip: row.is_vip || false,
    bayNumber: row.bay_number || null,
    priorityPosition: row.priority_position || null,
  };
}

export function workOrderToDb(wo: WorkOrder) {
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
    customer_rating: wo.customerRating || null,
    customer_comment: wo.customerComment || '',
    customer_satisfaction: wo.customerSatisfaction || '',
    customer_certified_at: wo.customerCertifiedAt || null,
    closure_status: wo.closureStatus || 'open',
    target_minutes: wo.targetMinutes || 30,
    quality_passed: wo.qualityPassed ?? true,
    extension_minutes: wo.extensionMinutes || 0,
    extension_reason_category: wo.extensionReasonCategory || null,
    extension_reason: wo.extensionReason || null,
    auto_closed_at: wo.autoClosedAt || null,
    completed_within_target: wo.completedWithinTarget ?? null,
    queue_number: wo.queueNumber || null,
    queue_position: wo.queuePosition || null,
    queue_date: wo.queueDate || null,
    source: wo.source || 'walk_in',
    is_vip: wo.isVip || false,
    bay_number: wo.bayNumber || null,
    priority_position: wo.priorityPosition || null,
  };
}

export function dbToAttendance(row: any): AttendanceRecord {
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

export function attendanceToDb(a: AttendanceRecord) {
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

export function dbToCommission(row: any): CommissionRecord {
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

export function commissionToDb(c: CommissionRecord) {
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

export function dbToUtilityLog(row: any): UtilityLog {
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
    const { data, error } = await supabase.from('utility_logs').select('*').order('log_date', { ascending: false });
    if (error) {
      console.error('Load utility logs error:', error.message);
      return;
    }
    if (data) setUtilityLogs(data.map(dbToUtilityLog));
  }, []);

  const loadAllData = useCallback(async () => {
    const [
      workersRes, pricingRes, workOrdersRes, attendanceRes, commissionsRes, utilityLogsRes, expendituresRes,
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
    if (workOrdersRes.data) {
      const normalizedWorkOrders = normalizeQueueOrders(workOrdersRes.data.map(dbToWorkOrder));
      setWorkOrders(normalizedWorkOrders);

      // Self-heal: persist corrected queue_number / queue_position back to the DB
      // so customer-facing views (which read queue_position directly from Supabase)
      // show the right values immediately, not just after the next mutation.
      normalizedWorkOrders.forEach((wo) => {
        const original = workOrdersRes.data!.find((row: any) => row.id === wo.id);
        if (
          original &&
          (original.queue_position !== wo.queuePosition ||
            original.queue_number !== wo.queueNumber)
        ) {
          supabase
            .from('work_orders')
            .update({
              queue_position: wo.queuePosition,
              queue_number: wo.queueNumber,
            })
            .eq('id', wo.id)
            .then(({ error }) => {
              if (error) console.error('Queue sync error:', error.message);
            });
        }
      });
    }
    if (attendanceRes.data) setAttendance(attendanceRes.data.map(dbToAttendance));
    if (commissionsRes.data) setCommissions(commissionsRes.data.map(dbToCommission));
    if (utilityLogsRes.data) setUtilityLogs(utilityLogsRes.data.map(dbToUtilityLog));
    if (expendituresRes.data) {
      setExpenditures(expendituresRes.data.map((row: any) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        amount: Number(row.amount || 0),
        category: row.category || 'Other',
        notes: row.notes || '',
      })));
    }

    const firstError =
      workersRes.error ||
      pricingRes.error ||
      workOrdersRes.error ||
      attendanceRes.error ||
      commissionsRes.error ||
      utilityLogsRes.error ||
      expendituresRes.error;

    if (firstError) console.error('Supabase load error:', firstError.message);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const addWorkOrder = useCallback((wo: Omit<WorkOrder, 'id' | 'createdAt'>): WorkOrder => {
    const id = genId('WO');
    const createdAt = new Date().toISOString();
    const queueDate = todayISO();

    const provisional: WorkOrder = {
      ...wo,
      source: wo.source || 'walk_in',
      isVip: wo.isVip || false,
      bayNumber: wo.bayNumber || undefined,
      priorityPosition: wo.priorityPosition || undefined,
      queueNumber: '',
      queuePosition: 0,
      queueDate,
      id,
      createdAt,
    };

    // Compute normalized list eagerly so the DB insert carries the
    // correct queueNumber + queuePosition (1-based rank among actives).
    const normalizedList = normalizeQueueOrders([provisional, ...workOrders]);
    const newWO = normalizedList.find((w) => w.id === id)!;

    setWorkOrders(normalizedList);
    supabase.from('work_orders').insert(workOrderToDb(newWO)).then(({ error }) => {
      if (error) console.error('Add work order error:', error.message);
    });
    return newWO;
  }, [workOrders]);

  const updateWorkOrder = useCallback((id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders((prev) => {
      const updatedList = prev.map((wo) => {
        if (wo.id !== id) return wo;
        return { ...wo, ...updates };
      });

      const normalized = normalizeQueueOrders(updatedList);
      const updatedOrder = normalized.find((wo) => wo.id === id);

      if (updatedOrder) {
        supabase.from('work_orders').update(workOrderToDb(updatedOrder)).eq('id', id).then(({ error }) => {
          if (error) console.error('Update work order error:', error.message);
        });
      }

      return normalized;
    });
  }, []);

  const deleteWorkOrder = useCallback((id: string) => {
    setWorkOrders((prev) => normalizeQueueOrders(prev.filter((wo) => wo.id !== id)));
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

    updateWorkOrder(id, { status: 'Completed', completedAt, duration, closureStatus: 'awaiting_customer' });

    wo.assignedWorkers.forEach(wid => {
      const worker = workers.find(w => w.id === wid);
      if (worker) updateWorker(wid, { jobsToday: worker.jobsToday + 1 });
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

    const { error } = await supabase.from('utility_logs').upsert(row, { onConflict: 'log_date,utility_type' });

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

  const getActiveJobs = useCallback(
    () => workOrders.filter(wo => wo.status === 'In Progress').length,
    [workOrders]
  );

  const getActiveWorkers = useCallback(
    () => workers.filter(w => w.status === 'active').length,
    [workers]
  );

  const getTodayUtilitySummary = useCallback(() => {
    const todayStr = todayISO();

    const electricity = utilityLogs.find(log => log.logDate === todayStr && log.utilityType === 'electricity');
    const water = utilityLogs.find(log => log.logDate === todayStr && log.utilityType === 'water');

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

    return { electricityConsumption, electricityCost, waterConsumption, waterCost };
  }, [utilityLogs]);

  const getTodayExpenditure = useCallback(() => {
    const todayStr = todayISO();
    return expenditures
      .filter(item => item.date === todayStr)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [expenditures]);

  return (
    <AppDataContext.Provider
      value={{
        workOrders,
        workers,
        attendance,
        commissions,
        pricing,
        utilityLogs,
        expenditures,
        addWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,
        startWorkOrder,
        completeWorkOrder,
        addWorker,
        updateWorker,
        deleteWorker,
        addAttendance,
        updateAttendance,
        deleteAttendance,
        addCommission,
        updateCommission,
        deleteCommission,
        addPricing,
        updatePricing,
        deletePricing,
        saveUtilityOpening,
        saveUtilityClosing,
        addExpenditure,
        deleteExpenditure,
        getTodayRevenue,
        getTodayOrders,
        getActiveJobs,
        getActiveWorkers,
        getTodayUtilitySummary,
        getTodayExpenditure,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
