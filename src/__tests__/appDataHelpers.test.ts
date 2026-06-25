import { describe, it, expect, vi } from 'vitest';
import {
  genId,
  getInitials,
  todayISO,
  getQueueDate,
  normalizeQueueOrders,
  dbToWorker,
  workerToDb,
  dbToPricing,
  pricingToDb,
  dbToWorkOrder,
  dbToAttendance,
  attendanceToDb,
  dbToCommission,
  commissionToDb,
  dbToUtilityLog,
  VEHICLE_TYPES,
  SERVICE_TYPES,
} from '@/context/AppDataContext';
import type { WorkOrder } from '@/context/AppDataContext';

// Mock supabase so the module can be imported without real env vars
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: () => ({ data: [], error: null }) }),
      insert: () => ({ then: () => {} }),
      update: () => ({ eq: () => ({ then: () => {} }) }),
      delete: () => ({ eq: () => ({ then: () => {} }) }),
      upsert: () => ({ then: () => {} }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  },
}));

describe('getInitials', () => {
  it('returns two-letter initials from a two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns two-letter initials from a three-word name', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('returns a single letter for a single-word name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('uppercases lowercase names', () => {
    expect(getInitials('jane doe')).toBe('JD');
  });
});

describe('todayISO', () => {
  it('returns a date string in YYYY-MM-DD format', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches the current date', () => {
    const expected = new Date().toISOString().split('T')[0];
    expect(todayISO()).toBe(expected);
  });
});

describe('genId', () => {
  it('generates IDs with the given prefix', () => {
    const id = genId('WO');
    expect(id).toMatch(/^WO-\d+$/);
  });

  it('generates unique IDs on consecutive calls', () => {
    const id1 = genId('T');
    const id2 = genId('T');
    expect(id1).not.toBe(id2);
  });
});

describe('getQueueDate', () => {
  it('returns queueDate when present', () => {
    const result = getQueueDate({ createdAt: '2025-01-15T10:00:00Z', queueDate: '2025-01-20' });
    expect(result).toBe('2025-01-20');
  });

  it('falls back to createdAt date portion when queueDate is undefined', () => {
    const result = getQueueDate({ createdAt: '2025-06-10T14:30:00Z', queueDate: undefined });
    expect(result).toBe('2025-06-10');
  });
});

describe('normalizeQueueOrders', () => {
  const today = todayISO();

  function makeOrder(overrides: Partial<WorkOrder>): WorkOrder {
    return {
      id: 'test-1',
      plate: 'ABC-123',
      vehicleType: 'Saloon - Small',
      services: ['Body Wash'],
      status: 'Pending',
      assignedWorkers: [],
      createdAt: `${today}T10:00:00Z`,
      queueDate: today,
      queueNumber: '',
      queuePosition: 0,
      ...overrides,
    };
  }

  it('assigns sequential queue positions to pending orders', () => {
    const orders = [
      makeOrder({ id: 'wo-1', createdAt: `${today}T09:00:00Z` }),
      makeOrder({ id: 'wo-2', createdAt: `${today}T09:05:00Z` }),
      makeOrder({ id: 'wo-3', createdAt: `${today}T09:10:00Z` }),
    ];

    const result = normalizeQueueOrders(orders);
    expect(result.find((o) => o.id === 'wo-1')!.queuePosition).toBe(1);
    expect(result.find((o) => o.id === 'wo-2')!.queuePosition).toBe(2);
    expect(result.find((o) => o.id === 'wo-3')!.queuePosition).toBe(3);
  });

  it('assigns position 0 to in-progress orders', () => {
    const orders = [
      makeOrder({ id: 'wo-1', status: 'In Progress', createdAt: `${today}T09:00:00Z` }),
      makeOrder({ id: 'wo-2', status: 'Pending', createdAt: `${today}T09:05:00Z` }),
    ];

    const result = normalizeQueueOrders(orders);
    expect(result.find((o) => o.id === 'wo-1')!.queuePosition).toBe(0);
    expect(result.find((o) => o.id === 'wo-2')!.queuePosition).toBe(1);
  });

  it('prioritizes VIP orders ahead of non-VIP', () => {
    const orders = [
      makeOrder({ id: 'wo-regular', createdAt: `${today}T09:00:00Z`, isVip: false }),
      makeOrder({ id: 'wo-vip', createdAt: `${today}T09:05:00Z`, isVip: true }),
    ];

    const result = normalizeQueueOrders(orders);
    expect(result.find((o) => o.id === 'wo-vip')!.queuePosition).toBe(1);
    expect(result.find((o) => o.id === 'wo-regular')!.queuePosition).toBe(2);
  });

  it('respects priorityPosition for manual ordering', () => {
    const orders = [
      makeOrder({ id: 'wo-1', createdAt: `${today}T09:00:00Z`, priorityPosition: 5 }),
      makeOrder({ id: 'wo-2', createdAt: `${today}T09:05:00Z`, priorityPosition: 1 }),
    ];

    const result = normalizeQueueOrders(orders);
    expect(result.find((o) => o.id === 'wo-2')!.queuePosition).toBe(1);
    expect(result.find((o) => o.id === 'wo-1')!.queuePosition).toBe(2);
  });

  it('assigns queue numbers in A-001 format', () => {
    const orders = [makeOrder({ id: 'wo-1', createdAt: `${today}T09:00:00Z` })];

    const result = normalizeQueueOrders(orders);
    expect(result[0].queueNumber).toBe('A-001');
  });

  it('does not modify orders from other dates', () => {
    const otherDate = '2020-01-01';
    const orders = [
      makeOrder({
        id: 'wo-old',
        createdAt: `${otherDate}T09:00:00Z`,
        queueDate: otherDate,
        queuePosition: 42,
      }),
    ];

    const result = normalizeQueueOrders(orders);
    expect(result[0].queuePosition).toBe(42);
  });
});

