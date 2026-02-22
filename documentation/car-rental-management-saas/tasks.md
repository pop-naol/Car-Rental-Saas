# Implementation Plan: Enterprise Car Rental Management SaaS

## Overview

This implementation plan breaks down the Enterprise Car Rental Management SaaS platform into discrete, manageable tasks. The approach follows an incremental development strategy, starting with foundational infrastructure (database, authentication, multi-tenancy), then building core business features (vehicles, bookings, rentals), and finally adding advanced features (analytics, notifications, financial reporting). Each task builds on previous work, with checkpoints to ensure stability before proceeding.

The implementation uses TypeScript with Node.js/Express backend, React/Next.js frontend, PostgreSQL with Prisma ORM, and includes both unit tests and property-based tests for comprehensive validation.

## Tasks

- [ ] 1. Project Setup and Infrastructure
  - Initialize monorepo structure with backend and frontend workspaces
  - Configure TypeScript, ESLint, Prettier
  - Set up Docker Compose for local PostgreSQL and Redis
  - Configure environment variables for development, staging, production
  - Set up Prisma ORM with PostgreSQL connection
  - Initialize testing frameworks (Jest/Vitest, fast-check)
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 2. Database Schema and Multi-Tenancy Foundation
  - [ ] 2.1 Create Prisma schema with all entities
    - Define Company, Branch, User, Vehicle, Customer, Driver models
    - Define Booking, Rental, Revenue, Expense, Invoice models
    - Define MaintenanceLog, Document, Notification, AuditLog models
    - Add company_id to all tenant-scoped tables
    - Configure indexes for performance
    - _Requirements: 1.1, 1.2_

  - [ ] 2.2 Write property test for multi-tenant data isolation
    - **Property 1: Multi-Tenant Data Isolation**
    - **Validates: Requirements 1.2**

  - [ ] 2.3 Implement Prisma middleware for automatic company_id injection
    - Create middleware to inject company_id on create operations
    - Create middleware to filter by company_id on read operations
    - Handle models that don't require tenant filtering (Company, AuditLog for Super_Admin)
    - _Requirements: 1.2_

  - [ ] 2.4 Write property test for Prisma middleware
    - **Property 1: Multi-Tenant Data Isolation** (middleware level)
    - **Validates: Requirements 1.2**

- [ ] 3. Authentication and Authorization System
  - [ ] 3.1 Implement User model and password hashing
    - Create user registration function with bcrypt hashing
    - Implement password validation
    - _Requirements: 12.4_

  - [ ] 3.2 Write property test for password encryption
    - **Property 50: Password Encryption**
    - **Validates: Requirements 12.4**

  - [ ] 3.3 Implement JWT token generation and validation
    - Create token generation with user payload (userId, companyId, role)
    - Implement token verification middleware
    - Configure token expiration (15 minutes access, 7 days refresh)
    - _Requirements: 12.5, 12.8_

  - [ ] 3.4 Write property test for session timeout
    - **Property 52: Session Timeout Enforcement**
    - **Validates: Requirements 12.8**

  - [ ] 3.5 Implement RBAC middleware
    - Define permission matrix for all roles
    - Create middleware to check user permissions
    - Implement role-based route protection
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 3.6 Write property tests for RBAC
    - **Property 4: Global Analytics Access Control**
    - **Property 45: Employee Financial Report Access Denial**
    - **Property 46: Employee Delete Operation Denial**
    - **Property 53: Permission-Based Access Control**
    - **Validates: Requirements 1.5, 10.6, 10.7, 13.4**

  - [ ] 3.7 Implement login and authentication endpoints
    - POST /auth/register
    - POST /auth/login
    - POST /auth/refresh
    - POST /auth/logout
    - _Requirements: 12.1, 12.2_

  - [ ] 3.8 Write property tests for authentication
    - **Property 48: Login Attempt Tracking**
    - **Validates: Requirements 12.2**

- [ ] 4. Checkpoint - Authentication and Multi-Tenancy
  - Ensure all tests pass
  - Verify multi-tenant isolation works correctly
  - Verify RBAC prevents unauthorized access
  - Ask the user if questions arise


