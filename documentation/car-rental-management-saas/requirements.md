# Requirements Document

## Introduction

This document specifies the requirements for an Enterprise Car Rental Management SaaS platform. The system is a production-ready, web-based, multi-tenant platform designed for commercial car rental companies to manage operations, finances, performance analytics, and multi-branch coordination.

## Glossary

- **System**: The Enterprise Car Rental Management SaaS platform
- **Super_Admin**: Platform owner with global system control
- **Company_Manager**: Rental company owner with full company-level control
- **Employee**: Staff member with limited operational permissions
- **Customer**: Individual renting vehicles
- **Driver**: Professional driver assigned to rentals
- **Vehicle**: Car or vehicle available for rental
- **Booking**: Reservation for future rental
- **Rental**: Active or completed vehicle rental contract
- **Branch**: Physical location of a rental company
- **Company**: Tenant organization using the platform
- **VIN**: Vehicle Identification Number (unique identifier)
- **Fleet_Utilization**: Percentage of vehicles actively rented
- **Audit_Log**: Record of all system actions for security and compliance

## Requirements

### Requirement 1: Multi-Tenant Platform Management

**User Story:** As a Super Admin, I want to manage multiple rental companies on the platform, so that I can control subscriptions, access, and system-wide operations.

#### Acceptance Criteria

1. THE System SHALL support multiple independent rental companies (multi-tenancy)
2. WHEN a Super_Admin creates a company, THE System SHALL generate isolated data storage for that company
3. WHEN a Super_Admin suspends a company, THE System SHALL prevent all users of that company from accessing the system
4. WHEN a Super_Admin activates a company, THE System SHALL restore access for that company's users
5. THE System SHALL maintain global analytics accessible only to Super_Admin
6. THE System SHALL log all Super_Admin actions in audit logs
7. THE System SHALL support feature flags controllable by Super_Admin
8. THE System SHALL provide system health monitoring dashboard for Super_Admin

### Requirement 2: Company Dashboard and Analytics

**User Story:** As a Company Manager, I want to view comprehensive business analytics, so that I can make informed decisions about my rental operations.

#### Acceptance Criteria

1. WHEN a Company_Manager accesses the dashboard, THE System SHALL display total fleet count
2. WHEN a Company_Manager accesses the dashboard, THE System SHALL display active rentals count
3. WHEN a Company_Manager accesses the dashboard, THE System SHALL display revenue for today, current month, and current year
4. WHEN a Company_Manager accesses the dashboard, THE System SHALL calculate and display fleet utilization percentage
5. WHEN a Company_Manager accesses the dashboard, THE System SHALL display count of overdue rentals
6. THE System SHALL generate profit and loss reports for Company_Manager
7. THE System SHALL provide branch comparison analytics
8. THE System SHALL rank driver performance with calculated scores

### Requirement 3: Branch Management

**User Story:** As a Company Manager, I want to manage multiple branches, so that I can organize operations across different locations.

#### Acceptance Criteria

1. WHEN a Company_Manager creates a branch, THE System SHALL store branch details and associate it with the company
2. WHEN a Company_Manager edits a branch, THE System SHALL update branch information
3. WHEN a Company_Manager transfers a vehicle between branches, THE System SHALL update vehicle assignment and maintain transfer history
4. THE System SHALL calculate and display performance metrics for each branch
5. THE System SHALL prevent deletion of branches with active rentals

### Requirement 4: Vehicle Management

**User Story:** As a Company Manager, I want to manage my vehicle fleet, so that I can track availability, maintenance, and profitability.

#### Acceptance Criteria

1. WHEN a Company_Manager adds a vehicle, THE System SHALL require VIN, plate number, brand, model, year, fuel type, and transmission
2. THE System SHALL enforce VIN uniqueness across the entire system
3. THE System SHALL enforce plate number uniqueness within each company
4. WHEN a Company_Manager uploads vehicle documents, THE System SHALL store them securely in cloud storage
5. WHEN a Company_Manager assigns a vehicle to a branch, THE System SHALL update vehicle location
6. WHEN a Company_Manager sets rental pricing, THE System SHALL store daily, weekly, and monthly rates
7. THE System SHALL support vehicle status values: Available, Reserved, Rented, Maintenance, Out_of_Service
8. IF a vehicle status is Maintenance, THEN THE System SHALL prevent booking that vehicle
9. THE System SHALL track odometer readings for each vehicle
10. THE System SHALL track fuel levels for each vehicle
11. THE System SHALL maintain maintenance history for each vehicle
12. THE System SHALL record accident reports linked to vehicles
13. THE System SHALL calculate profit per vehicle based on revenue minus expenses

### Requirement 5: Booking Management

**User Story:** As a Company Manager or Employee, I want to manage bookings, so that I can reserve vehicles for customers and prevent scheduling conflicts.

#### Acceptance Criteria