describe('dbToWorker / workerToDb round-trip', () => {
  const dbRow = {
    id: 'w-1',
    name: 'Kwame Mensah',
    phone: '+233501234567',
    initials: 'KM',
    status: 'active',
    jobs_today: 3,
    commission_rate: 15,
    join_date: '2024-01-01',
    role: 'Car Washer',
  };

  it('converts a DB row to a Worker object', () => {
    const worker = dbToWorker(dbRow);
    expect(worker.id).toBe('w-1');
    expect(worker.name).toBe('Kwame Mensah');
    expect(worker.commissionRate).toBe(15);
    expect(worker.jobsToday).toBe(3);
  });

  it('round-trips without data loss', () => {
    const worker = dbToWorker(dbRow);
    const back = workerToDb(worker);
    expect(back).toEqual(dbRow);
  });

  it('applies defaults for missing fields', () => {
    const worker = dbToWorker({ id: 'w-2', name: 'Test' });
    expect(worker.phone).toBe('');
    expect(worker.status).toBe('active');
    expect(worker.jobsToday).toBe(0);
    expect(worker.commissionRate).toBe(0);
    expect(worker.role).toBe('Car Washer');
    expect(worker.initials).toBe('T');
  });
});

describe('dbToPricing / pricingToDb round-trip', () => {
  const dbRow = {
    id: 'prc-1',
    vehicle_type: 'SUV - Large',
    service_type: 'Body Wash',
    price: 50,
    recommended_minutes: 45,
  };

  it('converts a DB row to a PricingItem', () => {
    const pricing = dbToPricing(dbRow);
    expect(pricing.vehicleType).toBe('SUV - Large');
    expect(pricing.serviceType).toBe('Body Wash');
    expect(pricing.price).toBe(50);
    expect(pricing.recommendedMinutes).toBe(45);
  });

  it('round-trips without data loss', () => {
    const pricing = dbToPricing(dbRow);
    const back = pricingToDb(pricing);
    expect(back).toEqual(dbRow);
  });
});

describe('dbToWorkOrder / workOrderToDb', () => {
  it('converts a DB row to a WorkOrder', () => {
    const dbRow = {
      id: 'wo-1',
      plate: 'GR-1234-25',
      vehicle_type: 'Saloon - Medium',
      services: ['Body Wash', 'Vacuuming'],
      status: 'Pending',
      assigned_workers: ['w-1'],
      created_at: '2025-06-10T10:00:00Z',
      started_at: null,
      completed_at: null,
      duration: null,
      notes: 'test note',
      total_amount: 80,
      additional_service_description: '',
      additional_service_cost: 0,
      discount: 5,
      customer_rating: 4,
      customer_comment: 'Great',
      customer_satisfaction: 'satisfied',
      customer_certified_at: null,
      closure_status: 'open',
      target_minutes: 30,
      quality_passed: true,
      extension_minutes: 0,
      extension_reason_category: null,
      extension_reason: null,
      auto_closed_at: null,
      completed_within_target: null,
      queue_number: 'A-001',
      queue_position: 1,
      queue_date: '2025-06-10',
      source: 'walk_in',
      is_vip: false,
      bay_number: 2,
      priority_position: null,
    };

    const wo = dbToWorkOrder(dbRow);
    expect(wo.plate).toBe('GR-1234-25');
    expect(wo.vehicleType).toBe('Saloon - Medium');
    expect(wo.services).toEqual(['Body Wash', 'Vacuuming']);
    expect(wo.assignedWorkers).toEqual(['w-1']);
    expect(wo.discount).toBe(5);
    expect(wo.customerRating).toBe(4);
    expect(wo.bayNumber).toBe(2);
    expect(wo.source).toBe('walk_in');
  });

  it('applies defaults for missing DB fields', () => {
    const wo = dbToWorkOrder({
      id: 'wo-2',
      plate: 'TEST',
      vehicle_type: 'Pickup',
      created_at: '2025-01-01T00:00:00Z',
    });
    expect(wo.services).toEqual([]);
    expect(wo.status).toBe('Pending');
    expect(wo.assignedWorkers).toEqual([]);
    expect(wo.totalAmount).toBe(0);
    expect(wo.targetMinutes).toBe(30);
    expect(wo.source).toBe('walk_in');
    expect(wo.isVip).toBe(false);
  });
});

