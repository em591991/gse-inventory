from django.contrib import admin
from vehicles.models import (
    VehicleModel, Vehicle, VehicleAssignment,
    VehicleMaintenance, VehicleServiceSchedule, VehicleProcurement
)


@admin.register(VehicleModel)
class VehicleModelAdmin(admin.ModelAdmin):
    list_display = ('vehicle_model_id', 'make', 'model', 'year', 'description')
    search_fields = ('make', 'model', 'year')
    readonly_fields = ('vehicle_model_id',)


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('vehicle_id', 'vehicle_model', 'vin', 'plate_no', 'unit_no', 'status', 'location', 'current_odometer', 'purchase_cost')
    list_filter = ('status', 'vehicle_model')
    search_fields = ('vin', 'plate_no', 'vehicle_model__make', 'vehicle_model__model')
    readonly_fields = ('vehicle_id',)


@admin.register(VehicleAssignment)
class VehicleAssignmentAdmin(admin.ModelAdmin):
    list_display = ('vehicle_assignment_id', 'vehicle', 'employee', 'location', 'start_at', 'end_at')
    list_filter = ('start_at', 'end_at')
    search_fields = ('vehicle__plate_no', 'employee__first_name', 'employee__last_name')
    readonly_fields = ('vehicle_assignment_id',)


@admin.register(VehicleMaintenance)
class VehicleMaintenanceAdmin(admin.ModelAdmin):
    list_display = ('vehicle_maintenance_id', 'vehicle', 'type', 'performed_at', 'performed_by_employee', 'odometer_reading', 'next_due_at')
    list_filter = ('type', 'performed_at')
    search_fields = ('vehicle__plate_no', 'vehicle__vin')
    readonly_fields = ('vehicle_maintenance_id',)


@admin.register(VehicleServiceSchedule)
class VehicleServiceScheduleAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'service_interval_days', 'service_interval_miles', 'last_serviced_at', 'next_due_at', 'next_due_odometer')
    search_fields = ('vehicle__plate_no', 'vehicle__vin')


@admin.register(VehicleProcurement)
class VehicleProcurementAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'order', 'order_line', 'received_at', 'cost')
    search_fields = ('vehicle__plate_no', 'vehicle__vin', 'order__id')
    readonly_fields = ('vehicle',)