1. WHEN creating a booking, THE System SHALL check vehicle availability for the requested date range
2. IF a vehicle is already reserved for overlapping dates, THEN THE System SHALL prevent the booking and return an error
3. WHEN a booking is created, THE System SHALL assign status "Pending"
4. THE System SHALL support booking status transitions: Pending → Confirmed → Active → Completed
5. THE System SHALL support booking status transitions: Pending → Cancelled or Confirmed → Cancelled
6. WHEN a booking is modified, THE System SHALL re-validate vehicle availability
7. WHEN a booking is cancelled, THE System SHALL release the vehicle for other bookings
8. WHEN creating a booking, THE System SHALL allow assignment of a driver
9. WHEN creating a booking, THE System SHALL allow addition of optional services
10. WHEN creating a booking, THE System SHALL allow application of discount codes
11. THE System SHALL calculate estimated cost based on duration, pricing, services, and discounts
12. WHEN a booking becomes overdue, THE System SHALL update status to "Overdue"

### Requirement 6: Rental and Contract Management

**User Story:** As a Company Manager or Employee, I want to manage active rentals and contracts, so that I can track vehicle usage and calculate final charges.

#### Acceptance Criteria

1. WHEN starting a rental, THE System SHALL capture starting odometer reading
2. WHEN starting a rental, THE System SHALL capture starting fuel level
3. WHEN starting a rental, THE System SHALL allow upload of signed contract PDF
4. WHEN starting a rental, THE System SHALL update vehicle status to "Rented"
5. WHEN ending a rental, THE System SHALL capture return odometer reading
6. WHEN ending a rental, THE System SHALL calculate rental duration
7. WHEN ending a rental, THE System SHALL calculate late fees if return is past due date
8. WHEN ending a rental, THE System SHALL calculate extra mileage fees based on odometer difference
9. WHEN ending a rental, THE System SHALL allow entry of damage costs
10. WHEN ending a rental, THE System SHALL generate final invoice with all charges
11. WHEN ending a rental, THE System SHALL update vehicle status to "Available"

### Requirement 7: Financial Management

**User Story:** As a Company Manager, I want to track all revenue and expenses, so that I can understand profitability and financial health.

#### Acceptance Criteria

1. THE System SHALL record revenue from rental charges
2. THE System SHALL record revenue from driver charges
3. THE System SHALL record revenue from late penalties
4. THE System SHALL record revenue from damage penalties
5. THE System SHALL record revenue from add-on services
6. THE System SHALL record expenses for maintenance costs
7. THE System SHALL record expenses for fuel costs
8. THE System SHALL record expenses for insurance payments
9. THE System SHALL record expenses for staff salaries
10. THE System SHALL record expenses for vehicle purchases
11. THE System SHALL generate daily revenue reports
12. THE System SHALL generate monthly revenue reports
13. THE System SHALL generate profit and loss reports (revenue minus expenses)
14. THE System SHALL calculate revenue per vehicle
15. THE System SHALL calculate revenue per branch
16. THE System SHALL calculate revenue per driver
17. WHEN a rental is completed, THE System SHALL auto-generate an invoice
18. THE System SHALL calculate tax on invoices
19. THE System SHALL track payment status for invoices
20. THE System SHALL support payment methods: Cash, Bank, Mobile, Online

### Requirement 8: Customer Management

**User Story:** As a Company Manager or Employee, I want to manage customer information, so that I can track rental history and assess risk.

#### Acceptance Criteria

1. WHEN registering a customer, THE System SHALL store customer details
2. WHEN registering a customer, THE System SHALL allow upload of ID documents
3. WHEN registering a customer, THE System SHALL store driver license information
4. THE System SHALL display rental history for each customer
5. THE System SHALL track total spending per customer
6. THE System SHALL support blacklist flag for customers
7. IF a customer is blacklisted, THEN THE System SHALL prevent new rentals for that customer
8. THE System SHALL assign loyalty levels to customers
9. THE System SHALL calculate risk scores for customers
10. IF a customer's license is expired, THEN THE System SHALL prevent new rentals for that customer

### Requirement 9: Driver Management

**User Story:** As a Company Manager, I want to manage professional drivers, so that I can assign them to rentals and track their performance.

#### Acceptance Criteria

1. WHEN adding a driver, THE System SHALL store driver details
2. WHEN adding a driver, THE System SHALL allow upload of driver license
3. THE System SHALL track driver license expiry dates
4. WHEN assigning a driver to a rental, THE System SHALL validate license is not expired
5. WHEN a rental is completed, THE System SHALL allow rating of the driver
6. THE System SHALL track total completed trips per driver
7. THE System SHALL track incidents per driver
8. THE System SHALL calculate driver performance score using formula: (Trips × 0.4) + (Rating × 0.3) + (OnTime% × 0.3)
9. WHEN a driver license is expiring soon, THE System SHALL send notification

### Requirement 10: Employee Management

**User Story:** As a Company Manager, I want to manage employees, so that I can control access and assign responsibilities.

#### Acceptance Criteria

