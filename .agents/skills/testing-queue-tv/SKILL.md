---
name: testing-kaklinx-app
description: Test the Kaklinx Auto Bay Manager app end-to-end. Use when verifying queue-tv display, work order management (VIP toggle, create/edit), bay badges, serving index cycling, or retry mechanism changes.
---

# Testing the Queue TV Page

## Overview

The queue-tv page (`/queue-tv`) is a full-screen dashboard for displaying the auto bay service queue on a TV/monitor. It shows three columns: Up Next (pending), Now Serving (in progress), and Recently Completed.

## Prerequisites

### Dev Server

```bash
cd /path/to/kaklinx-auto-bay-manager
npm run dev -- -p 4028
```

The page is at `http://localhost:4028/queue-tv`.

### Supabase Credentials

The app connects to Supabase. Ensure `.env.local` has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (needed for inserting/deleting test data)

### Devin Secrets Needed

- `SUPABASE_SERVICE_ROLE_KEY` - for direct database operations during test setup/teardown

## Test Data Setup

Insert test orders via Supabase REST API using the service role key. You need orders covering:
- **In Progress** with `bay_number` 1, 2, 3 (tests bay badge colors and serving index cycling)
- **Pending** orders (at least one VIP, one from customer_app, one walk_in) for Up Next column
- **Completed** orders with `completed_at` set for Recently Completed column

Use `queue_date` set to today's date (YYYY-MM-DD format). Use queue_numbers with a test prefix (e.g., "T-001") for easy cleanup.

IDs must be provided explicitly (e.g., "WO-TEST-{timestamp}") — the table does not auto-generate IDs.

Example insert via curl:
```bash
curl -X POST "$SUPABASE_URL/rest/v1/work_orders" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '[{...orders...}]'
```

## Key Test Scenarios

### 1. Date Filtering (todayISO)

The page filters orders by `queue_date` using local date (not UTC). Verify:
- Header shows correct local day/date
- Orders for today's local date appear
- No "Reconnecting" badge on normal load

### 2. Bay Badge Rendering

The `bayBadge()` function renders colored badges for In Progress orders:
- Bay 1: orange (bg-orange-500/15, text-orange-300)
- Bay 2: blue (bg-blue-500/15, text-blue-300)
- Bay 3: emerald (bg-emerald-500/15, text-emerald-300)

Verify badges appear in the Now Serving section as the serving index cycles. Use browser console to inspect element classes if colors are hard to distinguish visually.

### 3. Serving Index Cycling

With multiple In Progress orders, the Now Serving section cycles through them every 5 seconds. The counter shows "X/N" format. Verify it wraps correctly (e.g., 3/3 → 1/3).

### 4. Retry Mechanism

To test the retry mechanism:
1. Open DevTools → Network tab → "Network request blocking" panel
2. Add pattern `*supabase*` and enable blocking
3. Refresh the page
4. Wait 3-5 seconds — "Reconnecting" badge should appear in header
5. Uncheck the blocking pattern to re-enable Supabase
6. Wait up to 10 seconds — retry interval fires and page should auto-recover
7. "Reconnecting" badge disappears, "Live" badge returns, data loads

**Important:** The retry interval is 10 seconds, so you may need to wait up to 10s after unblocking for recovery.

### 5. General Regression

Verify all display elements:
- Stats bar: Waiting, In Service, Completed counts, Avg Wait
- Up Next: queue numbers, VIP badges, source badges (Booked/Walk-in), vehicle info
- Now Serving: large queue number, vehicle type, plate, services, bay badge
- Recently Completed: order cards with "Done" status
- Live clock updating every second

## Cleanup

Delete test data after testing:
```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/work_orders?queue_date=eq.YYYY-MM-DD&queue_number=like.T-*" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

## Tips

- The Vercel preview deployment might require authentication — use localhost dev server instead
- Bay badge colors are subtle (low opacity backgrounds); use DevTools element inspector or console to verify exact classes
- The page uses Supabase realtime subscriptions — changes made via REST API should appear without refresh (but initial load uses a direct query)
- If testing during evening hours in a UTC-negative timezone, this is the best time to verify the todayISO fix (old bug showed wrong date after midnight UTC)

---

# Testing Work Orders Manager (VIP Toggle & CRUD)

## Overview

The Work Orders page (`/home` → Work Orders section) is the admin interface for creating, editing, and managing vehicle service orders. It includes a VIP toggle feature.

## Prerequisites

### Authentication

The `/home` page requires an authenticated user with `admin` role in the `profiles` table. Use a test account:
- Email/password auth via Supabase
- The user's profile must have `role = 'admin'` in the profiles table
- If access is denied (redirects to `/unauthorized`), check the profiles table

### Dev Server

```bash
cd /path/to/kaklinx-auto-bay-manager
npm run dev -- -p 4028
```

Navigate to `http://localhost:4028/home`.

## Key Test Scenarios

### 1. VIP Toggle - Create Order

1. Click "+ New Order" button (top right)
2. Fill in License Plate (e.g., "VIP-TEST-1")
3. Check the "VIP Customer" checkbox (located between License Plate and Vehicle Type fields)
4. Select a vehicle type, at least one service, and at least one worker
5. Submit the form

**Pass criteria:**
- VIP checkbox visible in form between License Plate and Vehicle Type
- After submission, yellow "VIP" badge appears next to plate in desktop table
- Mobile card shows "VIP" badge next to queue number

### 2. VIP Toggle - Edit Persistence

1. Find the VIP order in the list
2. Click the Edit (pencil) icon in Actions column
3. Observe the VIP checkbox state in the edit form

**Pass criteria:**
- VIP checkbox is CHECKED when editing a VIP order
- If unchecked and saved, the VIP badge disappears from the list
- This verifies round-trip persistence through Supabase (`is_vip` column)

### 3. Non-VIP Control Test

1. Create an order without checking VIP
2. Observe the list

**Pass criteria:**
- No VIP badge appears for non-VIP orders
- Proves badge rendering is conditional on `isVip` flag

### 4. Customer Orders VIP (CustomerOrdersManager)

The Customer Orders page also has a VIP toggle when converting a customer order to a work order:
1. Navigate to Customer Orders in sidebar
2. Find an order pending conversion
3. In the "Assign Worker(s)" section, there's a "VIP" checkbox
4. Check it and convert

**Pass criteria:**
- VIP checkbox visible in conversion flow
- Converted work order has VIP badge in Work Orders list

## Form Field Order

The work order form fields appear in this order:
1. License Plate
2. VIP Customer checkbox
3. Vehicle Type dropdown
4. Services (multi-select)
5. Workers (multi-select)

## Cleanup

Delete test orders via the UI:
- Click the trash icon in the Actions column
- Confirm in the "Delete Work Order?" modal

Or via API:
```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/work_orders?plate=like.VIP-TEST*" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```