describe('dbToAttendance / attendanceToDb round-trip', () => {
  const dbRow = {
    id: 'att-1',
    worker_id: 'w-1',
    worker_name: 'Kwame',
    date: '2025-06-10',
    check_in: '08:00',
    check_out: '17:00',
    status: 'Present',
    hours_worked: 9,
  };

  it('converts correctly', () => {
    const att = dbToAttendance(dbRow);
    expect(att.workerId).toBe('w-1');
    expect(att.workerName).toBe('Kwame');
    expect(att.checkIn).toBe('08:00');
    expect(att.hoursWorked).toBe(9);
  });

  it('round-trips', () => {
    const att = dbToAttendance(dbRow);
    const back = attendanceToDb(att);
    expect(back).toEqual(dbRow);
  });
});

describe('dbToCommission / commissionToDb round-trip', () => {
  const dbRow = {
    id: 'com-1',
    worker_id: 'w-1',
    worker_name: 'Kwame',
    worker_initials: 'KM',
    date: '2025-06-10',
    jobs_completed: 5,
    total_earned: 75,
    rate: 15,
  };

  it('converts correctly', () => {
    const com = dbToCommission(dbRow);
    expect(com.jobsCompleted).toBe(5);
    expect(com.totalEarned).toBe(75);
    expect(com.rate).toBe(15);
  });

  it('round-trips', () => {
    const com = dbToCommission(dbRow);
    const back = commissionToDb(com);
    expect(back).toEqual(dbRow);
  });
});

describe('dbToUtilityLog', () => {
  it('converts a DB row to a UtilityLog', () => {
    const row = {
      id: 'elec-2025-06-10',
      log_date: '2025-06-10',
      utility_type: 'electricity',
      opening_reading: 1000,
      closing_reading: 1050,
      opening_cost: 500,
      closing_cost: 525,
      consumption: 50,
      cost_consumed: 25,
      opening_logged_at: '2025-06-10T07:00:00Z',
      closing_logged_at: '2025-06-10T17:00:00Z',
      status: 'completed',
    };

    const log = dbToUtilityLog(row);
    expect(log.utilityType).toBe('electricity');
    expect(log.openingReading).toBe(1000);
    expect(log.closingReading).toBe(1050);
    expect(log.consumption).toBe(50);
    expect(log.costConsumed).toBe(25);
    expect(log.status).toBe('completed');
  });

  it('handles null readings', () => {
    const row = {
      id: 'water-2025-06-10',
      log_date: '2025-06-10',
      utility_type: 'water',
      opening_reading: null,
      closing_reading: null,
      opening_cost: 0,
      closing_cost: 0,
      status: 'pending',
    };

    const log = dbToUtilityLog(row);
    expect(log.openingReading).toBeNull();
    expect(log.closingReading).toBeNull();
  });
});

describe('constants', () => {
  it('VEHICLE_TYPES contains expected entries', () => {
    expect(VEHICLE_TYPES).toContain('Saloon - Small');
    expect(VEHICLE_TYPES).toContain('SUV - Large');
    expect(VEHICLE_TYPES).toContain('Motorcycle');
    expect(VEHICLE_TYPES.length).toBeGreaterThan(10);
  });

  it('SERVICE_TYPES contains expected entries', () => {
    expect(SERVICE_TYPES).toContain('Body Wash');
    expect(SERVICE_TYPES).toContain('Vacuuming');
    expect(SERVICE_TYPES.length).toBeGreaterThan(3);
  });
});
