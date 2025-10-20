# Models vs ERD Verification Checklist

Use this to verify each model matches the ERD exactly.

## ✅ INVENTORY MODELS
- [x] UnitOfMeasure - matches ERD
- [x] Item - matches ERD (updated with g_code, item_id)
- [x] Location - matches ERD
- [x] Bin - matches ERD
- [x] ItemDefaultBin - matches ERD
- [x] InventoryMovement - matches ERD
- [x] ItemLocationPolicy - matches ERD

## ✅ MANUFACTURER MODELS
- [x] Manufacturer - matches ERD
- [x] ManufacturerPart - matches ERD
- [x] ItemManufacturerPart - matches ERD

## ✅ VENDOR MODELS
- [x] Vendor - matches ERD
- [x] VendorItem - matches ERD (updated with mfr_part link)
- [x] Subcontractor - matches ERD

## ✅ ORDER MODELS
- [x] Order - matches ERD (unified structure)
- [x] OrderLine - matches ERD
- [x] SalesOrderInfo - matches ERD
- [ ] Shipment - NOT IMPLEMENTED
- [ ] ShipmentLine - NOT IMPLEMENTED

## ✅ CUSTOMER MODELS
- [x] Customer - matches ERD
- [x] CustomerAddress - matches ERD
- [x] CustomerContact - matches ERD

## ✅ JOB MODELS
- [x] Job - matches ERD
- [x] WorkOrder - matches ERD

## ✅ EMPLOYEE MODELS
- [x] Employee - matches ERD
- [x] EmployeeDepartment - matches ERD

## ✅ DEPARTMENT MODELS
- [x] Department - matches ERD

## ⚠️ TOOL MODELS (Partial)
- [x] ToolModel - matches ERD
- [x] Tool - matches ERD
- [x] ToolAssignment - matches ERD
- [ ] ToolMaintenance - NOT IMPLEMENTED
- [ ] ToolCalibrationSchedule - NOT IMPLEMENTED
- [ ] ToolProcurement - NOT IMPLEMENTED

## ⬜ EQUIPMENT MODELS
- [ ] EquipmentModel - NOT IMPLEMENTED
- [ ] Equipment - NOT IMPLEMENTED
- [ ] EquipmentAssignment - NOT IMPLEMENTED
- [ ] EquipmentMaintenance - NOT IMPLEMENTED
- [ ] EquipmentCalibrationSchedule - NOT IMPLEMENTED
- [ ] EquipmentProcurement - NOT IMPLEMENTED

## ⬜ VEHICLE MODELS
- [ ] VehicleModel - NOT IMPLEMENTED
- [ ] Vehicle - NOT IMPLEMENTED
- [ ] VehicleAssignment - NOT IMPLEMENTED
- [ ] VehicleMaintenance - NOT IMPLEMENTED
- [ ] VehicleServiceSchedule - NOT IMPLEMENTED
- [ ] VehicleProcurement - NOT IMPLEMENTED

## ⬜ USER/AUTH MODELS
- [ ] User - NOT IMPLEMENTED
- [ ] OAuthIdentity - NOT IMPLEMENTED
- [ ] Role - NOT IMPLEMENTED
- [ ] Permission - NOT IMPLEMENTED
- [ ] RolePermission - NOT IMPLEMENTED
- [ ] UserRole - NOT IMPLEMENTED
- [ ] UserLocationAccess - NOT IMPLEMENTED
- [ ] UserDepartmentAccess - NOT IMPLEMENTED

## ⬜ AUDIT MODELS
- [ ] AuditLog - NOT IMPLEMENTED

---

**Legend:**
- [x] = Implemented and matches ERD
- [⚠️] = Partially implemented
- [ ] = Not yet implemented

*Last Updated: January 20, 2025*