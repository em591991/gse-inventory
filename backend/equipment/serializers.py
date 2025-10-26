# backend/equipment/serializers.py

from rest_framework import serializers
from .models import (
    EquipmentModel,
    Equipment,
    EquipmentAssignment,
    EquipmentMaintenance,
    EquipmentCalibrationSchedule,
    EquipmentProcurement
)


class EquipmentModelSerializer(serializers.ModelSerializer):
    """Serializer for EquipmentModel"""
    
    class Meta:
        model = EquipmentModel
        fields = [
            'equipment_model_id',
            'name',
            'manufacturer',
            'model_no',
            'description',
            'default_service_interval_days'
        ]
        read_only_fields = ['equipment_model_id']


# REPLACE EquipmentSerializer and EquipmentListSerializer in equipment/serializers.py

class EquipmentSerializer(serializers.ModelSerializer):
    """Serializer for Equipment with nested model details"""
    equipment_model_name = serializers.CharField(
        source='equipment_model.name',
        read_only=True
    )
    
    class Meta:
        model = Equipment
        fields = [
            'equipment_id',
            'equipment_model',
            'equipment_model_name',
            'serial_no',
            'asset_tag',  # ← ADDED
            'status',
            'purchased_at',
            'cost',
            'notes',
            'current_location',
            'current_bin'
        ]
        read_only_fields = ['equipment_id']


class EquipmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    model_name = serializers.CharField(source='equipment_model.name', read_only=True)
    location_name = serializers.CharField(
        source='current_location.name',
        read_only=True,
        allow_null=True
    )
    # Get current assignment info
    assigned_to = serializers.SerializerMethodField()
    
    class Meta:
        model = Equipment
        fields = [
            'equipment_id',
            'model_name',
            'serial_no',
            'asset_tag',  # ← ADDED
            'status',
            'location_name',
            'assigned_to'  # ← ADDED
        ]
        read_only_fields = ['equipment_id']
    
    def get_assigned_to(self, obj):
        """Get current active assignment"""
        active_assignment = obj.assignments.filter(end_at__isnull=True).first()
        if active_assignment and active_assignment.employee:
            return f"{active_assignment.employee.first_name} {active_assignment.employee.last_name}"
        return None

class EquipmentAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for EquipmentAssignment"""
    equipment_serial = serializers.CharField(
        source='equipment.serial_no',
        read_only=True
    )
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EquipmentAssignment
        fields = [
            'equipment_assignment_id',
            'equipment',
            'equipment_serial',
            'employee',
            'employee_name',
            'location',
            'work_order',
            'start_at',
            'end_at',
            'notes'
        ]
        read_only_fields = ['equipment_assignment_id']
    
    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}"
        return None


class EquipmentMaintenanceSerializer(serializers.ModelSerializer):
    """Serializer for EquipmentMaintenance"""
    equipment_serial = serializers.CharField(
        source='equipment.serial_no',
        read_only=True
    )
    
    class Meta:
        model = EquipmentMaintenance
        fields = [
            'equipment_maintenance_id',
            'equipment',
            'equipment_serial',
            'performed_at',
            'type',
            'performed_by_employee',
            'notes',
            'next_due_at'
        ]
        read_only_fields = ['equipment_maintenance_id']


class EquipmentCalibrationScheduleSerializer(serializers.ModelSerializer):
    """Serializer for EquipmentCalibrationSchedule"""
    
    class Meta:
        model = EquipmentCalibrationSchedule
        fields = [
            'equipment',
            'calibration_interval_days',
            'last_calibrated_at',
            'next_due_at'
        ]


class EquipmentProcurementSerializer(serializers.ModelSerializer):
    """Serializer for EquipmentProcurement"""
    
    class Meta:
        model = EquipmentProcurement
        fields = [
            'equipment',
            'order',
            'order_line',
            'received_at',
            'cost'
        ]