- [ ] 5. Audit Logging System
  - [ ] 5.1 Implement audit logging service
    - Create function to log user actions with context
    - Capture user_id, company_id, action, entity_type, entity_id
    - Capture old_values and new_values for updates
    - Store IP address and user agent
    - _Requirements: 12.1, 12.2_

  - [ ] 5.2 Write property tests for audit logging
    - **Property 5: Super Admin Action Auditing**
    - **Property 44: Employee Action Auditing**
    - **Property 47: User Action Audit Logging**
    - **Validates: Requirements 1.6, 10.5, 12.1**

  - [ ] 5.3 Integrate audit logging into all CRUD operations
    - Add audit logging middleware to Express routes
    - Log create, update, delete operations
    - Log authentication events
    - _Requirements: 12.1_

  - [ ] 5.4 Write property test for unauthorized access logging
    - **Property 51: Unauthorized Access Denial and Logging**
    - **Validates: Requirements 12.7**

- [ ] 6. Company and Branch Management
  - [ ] 6.1 Implement Company CRUD operations (Super Admin only)
    - POST /companies (create company)
    - GET /companies (list all companies)
    - PATCH /companies/:id (update company)
    - PATCH /companies/:id/suspend (suspend company)
    - PATCH /companies/:id/activate (activate company)
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ] 6.2 Write property tests for company management
    - **Property 2: Suspended Company Access Denial**
    - **Property 3: Company Activation Restores Access**
    - **Validates: Requirements 1.3, 1.4**

  - [ ] 6.3 Implement Branch CRUD operations
    - POST /branches (create branch)
    - GET /branches (list branches)
    - GET /branches/:id (get branch details)
    - PATCH /branches/:id (update branch)
    - DELETE /branches/:id (delete branch with validation)
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ] 6.4 Write property tests for branch management
    - **Property 10: Branch Creation and Association**
    - **Property 11: Branch Update Persistence**
    - **Property 13: Branch Deletion Protection**
    - **Validates: Requirements 3.1, 3.2, 3.5**

- [ ] 7. Vehicle Management
  - [ ] 7.1 Implement Vehicle CRUD operations
    - POST /vehicles (create vehicle with validation)
    - GET /vehicles (list vehicles with filters)
    - GET /vehicles/:id (get vehicle details)
    - PATCH /vehicles/:id (update vehicle)
    - DELETE /vehicles/:id (soft delete)
    - _Requirements: 4.1, 4.2, 4.3, 12.3_

  - [ ] 7.2 Write property tests for vehicle validation
    - **Property 14: Vehicle Required Fields Validation**
    - **Property 15: VIN Global Uniqueness**
    - **Property 16: Plate Number Company Uniqueness**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ] 7.3 Implement vehicle status management
    - PATCH /vehicles/:id/status (update status with validation)
    - Prevent status changes that violate business rules
    - _Requirements: 4.7, 4.8_

  - [ ] 7.4 Write property test for maintenance status booking prevention
    - **Property 20: Maintenance Status Booking Prevention**
    - **Validates: Requirements 4.8**

  - [ ] 7.5 Implement vehicle branch transfer
    - POST /vehicles/:id/transfer (transfer to different branch)
    - Record transfer history
    - _Requirements: 3.3_

  - [ ] 7.6 Write property test for vehicle transfer
    - **Property 12: Vehicle Transfer Updates Assignment**
    - **Validates: Requirements 3.3**

  - [ ] 7.7 Implement vehicle document upload
    - POST /vehicles/:id/documents (upload to cloud storage)
    - GET /vehicles/:id/documents (list documents)
    - Generate signed URLs for secure access
    - _Requirements: 4.4, 15.1, 15.5, 15.6, 15.9, 15.10_

  - [ ] 7.8 Write property tests for document management
    - **Property 17: Document Upload Persistence**
    - **Property 56: Document Unique Identifier Generation**
    - **Property 57: File Type Validation**
    - **Property 58: File Size Validation**
    - **Validates: Requirements 4.4, 15.6, 15.9, 15.10**

- [ ] 8. Customer and Driver Management
  - [ ] 8.1 Implement Customer CRUD operations
    - POST /customers (create customer with validation)
    - GET /customers (list customers)
    - GET /customers/:id (get customer details with rental history)
    - PATCH /customers/:id (update customer)
    - PATCH /customers/:id/blacklist (toggle blacklist status)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [ ] 8.2 Write property tests for customer management
    - **Property 39: Blacklisted Customer Booking Prevention**
    - **Property 40: Expired License Booking Prevention**
    - **Validates: Requirements 8.7, 8.10**

  - [ ] 8.3 Implement Driver CRUD operations
    - POST /drivers (create driver with license validation)
    - GET /drivers (list drivers)
    - GET /drivers/:id (get driver details with performance metrics)
    - PATCH /drivers/:id (update driver)
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 8.4 Write property tests for driver management
    - **Property 41: Expired Driver License Assignment Prevention**
    - **Property 42: Driver Completed Trips Count**
    - **Validates: Requirements 9.4, 9.6**

