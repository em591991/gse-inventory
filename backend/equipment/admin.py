from django.contrib import admin
from equipment.models import (
    EquipmentModel, Equipment, EquipmentAssignment,
    EquipmentMaintenance, EquipmentCalibrationSchedule, EquipmentProcurement
)


@admin.register(EquipmentModel)
class EquipmentModelAdmin(admin.ModelAdmin):
    list_display = ('equipment_model_id', 'name', 'manufacturer', 'model_no', 'default_service_interval_days')
    search_fields = ('name', 'manufacturer', 'model_no')
    readonly_fields = ('equipment_model_id',)


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('equipment_id', 'equipment_model', 'serial_no', 'status', 'current_location')
    list_filter = ('status', 'equipment_model')
    search_fields = ('serial_no', 'equipment_model__name')
    readonly_fields = ('equipment_id',)


@admin.register(EquipmentAssignment)
class EquipmentAssignmentAdmin(admin.ModelAdmin):
    list_display = ('equipment_assignment_id', 'equipment', 'employee', 'location', 'work_order', 'start_at', 'end_at')
    list_filter = ('start_at', 'end_at')
    search_fields = ('equipment__serial_no', 'employee__first_name', 'employee__last_name')
    readonly_fields = ('equipment_assignment_id',)


@admin.register(EquipmentMaintenance)
class EquipmentMaintenanceAdmin(admin.ModelAdmin):
    list_display = ('equipment_maintenance_id', 'equipment', 'type', 'performed_at', 'performed_by_employee', 'next_due_at')
    list_filter = ('type', 'performed_at')
    search_fields = ('equipment__serial_no',)
    readonly_fields = ('equipment_maintenance_id',)


@admin.register(EquipmentCalibrationSchedule)
class EquipmentCalibrationScheduleAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'calibration_interval_days', 'last_calibrated_at', 'next_due_at')
    search_fields = ('equipment__serial_no',)


@admin.register(EquipmentProcurement)
class EquipmentProcurementAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'order', 'order_line', 'received_at', 'cost')
    search_fields = ('equipment__serial_no', 'order__id')
    readonly_fields = ('equipment',)