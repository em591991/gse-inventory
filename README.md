# gse-inventory

# App Organization

## inventory
- Item, Location, Bin, InventoryMovement, UnitOfMeasure, ItemLocationPolicy

## manufacturers  
- Manufacturer, ManufacturerPart, ItemManufacturerPart

## vendors
- Vendor, VendorItem, Subcontractor

## orders
- Order (unified), OrderLine, SalesOrderInfo

## customers
- Customer, CustomerAddress, CustomerContact

## jobs
- Job, WorkOrder

## employees
- Employee, EmployeeDepartment

## departments
- Department

## tools (TODO: merge into assets app)
- ToolModel, Tool, ToolAssignment

## Future apps:
- shipments
- assets (tools + equipment + vehicles)
- users (auth & permissions)
- audit