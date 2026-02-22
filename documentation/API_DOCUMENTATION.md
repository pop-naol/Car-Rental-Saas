# 📚 API Documentation

## Enterprise Car Rental Management SaaS API

**Base URL**: `http://localhost:5000` (Development)  
**Production URL**: `https://api.your-domain.com`  
**Version**: 1.0.0

---

## 🔐 Authentication

All API endpoints (except `/health` and auth endpoints) require authentication using JWT tokens.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Expiration
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

---

## 📋 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Companies](#company-endpoints)
3. [Branches](#branch-endpoints)
4. [Vehicles](#vehicle-endpoints)
5. [Customers](#customer-endpoints)
6. [Drivers](#driver-endpoints)
7. [Bookings](#booking-endpoints)
8. [Rentals](#rental-endpoints)
9. [Financial](#financial-endpoints)
10. [Maintenance](#maintenance-endpoints)
11. [Analytics](#analytics-endpoints)
12. [Employees](#employee-endpoints)
13. [Notifications](#notification-endpoints)
14. [Documents](#document-endpoints)
15. [Error Codes](#error-codes)

---

## Authentication Endpoints

### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "COMPANY_MANAGER",
  "companyId": "uuid" // Required for non-SUPER_ADMIN roles
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "COMPANY_MANAGER"
  }
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "COMPANY_MANAGER",
    "companyId": "uuid"
  }
}
```

---

## Company Endpoints

### Create Company

```http
POST /api/companies
```

**Permission**: `SUPER_ADMIN` only

**Request Body:**
```json
{
  "name": "Premium Car Rentals Inc",
  "subscriptionTier": "premium"
}
```

**Response:** `201 Created`
```json
{
  "message": "Company created successfully",
  "company": {
    "id": "uuid",
    "name": "Premium Car Rentals Inc",
    "subscriptionTier": "premium",
    "isActive": true,
    "createdAt": "2026-02-12T10:00:00Z"
  }
}
```

### List Companies

```http
GET /api/companies
```

**Permission**: `SUPER_ADMIN` only

**Response:** `200 OK`
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "Premium Car Rentals Inc",
      "subscriptionTier": "premium",
      "isActive": true,
      "_count": {
        "branches": 5,
        "vehicles": 50,
        "users": 20
      }
    }
  ]
}
```

### Get Company

```http
GET /api/companies/:id
```

### Update Company

```http
PATCH /api/companies/:id
```

### Suspend Company

```http
PATCH /api/companies/:id/suspend
```

### Activate Company

```http
PATCH /api/companies/:id/activate
```

---

## Branch Endpoints

### Create Branch

```http
POST /api/branches
```

**Request Body:**
```json
{
  "companyId": "uuid",
  "name": "Downtown Branch",
  "address": "123 Main St, City, State 12345",
  "phone": "+1-555-0100",
  "email": "downtown@premium.com"
}
```

**Response:** `201 Created`

### List Branches

```http
GET /api/branches
```

**Response:** `200 OK`
```json
{
  "branches": [
    {
      "id": "uuid",
      "name": "Downtown Branch",
      "address": "123 Main St, City, State 12345",
      "phone": "+1-555-0100",
      "email": "downtown@premium.com",
      "isActive": true,
      "_count": {
        "vehicles": 10,
        "bookings": 25
      }
    }
  ]
}
```

### Get Branch

```http
GET /api/branches/:id
```

### Update Branch

```http
PATCH /api/branches/:id
```

### Delete Branch

```http
DELETE /api/branches/:id
```

---

## Vehicle Endpoints

### Create Vehicle

```http
POST /api/vehicles
```

**Request Body:**
```json
{
  "companyId": "uuid",
  "branchId": "uuid",
  "vin": "1HGBH41JXMN109186",
  "plateNumber": "ABC-1234",
  "brand": "Toyota",
  "model": "Camry",
  "year": 2024,
  "fuelType": "Gasoline",
  "transmission": "Automatic",
  "dailyRate": 45.00,
  "weeklyRate": 280.00,
  "monthlyRate": 1000.00,
  "currentOdometer": 5000,
  "currentFuel": 100,
  "purchaseCost": 28000.00
}
```

**Response:** `201 Created`

### List Vehicles

```http
GET /api/vehicles?status=AVAILABLE&branchId=uuid&search=Toyota
```

**Query Parameters:**
- `status`: Filter by status (AVAILABLE, RESERVED, RENTED, MAINTENANCE, OUT_OF_SERVICE)
- `branchId`: Filter by branch
- `search`: Search by VIN, plate, brand, or model

**Response:** `200 OK`
```json
{
  "vehicles": [
    {
      "id": "uuid",
      "vin": "1HGBH41JXMN109186",
      "plateNumber": "ABC-1234",
      "brand": "Toyota",
      "model": "Camry",
      "year": 2024,
      "status": "AVAILABLE",
      "dailyRate": 45.00,
      "branch": {
        "id": "uuid",
        "name": "Downtown Branch"
      },
      "_count": {
        "bookings": 10,
        "rentals": 8
      }
    }
  ]
}
```

### Get Vehicle

```http
GET /api/vehicles/:id
```

### Update Vehicle

```http
PATCH /api/vehicles/:id
```

### Update Vehicle Status

```http
PATCH /api/vehicles/:id/status
```

**Request Body:**
```json
{
  "status": "MAINTENANCE"
}
```

### Transfer Vehicle

```http
POST /api/vehicles/:id/transfer
```

**Request Body:**
```json
{
  "toBranchId": "uuid"
}
```

### Delete Vehicle

```http
DELETE /api/vehicles/:id
```

### Calculate Vehicle Profit

```http
GET /api/vehicles/:id/profit?startDate=2024-01-01&endDate=2024-12-31
```

**Response:** `200 OK`
```json
{
  "profit": {
    "vehicleId": "uuid",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "totalRevenue": 15000.00,
    "totalExpenses": 3000.00,
    "profit": 12000.00
  }
}
```

---

## Customer Endpoints

### Create Customer

```http
POST /api/customers
```

**Request Body:**
```json
{
  "companyId": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-1234",
  "address": "789 Customer St, City, State 12345",
  "licenseNumber": "DL123456789",
  "licenseExpiry": "2026-12-31T00:00:00Z",
  "dateOfBirth": "1990-05-15T00:00:00Z",
  "idNumber": "ID987654321"
}
```

**Response:** `201 Created`

### List Customers

```http
GET /api/customers?isBlacklisted=false&loyaltyLevel=GOLD&search=John
```

**Query Parameters:**
- `isBlacklisted`: Filter by blacklist status
- `loyaltyLevel`: Filter by loyalty level (STANDARD, SILVER, GOLD, PLATINUM)
- `search`: Search by name, email, phone, or license

### Get Customer

```http
GET /api/customers/:id
```

**Response:** `200 OK`
```json
{
  "customer": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-1234",
    "licenseNumber": "DL123456789",
    "licenseExpiry": "2026-12-31T00:00:00Z",
    "isBlacklisted": false,
    "loyaltyLevel": "GOLD",
    "totalSpending": 5000.00,
    "bookings": [...],
    "rentals": [...],
    "_count": {
      "bookings": 10,
      "rentals": 8
    }
  }
}
```

### Update Customer

```http
PATCH /api/customers/:id
```

### Blacklist Customer

```http
PATCH /api/customers/:id/blacklist
```

### Remove Blacklist

```http
PATCH /api/customers/:id/remove-blacklist
```

### Update Loyalty Level

```http
PATCH /api/customers/:id/loyalty
```

**Request Body:**
```json
{
  "loyaltyLevel": "PLATINUM"
}
```

### Check Rental Eligibility

```http
GET /api/customers/:id/can-rent
```

**Response:** `200 OK`
```json
{
  "canRent": true
}
```

or

```json
{
  "canRent": false,
  "reason": "CUSTOMER_BLACKLISTED"
}
```

---

## Driver Endpoints

### Create Driver

```http
POST /api/drivers
```

**Request Body:**
```json
{
  "companyId": "uuid",
  "firstName": "Mike",
  "lastName": "Driver",
  "email": "mike.driver@premium.com",
  "phone": "+1-555-3000",
  "licenseNumber": "CDL123456789",
  "licenseExpiry": "2027-06-30T00:00:00Z",
  "dateOfBirth": "1988-11-25T00:00:00Z",
  "address": "321 Driver Ln, City, State 12345"
}
```

### List Drivers

```http
GET /api/drivers?isActive=true&search=Mike
```

### Get Driver

```http
GET /api/drivers/:id
```

### Update Driver

```http
PATCH /api/drivers/:id
```

### Rate Driver

```http
POST /api/drivers/:id/rate
```

**Request Body:**
```json
{
  "rentalId": "uuid",
  "rating": 5,
  "onTime": true
}
```

### Record Incident

```http
POST /api/drivers/:id/incident
```

### Get Performance Ranking

```http
GET /api/drivers/performance/ranking
```

**Response:** `200 OK`
```json
{
  "ranking": [
    {
      "id": "uuid",
      "firstName": "Mike",
      "lastName": "Driver",
      "totalTrips": 50,
      "averageRating": 4.8,
      "incidentsCount": 0,
      "performanceScore": 95.5
    }
  ]
}
```

### Check Driver Eligibility

```http
GET /api/drivers/:id/can-drive
```

---

## Booking Endpoints

### Check Availability

```http
POST /api/bookings/check-availability
```

**Request Body:**
```json
{
  "vehicleId": "uuid",
  "startDate": "2026-03-01T10:00:00Z",
  "endDate": "2026-03-05T10:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "available": true
}
```

or

```json
{
  "available": false,
  "conflictingBookings": [...]
}
```

### Create Booking

```http
POST /api/bookings
```

**Request Body:**
```json
{
  "companyId": "uuid",
  "customerId": "uuid",
  "vehicleId": "uuid",
  "branchId": "uuid",
  "startDate": "2026-03-01T10:00:00Z",
  "endDate": "2026-03-05T10:00:00Z",
  "driverId": "uuid",
  "estimatedCost": 200.00,
  "discountCode": "SPRING2026",
  "discountAmount": 20.00,
  "notes": "Customer requested GPS"
}
```

**Response:** `201 Created`

### List Bookings

```http
GET /api/bookings?status=CONFIRMED&customerId=uuid&vehicleId=uuid
```

**Query Parameters:**
- `status`: Filter by status (PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED)
- `customerId`: Filter by customer
- `vehicleId`: Filter by vehicle
- `startDate`: Filter by start date
- `endDate`: Filter by end date

### Get Overdue Bookings

```http
GET /api/bookings/overdue
```

### Get Booking

```http
GET /api/bookings/:id
```

### Update Booking

```http
PATCH /api/bookings/:id
```

### Confirm Booking

```http
PATCH /api/bookings/:id/confirm
```

### Cancel Booking

```http
PATCH /api/bookings/:id/cancel
```

### Add Service

```http
POST /api/bookings/:id/services
```

**Request Body:**
```json
{
  "serviceType": "GPS",
  "serviceName": "GPS Navigation System",
  "price": 10.00
}
```

### Remove Service

```http
DELETE /api/bookings/services/:serviceId
```

---

## Rental Endpoints

### Start Rental

```http
POST /api/rentals/start
```

**Request Body:**
```json
{
  "bookingId": "uuid",
  "startOdometer": 5000,
  "startFuel": 100,
  "contractUrl": "https://storage.example.com/contracts/contract-123.pdf"
}
```

**Response:** `201 Created`
```json
{
  "message": "Rental started successfully",
  "rental": {
    "id": "uuid",
    "bookingId": "uuid",
    "startDate": "2026-03-01T10:00:00Z",
    "expectedEndDate": "2026-03-05T10:00:00Z",
    "startOdometer": 5000,
    "startFuel": 100,
    "status": "ACTIVE",
    "customer": {...},
    "vehicle": {...}
  }
}
```

### End Rental

```http
POST /api/rentals/:id/end
```

**Request Body:**
```json
{
  "endOdometer": 5450,
  "endFuel": 75,
  "damageNotes": "Minor scratch on rear bumper",
  "damageCost": 150.00
}
```

**Response:** `200 OK`
```json
{
  "message": "Rental ended successfully",
  "rental": {
    "id": "uuid",
    "endDate": "2026-03-05T15:00:00Z",
    "endOdometer": 5450,
    "endFuel": 75,
    "actualDays": 5,
    "lateFee": 0,
    "extraMileageFee": 0,
    "fuelFee": 125.00,
    "damageCost": 150.00,
    "totalCost": 475.00,
    "status": "COMPLETED"
  }
}
```

### List Rentals

```http
GET /api/rentals?status=ACTIVE&customerId=uuid&vehicleId=uuid
```

### Get Active Rentals

```http
GET /api/rentals/active
```

### Get Overdue Rentals

```http
GET /api/rentals/overdue
```

### Get Rental

```http
GET /api/rentals/:id
```

---

## Financial Endpoints

### Create Expense

```http
POST /api/financial/expenses
```

**Request Body:**
```json
{
  "companyId": "uuid",
  "vehicleId": "uuid",
  "amount": 250.00,
  "category": "MAINTENANCE",
  "description": "Oil change and tire rotation",
  "date": "2026-02-10T10:00:00Z"
}
```

### List Expenses

```http
GET /api/financial/expenses?vehicleId=uuid&category=MAINTENANCE
```

### Create Invoice

```http
POST /api/financial/invoices
```

**Request Body:**
```json
{
  "companyId": "uuid",
  "rentalId": "uuid",
  "customerId": "uuid",
  "amount": 200.00,
  "taxAmount": 20.00,
  "totalAmount": 220.00,
  "dueDate": "2026-03-15T00:00:00Z"
}
```

### List Invoices

```http
GET /api/financial/invoices?customerId=uuid&status=PENDING
```

### Mark Invoice as Paid

```http
PATCH /api/financial/invoices/:id/mark-paid
```

**Request Body:**
```json
{
  "paymentMethod": "CARD"
}
```

### Get Daily Report

```http
GET /api/financial/reports/daily?date=2026-02-12T00:00:00Z
```

**Response:** `200 OK`
```json
{
  "report": {
    "date": "2026-02-12T00:00:00Z",
    "totalRevenue": 5000.00,
    "totalExpenses": 1000.00,
    "profit": 4000.00
  }
}
```

### Get Monthly Report

```http
GET /api/financial/reports/monthly?year=2026&month=2
```

**Response:** `200 OK`
```json
{
  "report": {
    "year": 2026,
    "month": 2,
    "totalRevenue": 150000.00,
    "totalExpenses": 30000.00,
    "profit": 120000.00,
    "revenueByCategory": [...],
    "expensesByCategory": [...]
  }
}
```

### Get Profit & Loss Report

```http
GET /api/financial/reports/profit-loss?startDate=2026-01-01&endDate=2026-12-31
```

### Get Revenue by Branch

```http
GET /api/financial/reports/revenue-by-branch?startDate=2026-01-01&endDate=2026-12-31
```

### Get Revenue by Vehicle

```http
GET /api/financial/reports/revenue-by-vehicle?startDate=2026-01-01&endDate=2026-12-31
```

---

## Maintenance Endpoints

### Create Maintenance Log

```http
POST /api/maintenance
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyId": "uuid",
  "vehicleId": "uuid",
  "type": "Oil Change",
  "description": "Regular oil change and filter replacement",
  "cost": 75.00,
  "date": "2026-02-12T10:00:00Z",
  "performedBy": "John's Auto Shop",
  "nextMaintenanceDate": "2026-05-12T10:00:00Z",
  "nextMaintenanceOdometer": 35000
}
```

**Response:**
```json
{
  "message": "Maintenance log created successfully",
  "maintenanceLog": {
    "id": "uuid",
    "company_id": "uuid",
    "vehicle_id": "uuid",
    "type": "Oil Change",
    "description": "Regular oil change and filter replacement",
    "cost": 75.00,
    "date": "2026-02-12T10:00:00Z",
    "performed_by": "John's Auto Shop",
    "next_maintenance_date": "2026-05-12T10:00:00Z",
    "next_maintenance_odometer": 35000,
    "created_at": "2026-02-12T10:00:00Z",
    "vehicle": {
      "brand": "Toyota",
      "model": "Camry",
      "plate_number": "ABC123"
    }
  }
}
```

### List Maintenance Logs

```http
GET /api/maintenance?vehicleId=uuid&type=Oil%20Change&startDate=2026-01-01&endDate=2026-12-31
```

**Query Parameters:**
- `vehicleId` (optional) - Filter by vehicle
- `type` (optional) - Filter by maintenance type
- `startDate` (optional) - Filter by start date
- `endDate` (optional) - Filter by end date

### Get Upcoming Maintenance

```http
GET /api/maintenance/upcoming
```

**Response:**
```json
{
  "upcoming": {
    "byDate": [
      {
        "id": "uuid",
        "type": "Oil Change",
        "next_maintenance_date": "2026-03-15T00:00:00Z",
        "vehicle": {
          "brand": "Toyota",
          "model": "Camry",
          "plate_number": "ABC123",
          "current_odometer": 30000
        }
      }
    ],
    "byOdometer": [
      {
        "id": "uuid",
        "type": "Tire Rotation",
        "next_maintenance_odometer": 30500,
        "vehicle": {
          "brand": "Honda",
          "model": "Accord",
          "plate_number": "XYZ789",
          "current_odometer": 30200
        }
      }
    ]
  }
}
```

### Get Vehicle Maintenance History

```http
GET /api/maintenance/vehicle/:vehicleId/history
```

**Response:**
```json
{
  "history": {
    "logs": [
      {
        "id": "uuid",
        "type": "Oil Change",
        "description": "Regular oil change",
        "cost": 75.00,
        "date": "2026-02-12T10:00:00Z",
        "performed_by": "John's Auto Shop"
      }
    ],
    "summary": {
      "totalCost": 450.00,
      "maintenanceCount": 6,
      "averageCost": 75.00
    }
  }
}
```

### Get Maintenance Cost by Vehicle

```http
GET /api/maintenance/cost-by-vehicle?startDate=2026-01-01&endDate=2026-12-31
```

**Response:**
```json
{
  "report": [
    {
      "vehicleId": "uuid",
      "vehicle": {
        "id": "uuid",
        "brand": "Toyota",
        "model": "Camry",
        "plate_number": "ABC123"
      },
      "totalCost": 450.00,
      "maintenanceCount": 6,
      "averageCost": 75.00
    }
  ]
}
```

### Get Maintenance Log by ID

```http
GET /api/maintenance/:id
```

### Update Maintenance Log

```http
PATCH /api/maintenance/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "Oil Change",
  "description": "Updated description",
  "cost": 80.00,
  "performedBy": "Updated Shop Name"
}
```

### Delete Maintenance Log

```http
DELETE /api/maintenance/:id
```

**Response:**
```json
{
  "message": "Maintenance log deleted successfully"
}
```

---

## Analytics Endpoints

### Get Dashboard Metrics

```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "metrics": {
    "totalFleet": 50,
    "activeRentals": 12,
    "revenueToday": 1250.00,
    "revenueMonth": 45000.00,
    "revenueYear": 540000.00,
    "fleetUtilization": 24.00,
    "overdueRentals": 2
  }
}
```

### Get Global Dashboard (Super Admin Only)

```http
GET /api/analytics/dashboard/global
Authorization: Bearer <token>
```

**Response:**
```json
{
  "dashboard": {
    "totalCompanies": 10,
    "activeCompanies": 8,
    "totalRevenue": 2500000.00,
    "totalExpenses": 1200000.00,
    "profit": 1300000.00,
    "companies": [
      {
        "id": "uuid",
        "name": "Premium Car Rentals",
        "isActive": true,
        "vehicleCount": 50,
        "userCount": 15,
        "branchCount": 3
      }
    ]
  }
}
```

### Get Average Rental Duration

```http
GET /api/analytics/average-rental-duration
```

### Get Revenue Growth Rate

```http
GET /api/analytics/revenue-growth
```

### Get Vehicle ROI

```http
GET /api/analytics/vehicle-roi/:vehicleId
```

---

## Employee Endpoints

### Create Employee

```http
POST /api/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyId": "uuid",
  "branchId": "uuid",
  "email": "employee@company.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE"
}
```

### List Employees

```http
GET /api/employees?branchId=uuid&role=EMPLOYEE
```

### Get Employee by ID

```http
GET /api/employees/:id
```

### Update Employee

```http
PATCH /api/employees/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "branchId": "uuid",
  "role": "COMPANY_MANAGER"
}
```

### Activate Employee

```http
PATCH /api/employees/:id/activate
```

### Deactivate Employee

```http
PATCH /api/employees/:id/deactivate
```

### Reset Employee Password

```http
POST /api/employees/:id/reset-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPassword": "NewSecurePass123!"
}
```

---

## Notification Endpoints

### Get User Notifications

```http
GET /api/notifications?unreadOnly=true
Authorization: Bearer <token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "MAINTENANCE_DUE",
      "title": "Maintenance Due Soon",
      "message": "Vehicle Toyota Camry (ABC123) has maintenance due on 03/15/2026",
      "is_read": false,
      "created_at": "2026-02-12T10:00:00Z"
    }
  ]
}
```

### Mark Notification as Read

```http
PATCH /api/notifications/:id/read
```

### Mark All Notifications as Read

```http
PATCH /api/notifications/read-all
```

---

## Document Endpoints

### Create Document

```http
POST /api/documents
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyId": "uuid",
  "entityType": "Vehicle",
  "entityId": "uuid",
  "type": "Insurance",
  "fileUrl": "https://storage.example.com/documents/insurance.pdf",
  "fileName": "insurance.pdf"
}
```

### List Documents

```http
GET /api/documents?entityType=Vehicle&entityId=uuid
```

### Get Document by ID

```http
GET /api/documents/:id
```

### Delete Document

```http
DELETE /api/documents/:id
```

### Generate Document ID

```http
POST /api/documents/generate-id
```

**Response:**
```json
{
  "documentId": "DOC-L8X9K2M-A7B3C4D"
}
```

---

## Error Codes

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `CONFLICT` - Operation conflict
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

- **Rate Limit**: 100 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

---

## Pagination

For list endpoints that return large datasets:

```http
GET /api/vehicles?page=1&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Webhooks

Coming soon: Webhook support for real-time notifications.

---

**Last Updated**: February 12, 2026  
**Version**: 1.0.0
