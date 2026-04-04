# King Service Tech PWA - API Documentation

## System Overview

This document explains all API routes, their purposes, and how the system works together.

---

## 🔐 Authentication System

### Login Flow
1. User enters email and password on `/login` page
2. Frontend sends credentials to `/api/auth/login`
3. Backend verifies password with bcrypt
4. If valid, user data is stored in localStorage
5. User is redirected to `/dashboard`

### Session Management
- **Storage**: User data stored in `localStorage` (both email and full user object)
- **Persistence**: Session survives page reloads
- **Verification**: Background check on each page load
- **Logout**: Clears localStorage and redirects to login

---

## 📊 Dashboard Module

### `/api/dashboard/stats` (GET)
**Purpose**: Get real-time business statistics

**Returns**:
```json
{
  "todaySales": 150000,
  "repairRevenue": 80000,
  "netProfit": 50000,
  "pendingRepairs": 5,
  "activeRepairs": 8,
  "readyForPickup": 3,
  "lowStockItems": 12,
  "overdueRepairs": 2,
  "unpaidInvoices": 25000
}
```

**Used By**: Dashboard page for stats cards, repair status, and attention alerts

**Refresh**: Auto-refreshes every 30 seconds

---

## 🔧 Repairs Management Module

### `/api/repairs` (GET)
**Purpose**: Fetch all repair jobs

**Query Parameters**:
- `status` - Filter by status (pending, diagnosed, in_progress, ready, collected)
- `assignedTo` - Filter by technician ID

**Returns**: Array of repair jobs with customer and technician details

**Used By**: Repairs page Kanban board

---

### `/api/repairs` (POST)
**Purpose**: Create new repair job

**Required Fields**:
- `customerId` - Customer ID (verified to exist)
- `deviceType` - Type of device (e.g., "Laptop", "Phone")
- `brand` - Device brand
- `model` - Device model
- `problemDescription` - Issue description
- `promisedDate` - Expected completion date
- `createdBy` - User ID creating the job

**Optional Fields**:
- `serialNumber` - Device serial number
- `imei` - Phone IMEI
- `priority` - normal/urgent/express (default: normal)
- `depositPaid` - Deposit amount
- `assignedTo` - Technician ID
- `photoUrls` - Array of photo URLs

**Process**:
1. Validates all required fields
2. Verifies customer exists
3. Verifies creator user exists
4. Verifies assigned technician exists (if provided)
5. Auto-generates job number (REP-2025-0001)
6. Creates repair job in database
7. Creates notification for assigned technician
8. Returns created job with relations

**Auto-Generated**: Job number (REP-YYYY-NNNN format)

---

### `/api/repairs/[id]` (GET)
**Purpose**: Get single repair job details

**Returns**: Full repair job with customer, technician, and parts used

---

### `/api/repairs/[id]` (PATCH)
**Purpose**: Update repair job details

**Updatable Fields**: All fields except jobNumber and createdBy

---

### `/api/repairs/[id]` (DELETE)
**Purpose**: Delete repair job (soft delete recommended)

---

### `/api/repairs/[id]/status` (PATCH)
**Purpose**: Update repair job status

**Body**:
```json
{
  "status": "in_progress"
}
```

**Process**:
1. Updates status
2. Sets timestamps (startedAt, completedAt, collectedAt)
3. Creates notification for customer
4. Returns updated job

**Status Flow**: pending → diagnosed → in_progress → ready → collected

---

## 👥 Customer Management Module

### `/api/customers` (GET)
**Purpose**: Fetch all customers

**Returns**: Array of customers ordered by creation date (newest first)

**Used By**: Customers page, repair job creation dialog

---

### `/api/customers` (POST)
**Purpose**: Create new customer

**Required Fields**:
- `name` - Customer name
- `phone` - Primary phone number