- [ ] 9. Checkpoint - Core Entities
  - Ensure all tests pass
  - Verify CRUD operations work correctly
  - Verify validation rules are enforced
  - Ask the user if questions arise

- [ ] 10. Booking Management and Conflict Detection
  - [ ] 10.1 Implement booking availability checker
    - Create function to check vehicle availability for date range
    - Implement interval overlap detection algorithm
    - _Requirements: 5.1, 5.2_

  - [ ]* 10.2 Write property test for booking conflict detection
    - **Property 22: Booking Conflict Detection**
    - **Validates: Requirements 5.2, 5.6**

  - [ ] 10.3 Implement booking cost calculation
    - Calculate base rate based on duration (daily/weekly/monthly)
    - Add optional services
    - Apply discount codes
    - _Requirements: 5.11_

  - [ ]* 10.4 Write property test for booking cost calculation
    - **Property 25: Booking Cost Calculation**
    - **Validates: Requirements 5.11**

  - [ ] 10.5 Implement Booking CRUD operations
    - POST /bookings (create with conflict check and cost calculation)
    - GET /bookings (list bookings with filters)
    - GET /bookings/:id (get booking details)
    - PATCH /bookings/:id (update with re-validation)
    - PATCH /bookings/:id/cancel (cancel booking)
    - PATCH /bookings/:id/confirm (confirm booking)
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_

  - [ ]* 10.6 Write property tests for booking management
    - **Property 23: New Booking Initial Status**
    - **Property 24: Cancelled Booking Releases Vehicle**
    - **Validates: Requirements 5.3, 5.7**

  - [ ] 10.7 Implement overdue booking detection
    - Create scheduled job to check for overdue bookings
    - Update status to OVERDUE when past end date
    - _Requirements: 5.12_

  - [ ]* 10.8 Write property test for overdue status
    - **Property 26: Overdue Booking Status Update**
    - **Validates: Requirements 5.12**

- [ ] 11. Rental Management
  - [ ] 11.1 Implement rental start functionality
    - POST /rentals/start (create rental from booking)
    - Capture starting odometer and fuel level
    - Upload signed contract
    - Update vehicle status to RENTED
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 11.2 Write property test for rental start
    - **Property 27: Rental Start Updates Vehicle Status**
    - **Validates: Requirements 6.4**

  - [ ] 11.3 Implement rental end functionality
    - POST /rentals/:id/end (complete rental)
    - Capture return odometer and fuel level
    - Calculate duration, late fees, mileage fees
    - Allow entry of damage costs
    - Update vehicle status to AVAILABLE
    - _Requirements: 6.5, 6.6, 6.7, 6.8, 6.9, 6.11_

  - [ ]* 11.4 Write property tests for rental calculations
    - **Property 28: Rental Duration Calculation**
    - **Property 29: Late Fee Calculation**
    - **Property 30: Mileage Fee Calculation**
    - **Validates: Requirements 6.6, 6.7, 6.8**

  - [ ]* 11.5 Write property test for rental end
    - **Property 32: Rental End Updates Vehicle Status**
    - **Validates: Requirements 6.11**

  - [ ] 11.6 Implement Rental query endpoints
    - GET /rentals (list rentals with filters)
    - GET /rentals/:id (get rental details)
    - _Requirements: 6.10_

