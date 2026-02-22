# Testing Guide - Car Rental Management SaaS

## Prerequisites

1. Backend server running on port 5000
2. Frontend server running on port 3000
3. MySQL database running with seeded demo data
4. Demo admin account created

## Quick Test Commands

### Start Services
```bash
start.bat
```

### Seed Demo Data (if not already done)
```bash
seed-demo-data.bat
```

---

## Test Scenarios

### 1. Authentication Tests

#### Test 1.1: Super Admin Login
1. Navigate to http://localhost:3000
2. Enter credentials:
   - Email: `admin@carrental.com`
   - Password: `Admin123!@#`
3. Click "Sign In"
4. **Expected**: Redirect to dashboard, see user name in sidebar

#### Test 1.2: Invalid Login
1. Try logging in with wrong password
2. **Expected**: Error message "Invalid credentials"

---

### 2. Role-Based Access Control Tests

#### Test 2.1: Admin Access to Employees Page
1. Login as super admin
2. Navigate to "Employees" page
3. **Expected**: 
   - See "Add Employee" button
   - See Edit and Delete icons for each employee
   - Can click and open forms

#### Test 2.2: Create Employee as Admin
1. On Employees page, click "Add Employee"
2. Fill in form:
   - First Name: Test
   - Last Name: Employee
   - Email: test.employee@test.com
   - Password: Test1234!@#
   - Role: Employee
3. Click "Add Employee"
4. **Expected**: Success toast, employee appears in list

#### Test 2.3: Create Employee with EMPLOYEE Role (Restricted)
1. Create a new employee with role "EMPLOYEE"
2. Logout and login with that employee's credentials
3. Navigate to "Employees" page
4. **Expected**: 
   - NO "Add Employee" button
   - See "View Only" text instead of Edit/Delete buttons
   - Can only view the list

#### Test 2.4: Admin Access to Drivers Page
1. Login as super admin
2. Navigate to "Drivers" page
3. **Expected**: 
   - See "Add Driver" button
   - See Edit and Delete icons for each driver
   - Eye icon (view) visible for all

#### Test 2.5: Employee Access to Drivers Page (Restricted)
1. Login as employee (not admin)
2. Navigate to "Drivers" page
3. **Expected**: 
   - NO "Add Driver" button
   - Only Eye icon (view) visible
   - NO Edit or Delete buttons

---

### 3. Vehicles CRUD Tests

#### Test 3.1: List Vehicles
1. Navigate to "Vehicles" page
2. **Expected**: See list of vehicles with details

#### Test 3.2: Create Vehicle
1. Click "Add Vehicle"
2. Fill in form:
   - VIN: TEST123456789
   - Plate Number: ABC-1234
   - Brand: Toyota
   - Model: Camry
   - Year: 2024
   - Status: Available (dropdown)
   - Daily Rate: 50
   - Fuel Type: Gasoline
   - Transmission: Automatic
3. Click "Add Vehicle"
4. **Expected**: Success toast, vehicle appears in list

#### Test 3.3: Edit Vehicle
1. Click Edit icon on a vehicle
2. Change status to "Maintenance"
3. Click "Update Vehicle"
4. **Expected**: Success toast, status updated in list

#### Test 3.4: Delete Vehicle
1. Click Delete icon on a vehicle
2. Confirm deletion
3. **Expected**: Success toast, vehicle removed from list

#### Test 3.5: Search Vehicles
1. Type in search box
2. **Expected**: List filters in real-time

#### Test 3.6: Filter by Status
1. Select "Available" from status dropdown
2. **Expected**: Only available vehicles shown

---

### 4. Customers CRUD Tests

#### Test 4.1: List Customers
1. Navigate to "Customers" page
2. **Expected**: See list of customers

#### Test 4.2: Create Customer
1. Click "Add Customer"
2. Fill in form with customer details
3. Click "Add Customer"
4. **Expected**: Success toast, customer appears in list

#### Test 4.3: Edit Customer
1. Click Edit icon on a customer
2. Update details
3. Click "Update Customer"
4. **Expected**: Success toast, details updated

#### Test 4.4: Delete Customer
1. Click Delete icon
2. Confirm deletion
3. **Expected**: Success toast, customer removed

---

### 5. Drivers CRUD Tests (Admin Only)