1. WHEN creating an employee, THE System SHALL assign a role
2. WHEN creating an employee, THE System SHALL assign the employee to a branch
3. THE System SHALL support employee activation and deactivation
4. WHEN a Company_Manager resets an employee password, THE System SHALL generate a new secure password
5. THE System SHALL log all employee actions in activity logs
6. THE System SHALL prevent employees from accessing financial reports
7. THE System SHALL prevent employees from deleting records
8. THE System SHALL allow employees to manage bookings and rentals

### Requirement 11: Notification System

**User Story:** As a Company Manager or Employee, I want to receive automated notifications, so that I can stay informed about important events.

#### Acceptance Criteria

1. WHEN a vehicle maintenance is due, THE System SHALL send notification
2. WHEN vehicle insurance is expiring, THE System SHALL send notification
3. WHEN a rental becomes overdue, THE System SHALL send notification
4. WHEN a driver license is expiring, THE System SHALL send notification
5. WHEN a payment is overdue, THE System SHALL send notification
6. THE System SHALL deliver notifications via in-app notification system
7. THE System SHALL deliver notifications via email
8. WHERE SMS is configured, THE System SHALL deliver notifications via SMS

### Requirement 12: Audit and Security

**User Story:** As a Super Admin or Company Manager, I want comprehensive audit trails and security measures, so that I can ensure system integrity and compliance.

#### Acceptance Criteria

1. THE System SHALL log every user action with timestamp, user ID, and action details
2. THE System SHALL track all login attempts with success/failure status
3. THE System SHALL support soft delete for all records (mark as deleted without physical removal)
4. THE System SHALL encrypt all user passwords using secure hashing
5. THE System SHALL use JWT tokens for authentication
6. THE System SHALL implement role-based middleware for API authorization
7. IF a user attempts unauthorized API access, THEN THE System SHALL deny access and log the attempt
8. THE System SHALL enforce session timeout after period of inactivity
9. THE System SHALL support audit log filtering by user, date range, and action type

### Requirement 13: Role-Based Access Control

**User Story:** As a system user, I want access restricted based on my role, so that sensitive operations are protected.

#### Acceptance Criteria

1. THE System SHALL define roles: Super_Admin, Company_Manager, Employee, Driver, Customer
2. THE System SHALL associate permissions with each role
3. WHEN a user attempts an action, THE System SHALL verify the user has required permission
4. IF a user lacks permission, THEN THE System SHALL deny the action and return authorization error
5. THE System SHALL support role assignment during user creation
6. THE System SHALL support role modification by authorized users
7. THE System SHALL prevent privilege escalation attempts

### Requirement 14: Data Validation and Business Rules

**User Story:** As a system administrator, I want strict data validation, so that data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL validate VIN format and uniqueness before saving
2. THE System SHALL validate plate number format and uniqueness within company
3. THE System SHALL validate email format for all email fields
4. THE System SHALL validate phone number format
5. THE System SHALL validate date ranges (start date before end date)
6. THE System SHALL validate numeric fields are non-negative where applicable
7. THE System SHALL validate required fields are not empty
8. IF validation fails, THEN THE System SHALL return descriptive error messages

### Requirement 15: Document Storage and Management

**User Story:** As a Company Manager or Employee, I want to upload and manage documents, so that I can maintain digital records.

#### Acceptance Criteria

1. THE System SHALL support upload of vehicle documents (registration, insurance)
2. THE System SHALL support upload of customer ID documents
3. THE System SHALL support upload of driver licenses
4. THE System SHALL support upload of signed rental contracts
5. THE System SHALL store all documents in cloud storage
6. THE System SHALL generate unique identifiers for each document
7. THE System SHALL track document upload date and uploader
8. THE System SHALL support document download by authorized users
9. THE System SHALL validate file types (PDF, JPG, PNG)
10. THE System SHALL validate file size limits

### Requirement 16: Performance Metrics and Reporting

**User Story:** As a Company Manager, I want to view key performance metrics, so that I can measure business success.

#### Acceptance Criteria

1. THE System SHALL calculate fleet utilization as (Rented_Vehicles / Total_Vehicles) × 100
2. THE System SHALL calculate customer retention rate
3. THE System SHALL calculate average rental duration
4. THE System SHALL calculate revenue growth rate comparing periods
5. THE System SHALL calculate vehicle ROI as (Revenue - Expenses) / Vehicle_Cost
6. THE System SHALL rank drivers by performance score
7. THE System SHALL display metrics on dashboard with visual charts
8. THE System SHALL allow filtering metrics by date range
9. THE System SHALL allow filtering metrics by branch

### Requirement 17: System Configuration and Deployment

**User Story:** As a system administrator, I want the system to be production-ready and deployable, so that it can be used by real rental companies.

#### Acceptance Criteria

1. THE System SHALL use environment-based configuration (development, staging, production)
2. THE System SHALL be containerized using Docker
3. THE System SHALL support PostgreSQL database
4. THE System SHALL use Prisma ORM for database operations
5. THE System SHALL implement automated database backups
6. THE System SHALL implement error logging to centralized logging service
7. THE System SHALL implement health check endpoints
8. THE System SHALL support horizontal scaling
9. THE System SHALL implement rate limiting on API endpoints
10. THE System SHALL serve static assets via CDN where configured