- [ ] 12. Financial Management
  - [ ] 12.1 Implement invoice generation
    - Create invoice automatically when rental completes
    - Calculate subtotal, tax, and total
    - Generate unique invoice number
    - _Requirements: 6.10, 7.17, 7.18_

  - [ ]* 12.2 Write property tests for invoice
    - **Property 31: Invoice Total Calculation**
    - **Property 36: Completed Rental Invoice Generation**
    - **Property 37: Invoice Tax Calculation**
    - **Validates: Requirements 6.10, 7.17, 7.18**

  - [ ] 12.3 Implement Revenue and Expense tracking
    - POST /revenue (record revenue)
    - POST /expenses (record expense)
    - GET /revenue (query revenue with filters)
    - GET /expenses (query expenses with filters)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

  - [ ] 12.4 Implement financial calculations
    - Calculate profit/loss for date range
    - Calculate revenue per vehicle
    - Calculate revenue per branch
    - Calculate revenue per driver
    - Calculate vehicle profit
    - _Requirements: 2.6, 4.13, 7.13, 7.14, 7.15, 7.16_

  - [ ]* 12.5 Write property tests for financial calculations
    - **Property 8: Profit and Loss Calculation**
    - **Property 21: Vehicle Profit Calculation**
    - **Property 33: Revenue Per Vehicle Calculation**
    - **Property 34: Revenue Per Branch Calculation**
    - **Property 35: Revenue Per Driver Calculation**
    - **Validates: Requirements 2.6, 4.13, 7.13, 7.14, 7.15, 7.16**

  - [ ] 12.6 Implement payment tracking
    - PATCH /invoices/:id/payment (record payment)
    - Support multiple payment methods
    - _Requirements: 7.19, 7.20_

  - [ ]* 12.7 Write property test for customer spending
    - **Property 38: Customer Total Spending Calculation**
    - **Validates: Requirements 8.5**

- [ ] 13. Checkpoint - Core Business Logic
  - Ensure all tests pass
  - Verify booking conflicts are detected
  - Verify financial calculations are accurate
  - Ask the user if questions arise

- [ ] 14. Analytics and Dashboard
  - [ ] 14.1 Implement dashboard metrics calculation
    - Calculate total fleet count
    - Calculate active rentals count
    - Calculate revenue (today, month, year)
    - Calculate fleet utilization percentage
    - Calculate overdue rentals count
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 14.2 Write property tests for dashboard metrics
    - **Property 6: Dashboard Completeness**
    - **Property 7: Fleet Utilization Calculation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [ ] 14.3 Implement driver performance calculation
    - Calculate performance score using formula
    - Rank drivers by performance
    - _Requirements: 2.8, 9.8_

  - [ ]* 14.4 Write property test for driver performance
    - **Property 9: Driver Performance Score Formula**
    - **Validates: Requirements 2.8, 9.8**

  - [ ] 14.5 Implement additional analytics
    - Calculate average rental duration
    - Calculate revenue growth rate
    - Calculate vehicle ROI
    - _Requirements: 16.3, 16.4, 16.5_

  - [ ]* 14.6 Write property tests for analytics
    - **Property 59: Average Rental Duration Calculation**
    - **Property 60: Revenue Growth Rate Calculation**
    - **Property 61: Vehicle ROI Calculation**
    - **Validates: Requirements 16.3, 16.4, 16.5**

  - [ ] 14.7 Implement dashboard API endpoint
    - GET /dashboard (return all metrics for Company_Manager)
    - GET /dashboard/global (return global metrics for Super_Admin)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 15. Employee Management
  - [ ] 15.1 Implement Employee CRUD operations
    - POST /employees (create employee with role and branch)
    - GET /employees (list employees)
    - PATCH /employees/:id (update employee)
    - PATCH /employees/:id/activate (activate employee)
    - PATCH /employees/:id/deactivate (deactivate employee)
    - POST /employees/:id/reset-password (reset password)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 15.2 Write property test for password reset
    - **Property 43: Password Reset Invalidates Old Password**
    - **Validates: Requirements 10.4**

- [ ] 16. Notification System
  - [ ] 16.1 Implement notification service
    - Create notification creation function
    - Support in-app notifications
    - Support email notifications
    - Support SMS notifications (optional)
    - _Requirements: 11.6, 11.7, 11.8_

  - [ ] 16.2 Implement notification triggers
    - Create scheduled jobs for maintenance due
    - Create scheduled jobs for insurance expiry
    - Create scheduled jobs for license expiry
    - Create scheduled jobs for payment overdue
    - Trigger notification on rental overdue
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 16.3 Implement notification API endpoints
    - GET /notifications (list user notifications)
    - PATCH /notifications/:id/read (mark as read)
    - _Requirements: 11.6_

