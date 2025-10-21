from rest_framework import serializers
from .models import (
    VehicleModel,
    Vehicle,
    VehicleAssignment,
    VehicleMaintenance,
    VehicleServiceSchedule,
    VehicleProcurement
)


class VehicleModelSerializer(serializers.ModelSerializer):
    """Serializer for VehicleModel"""
    
    class Meta:
        model = VehicleModel
        fields = [
            'vehicle_model_id',
            'make',
            'model',
            'year',
            'description'
        ]
        read_only_fields = ['vehicle_model_id']


# Updated VehicleSerializer with new fields
# File: backend/vehicles/serializers.py
#
# UPDATE the VehicleSerializer class

class VehicleSerializer(serializers.ModelSerializer):
    """Serializer for Vehicle with nested model details"""
    vehicle_model_name = serializers.SerializerMethodField()
    location_name = serializers.CharField(
        source='location.name',
        read_only=True
    )
    
    class Meta:
        model = Vehicle
        fields = [
            'vehicle_id',
            'vehicle_model',
            'vehicle_model_name',
            'vin',
            'plate_no',
            'unit_no',           # ✨ ADD THIS
            'purchased_at',      # ✨ ADD THIS
            'purchase_cost',     # ✨ ADD THIS
            'status',
            'current_odometer',
            'registration_expires_at',
            'insurance_expires_at',
            'notes',
            'location',
            'location_name'
        ]
        read_only_fields = ['vehicle_id']
    
    def get_vehicle_model_name(self, obj):
        return f"{obj.vehicle_model.year} {obj.vehicle_model.make} {obj.vehicle_model.model}"


class VehicleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    model_name = serializers.SerializerMethodField()
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    class Meta:
        model = Vehicle
        fields = [
            'vehicle_id',
            'model_name',
            'plate_no',
            'status',
            'location_name',
            'current_odometer'
        ]
        read_only_fields = ['vehicle_id']
    
    def get_model_name(self, obj):
        return f"{obj.vehicle_model.year} {obj.vehicle_model.make} {obj.vehicle_model.model}"


class VehicleAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for VehicleAssignment"""
    vehicle_plate = serializers.CharField(source='vehicle.plate_no', read_only=True)
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = VehicleAssignment
        fields = [
            'vehicle_assignment_id',
            'vehicle',
            'vehicle_plate',
            'employee',
            'employee_name',
            'location',
            'start_at',
            'end_at',
            'notes'
        ]
        read_only_fields = ['vehicle_assignment_id']
    
    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}"
        return None


class VehicleMaintenanceSerializer(serializers.ModelSerializer):
    """Serializer for VehicleMaintenance"""
    vehicle_plate = serializers.CharField(source='vehicle.plate_no', read_only=True)
    
    class Meta:
        model = VehicleMaintenance
        fields = [
            'vehicle_maintenance_id',
            'vehicle',
            'vehicle_plate',
            'performed_at',
            'type',
            'performed_by_employee',
            'notes',
            'next_due_at',
            'odometer_reading'
        ]
        read_only_fields = ['vehicle_maintenance_id']


class VehicleServiceScheduleSerializer(serializers.ModelSerializer):
    """Serializer for VehicleServiceSchedule"""
    
    class Meta:
        model = VehicleServiceSchedule
        fields = [
            'vehicle',
            'service_interval_days',
            'service_interval_miles',
            'last_serviced_at',
            'last_service_odometer',
            'next_due_at',
            'next_due_odometer'
        ]


class VehicleProcurementSerializer(serializers.ModelSerializer):
    """Serializer for VehicleProcurement"""
    
    class Meta:
        model = VehicleProcurement
        fields = [
            'vehicle',
            'order',
            'order_line',
            'received_at',
            'cost'
        ]
