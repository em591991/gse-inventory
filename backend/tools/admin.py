# backend/tools/admin.py

from django.contrib import admin
from .models import (
    ToolModel, 
    Tool, 
    ToolAssignment,
    ToolMaintenance,
    ToolCalibrationSchedule,
    ToolProcurement
)


@admin.register(ToolModel)
class ToolModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'manufacturer', 'model_no')  # ← model_no not model_number
    search_fields = ('name', 'manufacturer', 'model_no')
    readonly_fields = ('model_id',)


@admin.register(Tool)
class ToolAdmin(admin.ModelAdmin):
    list_display = ('serial_no', 'model', 'status', 'current_location')  # ← serial_no not serial_number, model not tool_model
    list_filter = ('status',)  # ← removed model from list_filter
    search_fields = ('serial_no',)
    readonly_fields = ('tool_id',)


@admin.register(ToolAssignment)
class ToolAssignmentAdmin(admin.ModelAdmin):
    list_display = ('tool', 'employee', 'start_at', 'end_at')  # ← start_at/end_at not assigned_at/returned_at
    list_filter = ('start_at', 'end_at')
    search_fields = ('tool__serial_no', 'employee__first_name', 'employee__last_name')
    readonly_fields = ('assignment_id',)


@admin.register(ToolMaintenance)
class ToolMaintenanceAdmin(admin.ModelAdmin):
    list_display = ('maintenance_id', 'tool', 'type', 'performed_at', 'performed_by_employee', 'next_due_at')
    list_filter = ('type', 'performed_at')
    search_fields = ('tool__serial_no',)
    readonly_fields = ('maintenance_id',)


@admin.register(ToolCalibrationSchedule)
class ToolCalibrationScheduleAdmin(admin.ModelAdmin):
    list_display = ('tool', 'calibration_interval_days', 'last_calibrated_at', 'next_due_at')
    search_fields = ('tool__serial_no',)


@admin.register(ToolProcurement)
class ToolProcurementAdmin(admin.ModelAdmin):
    list_display = ('tool', 'order', 'order_line', 'received_at', 'cost')
    search_fields = ('tool__serial_no', 'order__order_id')
    readonly_fields = ('tool',)