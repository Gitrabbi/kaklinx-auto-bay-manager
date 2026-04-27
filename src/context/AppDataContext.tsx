'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

// TYPES
export type WorkOrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
export type WorkerStatus = 'active' | 'break' | 'offline';

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

export interface WorkOrder {
  id: string;
  plate: string;
  vehicleType: string;
  services: string[];
  status: WorkOrderStatus;
  assignedWorkers: string[];
  createdAt: string;
  totalAmount?: number;
}

// CONTEXT
const AppDataContext = createContext<any>(null);

// HELPERS
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function genId(prefix: string) {
  return prefix + '-' + Date.now();
}

// PROVIDER
export function AppDataProvider({ children }: { children: ReactNode }) {

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  // LOAD DATA FROM SUPABASE
  const loadData = async () => {

    const { data: workersData } = await supabase.from('workers').select('*');
    const { data: ordersData } = await supabase.from('work_orders').select('*');

    if (workersData) {
      setWorkers(workersData.map((w: any) => ({
        id: w.id,
        name: w.name,
        phone: w.phone,
        initials: w.initials,
        status: w.status,
        jobsToday: w.jobs_today,
        commissionRate: w.commission_rate,
        joinDate: w.join_date,
        role: w.role
      })));
    }

    if (ordersData) {
      setWorkOrders(ordersData.map((o: any) => ({
        id: o.id,
        plate: o.plate,
        vehicleType: o.vehicle_type,
        services: o.services || [],
        status: o.status,
        assignedWorkers: o.assigned_workers || [],
        createdAt: o.created_at,
        totalAmount: o.total_amount
      })));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ADD WORKER
  const addWorker = async (w: any) => {
    const newWorker = {
      id: genId('W'),
      name: w.name,
      phone: w.phone,
      initials: getInitials(w.name),
      status: w.status,
      jobs_today: 0,
      commission_rate: w.commissionRate,
      join_date: w.joinDate,
      role: w.role
    };

    await supabase.from('workers').insert(newWorker);

    setWorkers(prev => [...prev, {
      id: newWorker.id,
      name: newWorker.name,
      phone: newWorker.phone,
      initials: newWorker.initials,
      status: newWorker.status,
      jobsToday: 0,
      commissionRate: newWorker.commission_rate,
      joinDate: newWorker.join_date,
      role: newWorker.role
    }]);
  };

  // ADD WORK ORDER
  const addWorkOrder = async (wo: any) => {

    const newOrder = {
      id: genId('WO'),
      plate: wo.plate,
      vehicle_type: wo.vehicleType,
      services: wo.services,
      status: wo.status,
      assigned_workers: wo.assignedWorkers,
      created_at: new Date().toISOString(),
      total_amount: wo.totalAmount
    };

    await supabase.from('work_orders').insert(newOrder);

    setWorkOrders(prev => [{
      id: newOrder.id,
      plate: newOrder.plate,
      vehicleType: newOrder.vehicle_type,
      services: newOrder.services,
      status: newOrder.status,
      assignedWorkers: newOrder.assigned_workers,
      createdAt: newOrder.created_at,
      totalAmount: newOrder.total_amount
    }, ...prev]);
  };

  return (
    <AppDataContext.Provider value={{
      workers,
      workOrders,
      addWorker,
      addWorkOrder
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

// HOOK
export function useAppData() {
  return useContext(AppDataContext);
}