#### Test 5.1: Create Driver (as Admin)
1. Login as admin
2. Navigate to "Drivers" page
3. Click "Add Driver"
4. Fill in form:
   - First Name: John
   - Last Name: Driver
   - Email: john.driver@test.com
   - Phone: 555-1234
   - License Number: DL123456
   - License Expiry: Future date
   - Date of Birth: Past date
5. Click "Add Driver"
6. **Expected**: Success toast, driver appears in list

#### Test 5.2: Edit Driver (as Admin)
1. Click Edit icon on a driver
2. Update phone number
3. Click "Update Driver"
4. **Expected**: Success toast, phone updated

#### Test 5.3: Delete Driver (as Admin)
1. Click Delete icon
2. Confirm deletion
3. **Expected**: Success toast, driver removed

#### Test 5.4: View Driver (as Employee)
1. Login as employee
2. Navigate to "Drivers" page
3. Click Eye icon on a driver
4. **Expected**: Can view driver details
5. **Expected**: NO Edit or Delete buttons visible

---

### 6. Employees CRUD Tests (Admin Only)

#### Test 6.1: Create Employee (as Admin)
1. Login as admin
2. Navigate to "Employees" page
3. Click "Add Employee"
4. Fill in form:
   - First Name: Jane
   - Last Name: Manager
   - Email: jane.manager@test.com
   - Password: Manager123!@#
   - Role: Manager
5. Click "Add Employee"
6. **Expected**: Success toast, employee appears in list

#### Test 6.2: Edit Employee (as Admin)
1. Click Edit icon on an employee
2. Change role to "Company Manager"
3. Toggle "Active Employee" checkbox
4. Click "Update Employee"
5. **Expected**: Success toast, role and status updated

#### Test 6.3: Delete Employee (as Admin)
1. Click Delete icon
2. Confirm deletion
3. **Expected**: Success toast, employee removed

#### Test 6.4: View Employees (as Employee)
1. Login as employee (not admin)
2. Navigate to "Employees" page
3. **Expected**: Can see list but "View Only" text instead of action buttons

---

### 7. Bookings Tests

#### Test 7.1: Create Booking
1. Navigate to "Bookings" page
2. Click "Create Booking"
3. Select customer, vehicle, driver
4. Set pickup and return dates
5. Click "Create Booking"
6. **Expected**: Success toast, booking appears in list

#### Test 7.2: Confirm Booking
1. Click "Confirm" on a pending booking
2. **Expected**: Status changes to "Confirmed"

#### Test 7.3: Cancel Booking
1. Click "Cancel" on a booking
2. Confirm cancellation
3. **Expected**: Status changes to "Cancelled"

---

### 8. Rentals Tests

#### Test 8.1: View Rentals
1. Navigate to "Rentals" page
2. **Expected**: See list of active and completed rentals

#### Test 8.2: Filter by Status
1. Select "Active" from status dropdown
2. **Expected**: Only active rentals shown

---

### 9. Financial Tests

#### Test 9.1: View Invoices
1. Navigate to "Financial" page
2. Click "Invoices" tab
3. **Expected**: See list of invoices with amounts

#### Test 9.2: View Expenses
1. Click "Expenses" tab
2. **Expected**: See list of expenses

---

### 10. Maintenance Tests

#### Test 10.1: Log Maintenance
1. Navigate to "Maintenance" page
2. Click "Log Maintenance"
3. Select vehicle
4. Enter maintenance details
5. Click "Log Maintenance"
6. **Expected**: Success toast, maintenance record appears

---

### 11. Analytics Tests

#### Test 11.1: View Dashboard
1. Navigate to "Dashboard" (home page)
2. **Expected**: See overview metrics:
   - Total vehicles
   - Active rentals
   - Total customers
   - Revenue
   - Charts and graphs

#### Test 11.2: View Analytics Page
1. Navigate to "Analytics" page
2. **Expected**: See detailed business metrics and charts

---

### 12. Branches Tests

#### Test 12.1: View Branches
1. Navigate to "Branches" page
2. **Expected**: See demo branch "Main Branch"

---

### 13. Documents Tests

#### Test 13.1: View Documents
1. Navigate to "Documents" page
2. **Expected**: See document management interface

---

### 14. Notifications Tests

#### Test 14.1: View Notifications
1. Navigate to "Notifications" page
2. **Expected**: See notification list

