
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

function genId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function getQueueDate(value: Pick<WorkOrder, 'createdAt' | 'queueDate'>) {
  return value.queueDate || value.createdAt.slice(0, 10) || todayISO();
}

function normalizeQueueOrders(orders: WorkOrder[]) {
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

      // Finally FIFO by creation time
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      return aTime - bTime;
    });

  const activeOrders = todaysOrders.filter(
    (wo) => wo.status === 'Pending' || wo.status === 'In Progress'
  );

  const queueNumberById = new Map<string, string>();
  const queuePositionById = new Map<string, number>();
  activeOrders.forEach((wo, index) => {
    const rank = index + 1;
    queueNumberById.set(wo.id, `A-${String(rank).padStart(3, '0')}`);
    queuePositionById.set(wo.id, rank);
  });

  return orders.map((wo) => {
    if (getQueueDate(wo) !== queueDate) return wo;

    return {
      ...wo,
      queueDate,
      queueNumber: queueNumberById.get(wo.id) || wo.queueNumber || '',
      queuePosition: queuePositionById.get(wo.id) ?? wo.queuePosition ?? 0,
    };
  });
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
    recommendedMinutes: Number(row.recommended_minutes || 0),
  };
}

function pricingToDb(p: PricingItem) {
  return {
    id: p.id,
    vehicle_type: p.vehicleType,
    service_type: p.serviceType,
    price: p.price,
    recommended_minutes: p.recommendedMinutes || 0,
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
    customerRating: row.customer_rating ? Number(row.customer_rating) : undefined,
    customerComment: row.customer_comment || '',
    customerSatisfaction: row.customer_satisfaction || '',
    cuHere's your full updated `AppDataContext.tsx` with all 5 changes applied:

```typescript
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

function genId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function getQueueDate(value: Pick<WorkOrder, 'createdAt' | 'queueDate'>) {
  return value.queueDate || value.createdAt.slice(0, 10) || todayISO();
}

function normalizeQueueOrders(orders: WorkOrder[]) {
  const queueDate = todayISO();

  const todaysOrders = orders
    .filter((wo) => getQueueDate(wo) === queueDate)
    .sort((a, b) => {
      // VIP always first
      if ((a.isVip || false) !== (b.isVip || false)) {
        return a.isVip ? -1 : 1;
      }

      // Then by manual priority position
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

  const activeOrders = todaysOrders.filter(
    (wo) => wo.status === 'Pending' || wo.status === 'In Progress'
  );

  const queueNumberById = new Map<string, string>();
  const queuePositionById = new Map<string, number>();
  activeOrders.forEach((wo, index) => {
    const rank = index + 1;
    queueNumberById.set(wo.id, `A-${String(rank).padStart(3, '0')}`);
    queuePositionById.set(wo.id, rank);
  });

  return orders.map((wo) => {
    if (getQueueDate(wo) !== queueDate) return wo;

    return {
      ...wo,
      queueDate,
      queueNumber: queueNumberById.get(wo.id) || wo.queueNumber || '',
      queuePosition: queuePositionById.get(wo.id) ?? wo.queuePosition ?? 0,
    };
  });
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
 