**Optional Fields**:
- `phone2` - Secondary phone
- `email` - Email address
- `address` - Physical address
- `customerType` - walk_in/regular/vip/corporate (default: walk_in)
- `notes` - Additional notes

**Validation**: Name and phone are required

---

### `/api/customers/[id]` (GET)
**Purpose**: Get customer details with history

**Returns**:
```json
{
  "id": "...",
  "name": "John Doe",
  "phone": "0788123456",
  "repairJobs": [...],      // Last 10 repairs
  "salesInvoices": [...],   // Last 10 sales
  "appointments": [...],    // Last 10 appointments
  "totalSpent": 500000,
  "loyaltyPoints": 150
}
```

**Used By**: Customer detail page

---

### `/api/customers/[id]` (PATCH)
**Purpose**: Update customer information

---

### `/api/customers/[id]` (DELETE)
**Purpose**: Delete customer (should check for existing repairs/sales first)

---

## 📦 Inventory Management Module

### `/api/inventory` (GET)
**Purpose**: Fetch all active inventory items

**Returns**: Array of items with category information

**Used By**: Inventory page, Sales POS, repair parts selection

---

### `/api/inventory` (POST)
**Purpose**: Create new inventory item

**Required Fields**:
- `name` - Item name
- `sku` - Stock Keeping Unit (must be unique)
- `categoryId` - Category ID (verified to exist)

**Optional Fields**:
- `barcode` - Barcode number
- `unitCost` - Purchase cost
- `sellingPrice` - Selling price
- `quantity` - Current stock (default: 0)
- `reorderLevel` - Low stock threshold (default: 10)
- `reorderQuantity` - Reorder amount (default: 50)
- `location` - Storage location
- `supplierId` - Supplier ID

**Validation**:
1. Checks required fields
2. Verifies category exists
3. Checks for duplicate SKU
4. Creates item with proper data types

**Error Handling**: Returns specific error for duplicate SKU

---

### `/api/inventory/[id]` (PATCH)
**Purpose**: Update inventory item

**Validation**: Checks item exists, handles duplicate SKU

---

### `/api/inventory/categories` (GET)
**Purpose**: Fetch inventory categories

**Returns**: Array of categories (SHOP, REPAIR types)

---

### `/api/inventory/categories` (POST)
**Purpose**: Create new category

**Body**:
```json
{
  "name": "Shop Stock",
  "type": "SHOP"
}
```

---

### `/api/inventory/adjust` (POST)
**Purpose**: Adjust stock quantity

**Body**:
```json
{
  "itemId": "...",
  "quantity": 10,
  "type": "IN",           // IN or OUT
  "reason": "purchase",   // sale, repair_use, damage, theft, return, adjustment, purchase
  "userId": "...",
  "notes": "Optional notes"
}
```

**Process**:
1. Validates item exists
2. Creates inventory transaction record
3. Updates item quantity
4. Logs user action
5. Checks if low stock alert needed

**Used By**: Stock adjustment dialog

---

## 💰 Sales & POS Module

### `/api/sales` (POST)
**Purpose**: Process a sale transaction

**Body**:
```json
{
  "items": [
    {
      "itemId": "...",
      "quantity": 2,
      "unitPrice": 5000,
      "discount": 0
    }
  ],
  "paymentMethod": "cash",  // cash, momo_mtn, momo_airtel, bank, credit
  "subtotal": 10000,
  "tax": 0,
  "total": 10000,
  "paidAmount": 10000,
  "userId": "...",
  "customerId": "..."       // Optional
}
```

**Process**:
1. Auto-generates invoice number (INV-2025-0001)
2. Creates sales invoice
3. Creates sales items (line items)
4. Deducts inventory quantities
5. Creates inventory transactions
6. Updates customer totalSpent
7. Returns invoice with items

**Auto-Generated**: Invoice number

**Inventory Impact**: Automatically reduces stock quantities

---

## 📅 Appointments Module

### `/api/appointments` (GET)
**Purpose**: Fetch all appointments