- [ ] 17. Input Validation and Error Handling
  - [ ] 17.1 Implement comprehensive input validation
    - Validate VIN format and uniqueness
    - Validate plate number format and uniqueness
    - Validate email format
    - Validate phone number format
    - Validate date ranges
    - Validate non-negative numeric fields
    - Validate required fields
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 17.2 Write property test for input validation
    - **Property 55: Input Validation Completeness**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8**

  - [ ] 17.3 Implement error handling middleware
    - Create global error handler
    - Format error responses consistently
    - Log errors appropriately
    - Handle validation errors, auth errors, conflict errors
    - _Requirements: 14.8_

- [ ] 18. Soft Delete Implementation
  - [ ] 18.1 Implement soft delete for all entities
    - Add deleted_at column to all models
    - Update delete operations to set deleted_at
    - Filter out soft-deleted records in queries
    - _Requirements: 12.3_

  - [ ]* 18.2 Write property test for soft delete
    - **Property 49: Soft Delete Behavior**
    - **Validates: Requirements 12.3**

- [ ] 19. Security Enhancements
  - [ ] 19.1 Implement rate limiting
    - Add rate limiting middleware to API routes
    - Configure limits per endpoint
    - _Requirements: 17.9_

  - [ ]* 19.2 Write property test for rate limiting
    - **Property 62: Rate Limiting Enforcement**
    - **Validates: Requirements 17.9**

  - [ ] 19.2 Implement privilege escalation prevention
    - Validate role changes are authorized
    - Prevent users from elevating their own privileges
    - _Requirements: 13.7_

  - [ ]* 19.3 Write property test for privilege escalation
    - **Property 54: Privilege Escalation Prevention**
    - **Validates: Requirements 13.7**

- [ ] 20. Checkpoint - Backend Complete
  - Ensure all tests pass
  - Verify all API endpoints work correctly
  - Verify security measures are in place
  - Ask the user if questions arise

- [ ] 21. Frontend - Authentication and Layout
  - [ ] 21.1 Set up React/Next.js project
    - Initialize Next.js with TypeScript
    - Configure TailwindCSS
    - Set up React Query for data fetching
    - Configure routing
    - _Requirements: 17.1_

  - [ ] 21.2 Implement authentication pages
    - Login page with form validation
    - Registration page (if applicable)
    - Password reset flow
    - _Requirements: 12.5_

  - [ ] 21.3 Implement layout and navigation
    - Create main layout with sidebar
    - Implement role-based navigation menu
    - Add user profile dropdown
    - _Requirements: 13.1_

  - [ ] 21.4 Implement protected routes
    - Create route guards based on authentication
    - Implement role-based route protection
    - Redirect unauthorized users
    - _Requirements: 13.3, 13.4_

- [ ] 22. Frontend - Dashboard
  - [ ] 22.1 Implement dashboard page
    - Display total fleet count
    - Display active rentals count
    - Display revenue metrics with charts
    - Display fleet utilization gauge
    - Display overdue rentals count
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 22.2 Implement analytics visualizations
    - Create revenue charts (line/bar charts)
    - Create branch comparison charts
    - Create driver performance ranking table
    - _Requirements: 2.6, 2.7, 2.8_

- [ ] 23. Frontend - Vehicle Management
  - [ ] 23.1 Implement vehicle list page
    - Display vehicles in table/grid
    - Add filters (status, branch, search)
    - Add pagination
    - _Requirements: 4.1_

  - [ ] 23.2 Implement vehicle form
    - Create/edit vehicle form with validation
    - Upload vehicle documents
    - Set pricing (daily, weekly, monthly)
    - Assign to branch
    - _Requirements: 4.1, 4.4, 4.5, 4.6_

  - [ ] 23.3 Implement vehicle details page
    - Display vehicle information
    - Show maintenance history
    - Show rental history
    - Show profit metrics
    - Manage vehicle status
    - _Requirements: 4.11, 4.13_

- [ ] 24. Frontend - Booking Management
  - [ ] 24.1 Implement booking calendar view
    - Display bookings in calendar format
    - Show vehicle availability
    - Allow date range selection
    - _Requirements: 5.1_

  - [ ] 24.2 Implement booking form
    - Select vehicle with availability check
    - Select customer and driver
    - Add optional services
    - Apply discount codes
    - Display estimated cost
    - _Requirements: 5.1, 5.8, 5.9, 5.10, 5.11_

  - [ ] 24.3 Implement booking list and details
    - List bookings with filters
    - Show booking details
    - Allow status changes (confirm, cancel)
    - _Requirements: 5.3, 5.7_

