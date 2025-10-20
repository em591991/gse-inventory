# GSE Inventory System - Architecture

## Overview
Inventory management system for electrical contracting business.

**Tech Stack:**
- Backend: Django 5.x + Django REST Framework
- Frontend: React 18
- Database: PostgreSQL (production), SQLite (dev)
- Auth: OAuth 2.0 (planned)

## App Structure

### Core Apps

#### `inventory`
**Purpose:** Core inventory management
**Models:** Item, UnitOfMeasure, Location, Bin, ItemDefaultBin, InventoryMovement, ItemLocationPolicy

#### `manufacturers`
**Purpose:** Manufacturer and part tracking
**Models:** Manufacturer, ManufacturerPart, ItemManufacturerPart

#### `vendors`
**Purpose:** Vendor and subcontractor management
**Models:** Vendor, VendorItem, Subcontractor

#### `orders`
**Purpose:** Unified order processing (PO, Sales, Transfers, etc.)
**Models:** Order, OrderLine, SalesOrderInfo

#### `customers`
**Purpose:** Customer relationship management
**Models:** Customer, CustomerAddress, CustomerContact

#### `jobs`
**Purpose:** Job and work order management
**Models:** Job, WorkOrder

#### `employees`
**Purpose:** Employee data
**Models:** Employee, EmployeeDepartment

#### `departments`
**Purpose:** Department structure
**Models:** Department

#### `tools`
**Purpose:** Tool tracking and assignment
**Models:** ToolModel, Tool, ToolAssignment
**Note:** Will eventually merge into `assets` app

### Future Apps
- `shipments` - Shipment processing
- `assets` - Consolidated tools, equipment, vehicles
- `users` - Authentication and authorization
- `audit` - Audit logging

## Key Architectural Decisions

### 1. Unified Order Model
Instead of separate PurchaseOrder, SalesOrder, etc., we use a single `Order` model with `order_type` enum.

**Why:** Matches ERD, reduces duplication, simplifies order processing.

### 2. UUID Primary Keys
All main entities use explicit UUID fields (e.g., `item_id`, `order_id`) instead of Django's auto-increment `id`.

**Why:** ERD specification, better for distributed systems, more secure.

### 3. ERD as Source of Truth
All model changes must reference and match the ERD exactly.

**Why:** Prevents scope creep, ensures consistent data model.

### 4. Field Naming Convention
Use explicit, descriptive names from ERD: `item_name` not `name`, `ordered_at` not `created_at`.

**Why:** Self-documenting code, eliminates ambiguity.

## Data Flow Examples

### Purchase Order Flow
1. Create Order with `order_type='PURCHASE'`, link to vendor
2. Add OrderLines with items and quantities
3. Receive items → create InventoryMovement records
4. Update inventory levels at location/bin

### Work Order Allocation Flow
1. Create Job for customer
2. Create WorkOrder linked to job
3. Create Order with `order_type='TRANSFER'` linked to work order
4. Add OrderLines for materials needed
5. InventoryMovement transfers from warehouse to truck/job site

### Tool Assignment Flow
1. Purchase tool → Tool record created
2. Create ToolAssignment linking to employee
3. Tool status changes to 'ASSIGNED'
4. Track maintenance with ToolMaintenance records

## API Design (TODO)
- RESTful endpoints for all models
- Nested serializers for related data
- Filtering and pagination
- Permission-based access control

## Deployment (Planned)
- Development: SQLite, Django dev server
- Production: PostgreSQL, Docker, AWS/Azure
- CI/CD: GitHub Actions

---

*Last Updated: January 20, 2025*