**Returns**: Array of appointments with customer and assigned user

**Ordered By**: Appointment date (ascending)

---

### `/api/appointments` (POST)
**Purpose**: Schedule new appointment

**Required Fields**:
- `customerId` - Customer ID
- `title` - Appointment title
- `appointmentDate` - Date and time
- `assignedTo` - Technician ID
- `createdBy` - User creating appointment

**Optional Fields**:
- `description` - Details
- `duration` - Duration in minutes (default: 60)
- `status` - scheduled/completed/cancelled (default: scheduled)
- `location` - Meeting location

---

## 💵 Expenses Module

### `/api/expenses` (GET)
**Purpose**: Fetch business expenses

**Query Parameters**:
- `startDate` - Filter from date
- `endDate` - Filter to date

**Returns**: Array of expenses with user information

---

### `/api/expenses` (POST)
**Purpose**: Record new expense

**Required Fields**:
- `category` - Expense category
- `description` - What was purchased
- `amount` - Cost
- `userId` - User recording expense

**Optional Fields**:
- `expenseDate` - Date of expense (default: today)
- `notes` - Additional notes

---

## 📈 Reports Module

### `/api/reports` (GET)
**Purpose**: Generate business reports

**Query Parameters**:
- `type` - Report type (sales, repairs, inventory)
- `startDate` - Report start date
- `endDate` - Report end date

**Report Types**:

**Sales Report**:
```json
{
  "totalSales": 500000,
  "totalInvoices": 45,
  "sales": [...]
}
```

**Repairs Report**:
```json
{
  "totalRepairs": 30,
  "totalRevenue": 300000,
  "repairs": [...]
}
```

**Inventory Report**:
```json
{
  "totalItems": 150,
  "totalValue": 2000000,
  "lowStockItems": 12,
  "items": [...]
}
```

---

## 👤 User Management Module

### `/api/users` (GET)
**Purpose**: Fetch users

**Query Parameters**:
- `role` - Filter by role (owner, manager, technician, sales)

**Returns**: Array of active users (excludes password hash)

**Used By**: Repair assignment, appointment scheduling

---

## 🔄 System Workflows

### Complete Repair Workflow

1. **Customer Arrives**
   - Search customer or create new via `/api/customers`
   
2. **Create Repair Job**
   - POST to `/api/repairs` with device details
   - System generates job number
   - Assigns to technician (optional)
   - Notification sent to technician

3. **Diagnosis**
   - Technician updates status to "diagnosed"
   - PATCH `/api/repairs/[id]/status`
   - Adds diagnosis notes

4. **Parts Needed**
   - Search inventory via `/api/inventory`
   - Reserve parts for repair
   - POST to `/api/inventory/adjust` (OUT)

5. **Repair Work**
   - Update status to "in_progress"
   - Track time (optional)

6. **Completion**
   - Update status to "ready"
   - Customer notified
   - Invoice generated

7. **Collection**
   - Customer pays
   - Update status to "collected"
   - Record payment

---

### Sales Transaction Workflow

1. **Search Products**
   - GET `/api/inventory`
   - Display in POS grid

2. **Add to Cart**
   - Frontend cart management
   - Calculate totals

3. **Checkout**
   - POST to `/api/sales`
   - System auto-deducts inventory
   - Generates invoice
   - Creates transaction records

4. **Receipt**
   - Display/print invoice
   - Update customer loyalty points

---

### Inventory Management Workflow

1. **Add New Item**
   - Ensure category exists
   - POST to `/api/inventory`
   - System validates SKU uniqueness

2. **Receive Stock**
   - POST to `/api/inventory/adjust`
   - Type: IN, Reason: purchase
   - Updates quantity

3. **Low Stock Alert**
   - System checks quantity vs reorderLevel
   - Shows in dashboard alerts
   - Triggers reorder notification