- [ ] 25. Frontend - Rental Management
  - [ ] 25.1 Implement rental start page
    - Form to start rental from booking
    - Capture odometer and fuel level
    - Upload signed contract
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 25.2 Implement rental end page
    - Form to complete rental
    - Capture return details
    - Display calculated charges
    - Generate invoice
    - _Requirements: 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [ ] 25.3 Implement rental list and details
    - List active and completed rentals
    - Show rental details with timeline
    - Display invoice
    - _Requirements: 6.10_

- [ ] 26. Frontend - Customer and Driver Management
  - [ ] 26.1 Implement customer management pages
    - Customer list with search
    - Customer form (create/edit)
    - Customer details with rental history
    - Document upload
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ] 26.2 Implement driver management pages
    - Driver list with performance metrics
    - Driver form (create/edit)
    - Driver details with trip history
    - License upload
    - _Requirements: 9.1, 9.2, 9.6_

- [ ] 27. Frontend - Financial Management
  - [ ] 27.1 Implement financial reports page
    - Display revenue and expense charts
    - Show profit/loss report
    - Filter by date range, branch, vehicle
    - Export functionality
    - _Requirements: 7.11, 7.12, 7.13_

  - [ ] 27.2 Implement invoice management
    - List invoices with payment status
    - Invoice details page
    - Record payment
    - Print/download invoice
    - _Requirements: 7.17, 7.18, 7.19_

- [ ] 28. Frontend - Admin Features
  - [ ] 28.1 Implement company management (Super Admin)
    - List companies
    - Create/edit company
    - Suspend/activate company
    - View global analytics
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ] 28.2 Implement branch management
    - List branches
    - Create/edit branch
    - View branch performance
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 28.3 Implement employee management
    - List employees
    - Create/edit employee
    - Assign roles and branches
    - Reset passwords
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ] 28.4 Implement audit log viewer
    - Display audit logs with filters
    - Search by user, action, date
    - Export audit logs
    - _Requirements: 12.1, 12.9_

- [ ] 29. Frontend - Notifications
  - [ ] 29.1 Implement notification center
    - Display in-app notifications
    - Mark notifications as read
    - Notification badge in header
    - _Requirements: 11.6_

- [ ] 30. Checkpoint - Frontend Complete
  - Ensure all pages render correctly
  - Verify forms validate properly
  - Verify role-based access works
  - Test user workflows end-to-end
  - Ask the user if questions arise

- [ ] 31. Integration and End-to-End Testing
  - [ ]* 31.1 Write integration tests for critical workflows
    - Test complete booking-to-rental-to-invoice flow
    - Test multi-tenant isolation in real scenarios
    - Test authentication and authorization flows
    - _Requirements: 1.2, 5.2, 6.10_

  - [ ]* 31.2 Write end-to-end tests for user journeys
    - Test Company Manager creating booking and completing rental
    - Test Employee managing bookings
    - Test Super Admin managing companies
    - _Requirements: 13.4_

- [ ] 32. Performance Optimization
  - [ ] 32.1 Implement database query optimization
    - Add missing indexes
    - Optimize N+1 queries
    - Implement pagination for large lists
    - _Requirements: 17.8_

  - [ ] 32.2 Implement caching
    - Cache dashboard metrics in Redis
    - Cache frequently accessed data
    - Implement cache invalidation
    - _Requirements: 17.8_

- [ ] 33. Deployment Preparation
  - [ ] 33.1 Create Docker configuration
    - Dockerfile for backend
    - Dockerfile for frontend
    - Docker Compose for full stack
    - _Requirements: 17.2_

  - [ ] 33.2 Set up CI/CD pipeline
    - Configure automated testing
    - Configure automated deployments
    - Set up environment-specific configurations
    - _Requirements: 17.1_

  - [ ] 33.3 Implement health checks and monitoring
    - Create health check endpoints
    - Set up error logging
    - Configure monitoring alerts
    - _Requirements: 17.6, 17.7_

- [ ] 34. Final Checkpoint - Production Ready
  - Run full test suite (unit + property + integration)
  - Verify all requirements are met
  - Perform security audit
  - Load test critical endpoints
  - Ask the user if ready for deployment

## Notes

- All tasks including tests are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and stability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Frontend tasks can be parallelized with backend tasks after API contracts are defined
- The implementation follows a bottom-up approach: infrastructure → core entities → business logic → analytics → frontend