#### Test 14.2: Mark as Read
1. Click on a notification
2. **Expected**: Notification marked as read

---

## API Testing with HTTP Client

You can also test the API directly using the `test-api.http` file:

1. Open `test-api.http` in VS Code
2. Install "REST Client" extension
3. Click "Send Request" on any endpoint
4. View response in the panel

### Example API Tests

#### Login
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@carrental.com",
  "password": "Admin123!@#"
}
```

#### Get Vehicles
```http
GET http://localhost:5000/api/vehicles
Authorization: Bearer YOUR_TOKEN_HERE
```

#### Create Employee (Admin Only)
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "email": "new.employee@test.com",
  "password": "Test1234!@#",
  "firstName": "New",
  "lastName": "Employee",
  "role": "EMPLOYEE",
  "companyId": "00000000-0000-0000-0000-000000000001",
  "branchId": "00000000-0000-0000-0000-000000000002"
}
```

---

## Expected Behavior Summary

### Admin Users (SUPER_ADMIN, COMPANY_MANAGER)
- ✅ Can see all CRUD buttons
- ✅ Can create, edit, delete employees
- ✅ Can create, edit, delete drivers
- ✅ Can manage all resources

### Employee Users (EMPLOYEE)
- ✅ Can view employees (read-only)
- ✅ Can view drivers (read-only)
- ✅ Can create/edit bookings and rentals
- ✅ Can view/create customers
- ❌ Cannot see CRUD buttons for employees
- ❌ Cannot see Edit/Delete buttons for drivers

### Backend Enforcement
- ✅ All endpoints check permissions via middleware
- ✅ Returns 403 Forbidden if insufficient permissions
- ✅ Returns 401 Unauthorized if not authenticated

---

## Troubleshooting

### Issue: "Failed to load employees"
- Check backend is running on port 5000
- Check database connection
- Check browser console for errors

### Issue: "Login failed"
- Verify credentials are correct
- Check backend logs for errors
- Ensure database is seeded

### Issue: "Cannot see CRUD buttons"
- Verify user role (should be SUPER_ADMIN or COMPANY_MANAGER)
- Check browser console for errors
- Refresh the page

### Issue: "403 Forbidden" error
- User doesn't have required permissions
- Expected behavior for EMPLOYEE role on admin operations

---

## Test Results Checklist

Use this checklist to track your testing:

- [ ] Super admin can login
- [ ] Employee can login
- [ ] Admin can create employee
- [ ] Admin can edit employee
- [ ] Admin can delete employee
- [ ] Employee cannot create employee
- [ ] Employee cannot edit employee
- [ ] Employee cannot delete employee
- [ ] Admin can create driver
- [ ] Admin can edit driver
- [ ] Admin can delete driver
- [ ] Employee cannot create driver
- [ ] Employee cannot edit driver
- [ ] Employee cannot delete driver
- [ ] All users can view vehicles
- [ ] All users can create bookings
- [ ] Dashboard shows correct metrics
- [ ] Search and filters work
- [ ] Forms validate input
- [ ] Toast notifications appear
- [ ] Backend returns correct error codes

---

## Performance Tests

### Load Test
1. Create 10+ vehicles
2. Create 10+ customers
3. Create 10+ bookings
4. Navigate between pages
5. **Expected**: Pages load quickly, no lag

### Search Test
1. Add many records
2. Use search functionality
3. **Expected**: Real-time filtering, no delay

---

## Security Tests

### Test: Unauthorized Access
1. Logout
2. Try to access http://localhost:3000/dashboard directly
3. **Expected**: Redirect to login page

### Test: Token Expiration
1. Login
2. Wait for token to expire (or manually delete token)
3. Try to make API request
4. **Expected**: 401 Unauthorized, redirect to login

### Test: Cross-Company Access
1. Try to access resources from different company
2. **Expected**: 403 Forbidden

---

## Conclusion

This testing guide covers all major functionality of the Car Rental Management SaaS application. Follow the test scenarios to verify that all features are working correctly, especially the role-based access control for employees and drivers.

**Remember**: 
- Admin users (SUPER_ADMIN, COMPANY_MANAGER) have full access
- Employee users have restricted access (view-only for employees and drivers)
- Backend enforces all permissions regardless of frontend UI