4. **Stock Take**
   - Manual adjustment
   - POST to `/api/inventory/adjust`
   - Type: IN/OUT, Reason: adjustment

---

## 🔔 Notification System

**Automatic Notifications Created For**:
- New repair assigned to technician
- Repair status changes (customer notified)
- Device ready for pickup
- Low stock alerts
- Overdue repairs

**Notification Types**:
- `new_repair` - New job assigned
- `device_ready` - Repair completed
- `low_stock` - Inventory below threshold
- `overdue_repair` - Past promised date
- `payment_due` - Outstanding balance

---

## 🔒 Security & Validation

### All Routes Validate:
1. **Required Fields** - Returns 400 with clear error message
2. **Foreign Keys** - Verifies IDs exist before creating relations
3. **Data Types** - Converts strings to numbers/dates properly
4. **Unique Constraints** - Checks for duplicates (SKU, job numbers)

### Error Response Format:
```json
{
  "error": "Descriptive error message"
}
```

### Success Response:
Returns created/updated object with all relations included

---

## 📱 Real-time Features

### Auto-Refresh (Every 30 seconds):
- Dashboard statistics
- Repair board
- Inventory levels
- Customer list

### Session Persistence:
- User data cached in localStorage
- Background verification
- Survives page reloads

---

## 🎯 Best Practices

### When Creating Records:
1. Always validate required fields first
2. Verify foreign key relationships exist
3. Use transactions for multi-step operations
4. Log important actions
5. Return full object with relations

### When Updating Records:
1. Check record exists first
2. Only update provided fields
3. Maintain audit trail
4. Update related records if needed

### Error Handling:
1. Log detailed errors server-side
2. Return user-friendly messages
3. Use appropriate HTTP status codes
4. Don't expose sensitive information


---

## 🔔 PWA Push Notifications

### Overview
As a Progressive Web App (PWA), the system supports push notifications to keep users informed even when the app is not open.

### Service Worker Setup
**Location**: `/public/sw.js`

**Features**:
- Background sync
- Push notification handling
- Offline caching
- Update notifications

### Notification Triggers

#### 1. New Repair Assignment
**When**: Repair job assigned to technician
**Trigger**: POST `/api/repairs` with `assignedTo`
**Notification**:
```json
{
  "title": "New Repair Assigned",
  "body": "Job REP-2025-0001: iPhone 13 - Screen replacement",
  "icon": "/icons/repair.png",
  "badge": "/icons/badge.png",
  "data": {
    "url": "/repairs/[id]",
    "type": "new_repair"
  }
}
```

#### 2. Repair Status Change
**When**: Status updated (especially to "ready")
**Trigger**: PATCH `/api/repairs/[id]/status`
**Notification**:
```json
{
  "title": "Device Ready for Pickup",
  "body": "Your iPhone 13 is ready for collection",
  "icon": "/icons/ready.png",
  "data": {
    "url": "/repairs/[id]",
    "type": "device_ready"
  }
}
```

#### 3. Low Stock Alert
**When**: Inventory falls below reorder level
**Trigger**: POST `/api/inventory/adjust` (OUT)
**Notification**:
```json
{
  "title": "Low Stock Alert",
  "body": "iPhone Screen Protector: Only 5 units remaining",
  "icon": "/icons/inventory.png",
  "data": {
    "url": "/inventory",
    "type": "low_stock"
  }
}
```

#### 4. Overdue Repair
**When**: Repair past promised date
**Trigger**: Daily cron job or background sync
**Notification**:
```json
{
  "title": "Overdue Repair",
  "body": "Job REP-2025-0001 is 2 days overdue",
  "icon": "/icons/warning.png",
  "data": {
    "url": "/repairs/[id]",
    "type": "overdue_repair"
  }
}
```

#### 5. Payment Reminder
**When**: Unpaid invoice after X days
**Trigger**: Scheduled task
**Notification**:
```json
{
  "title": "Payment Reminder",
  "body": "Invoice INV-2025-0001: RWF 50,000 due",
  "icon": "/icons/payment.png",
  "data": {
    "url": "/sales",
    "type": "payment_due"
  }
}
```

### Push Notification API

#### `/api/notifications/subscribe` (POST)
**Purpose**: Register device for push notifications

**Body**:
```json
{
  "userId": "...",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

#### `/api/notifications/send` (POST)
**Purpose**: Send push notification to user(s)

**Body**:
```json
{
  "userId": "...",           // or userIds: [...]
  "title": "Notification Title",
  "body": "Notification message",
  "icon": "/icons/icon.png",
  "data": {
    "url": "/target-page",
    "type": "notification_type"
  }
}
```

#### `/api/notifications` (GET)
**Purpose**: Get user's notification history

**Returns**: Array of notifications with read/unread status

#### `/api/notifications/[id]/read` (PATCH)
**Purpose**: Mark notification as read

### Implementation Steps

1. **Service Worker Registration**
   ```javascript
   // In _app.tsx or layout.tsx
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js');
   }
   ```

2. **Request Permission**
   ```javascript
   const permission = await Notification.requestPermission();
   if (permission === 'granted') {
     // Subscribe to push
   }
   ```

3. **Subscribe to Push**
   ```javascript
   const registration = await navigator.serviceWorker.ready;
   const subscription = await registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: VAPID_PUBLIC_KEY
   });
   ```

4. **Handle Push Events**
   ```javascript
   // In sw.js
   self.addEventListener('push', (event) => {
     const data = event.data.json();
     self.registration.showNotification(data.title, {
       body: data.body,
       icon: data.icon,
       badge: data.badge,
       data: data.data
     });
   });
   ```

5. **Handle Notification Clicks**
   ```javascript
   self.addEventListener('notificationclick', (event) => {
     event.notification.close();
     event.waitUntil(
       clients.openWindow(event.notification.data.url)
     );
   });
   ```

### Notification Preferences

Users can configure notification preferences:
- Enable/disable by type
- Quiet hours
- Sound settings
- Vibration patterns

**Stored in**: User preferences table or localStorage

### Testing Push Notifications

1. **Development**: Use browser DevTools → Application → Service Workers
2. **Testing**: Send test notification via API
3. **Production**: Monitor delivery rates and engagement

### Best Practices

✅ **Do**:
- Request permission at appropriate time (not immediately on load)
- Provide clear value proposition for notifications
- Allow users to customize notification types
- Include actionable information
- Deep link to relevant pages

❌ **Don't**:
- Spam users with too many notifications
- Send notifications for trivial updates
- Use notifications for marketing without consent
- Send notifications during quiet hours

---

## 🚀 Quick Reference

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Repairs | POST /api/repairs | GET /api/repairs | PATCH /api/repairs/[id] | DELETE /api/repairs/[id] |
| Customers | POST /api/customers | GET /api/customers | PATCH /api/customers/[id] | DELETE /api/customers/[id] |
| Inventory | POST /api/inventory | GET /api/inventory | PATCH /api/inventory/[id] | - |
| Sales | POST /api/sales | - | - | - |
| Appointments | POST /api/appointments | GET /api/appointments | - | - |
| Expenses | POST /api/expenses | GET /api/expenses | - | - |
| **Notifications** | **POST /api/notifications/send** | **GET /api/notifications** | **PATCH /api/notifications/[id]/read** | - |

---

## 📞 Support

For questions about specific routes or workflows, refer to:
- Source code in `/src/app/api/`
- Database schema in `/prisma/schema.prisma`
- Frontend components in `/src/app/`
- Service Worker in `/public/sw.js`

---

**Last Updated**: December 29, 2025
**System Version**: 1.0.0
**Database**: Neon PostgreSQL with Prisma ORM
**PWA Features**: Push Notifications, Offline Support, Service Worker
