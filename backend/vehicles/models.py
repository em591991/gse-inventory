import uuid
from django.db import models
from django.utils import timezone


class VehicleStatus(models.TextChoices):
    """ERD enum: vehicle_status"""
    IN_SERVICE = 'IN_SERVICE', 'In Service'
    MAINTENANCE = 'MAINTENANCE', 'Maintenance'
    OUT_OF_SERVICE = 'OUT_OF_SERVICE', 'Out of Service'
    RETIRED = 'RETIRED', 'Retired'


class FleetServiceType(models.TextChoices):
    """ERD enum: fleet_service_type"""
    OIL_CHANGE = 'OIL_CHANGE', 'Oil Change'
    TIRE_ROTATION = 'TIRE_ROTATION', 'Tire Rotation'
    INSPECTION = 'INSPECTION', 'Inspection'
    REPAIR = 'REPAIR', 'Repair'
    OTHER = 'OTHER', 'Other'


class VehicleModel(models.Model):
    """
    ERD Table: vehicle_models
    Defines types/models of vehicles
    """
    vehicle_model_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    make = models.CharField(max_length=120)
    model = models.CharField(max_length=120)
    year = models.IntegerField(null=True, blank=True)
    description = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'vehicle_models'
        indexes = [
            models.Index(fields=['make', 'model', 'year'], name='idx_vehicle_model_lookup'),
        ]

    def __str__(self):
        return f"{self.year} {self.make} {self.model}" if self.year else f"{self.make} {self.model}"


class Vehicle(models.Model):
    """
    ERD Table: vehicles
    Individual vehicle instances
    """
    vehicle_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle_model = models.ForeignKey(
        VehicleModel,
        on_delete=models.PROTECT,
        db_column='vehicle_model_id',
        related_name='vehicles'
    )
    vin = models.CharField(max_length=32, unique=True, blank=True, null=True)
    plate_no = models.CharField(max_length=32, blank=True)
    unit_no = models.CharField(max_length=50, blank=True, default='')
    purchased_at = models.DateField(null=True, blank=True)
    purchase_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=VehicleStatus.choices)
    current_odometer = models.IntegerField(null=True, blank=True)
    registration_expires_at = models.DateField(null=True, blank=True)
    insurance_expires_at = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=500, blank=True)
    location = models.ForeignKey(
        'inventory.Location',
        on_delete=models.PROTECT,
        db_column='location_id',
        related_name='vehicles'
    )

    class Meta:
        db_table = 'vehicles'
        indexes = [
            models.Index(fields=['vehicle_model'], name='idx_vehicle_model'),
            models.Index(fields=['location'], name='idx_vehicle_location'),
        ]

    def __str__(self):
        return f"Vehicle {self.plate_no or self.vin or self.vehicle_id}"


class VehicleAssignment(models.Model):
    """
    ERD Table: vehicle_assignments
    Tracks vehicle assignments to employees/locations
    """
    vehicle_assignment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        db_column='vehicle_id',
        related_name='assignments'
    )
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='employee_id',
        related_name='vehicle_assignments'
    )
    location = models.ForeignKey(
        'inventory.Location',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='location_id',
        related_name='vehicle_assignments'
    )
    start_at = models.DateTimeField(default=timezone.now)
    end_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'vehicle_assignments'
        indexes = [
            models.Index(fields=['vehicle'], name='idx_va_vehicle'),
            models.Index(fields=['employee'], name='idx_va_emp'),
            models.Index(fields=['location'], name='idx_va_loc'),
            models.Index(fields=['vehicle', 'end_at'], name='idx_va_active_picker'),
        ]

    def __str__(self):
        return f"Vehicle Assignment {self.vehicle_assignment_id}"


class VehicleMaintenance(models.Model):
    """
    ERD Table: vehicle_maintenance
    Tracks maintenance performed on vehicles
    """
    vehicle_maintenance_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        db_column='vehicle_id',
        related_name='maintenance_records'
    )
    performed_at = models.DateTimeField(default=timezone.now)
    type = models.CharField(max_length=20, choices=FleetServiceType.choices)
    performed_by_employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='performed_by_employee_id',
        related_name='vehicle_maintenance_performed'
    )
    notes = models.CharField(max_length=500, blank=True)
    next_due_at = models.DateTimeField(null=True, blank=True)
    odometer_reading = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'vehicle_maintenance'
        indexes = [
            models.Index(fields=['vehicle'], name='idx_vm_vehicle'),
        ]

    def __str__(self):
        return f"Vehicle Maintenance {self.vehicle_maintenance_id}"


class VehicleServiceSchedule(models.Model):
    """
    ERD Table: vehicle_service_schedule
    Defines service requirements for vehicles
    """
    vehicle = models.OneToOneField(
        Vehicle,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='vehicle_id',
        related_name='service_schedule'
    )
    service_interval_days = models.IntegerField(null=True, blank=True)
    service_interval_miles = models.IntegerField(null=True, blank=True)
    last_serviced_at = models.DateTimeField(null=True, blank=True)
    last_service_odometer = models.IntegerField(null=True, blank=True)
    next_due_at = models.DateTimeField(null=True, blank=True)
    next_due_odometer = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'vehicle_service_schedule'

    def __str__(self):
        return f"Service Schedule for Vehicle {self.vehicle_id}"


class VehicleProcurement(models.Model):
    """
    ERD Table: vehicle_procurements
    Links vehicles to their purchase orders
    """
    vehicle = models.OneToOneField(
        Vehicle,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='vehicle_id',
        related_name='procurement'
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        db_column='order_id',
        related_name='vehicle_procurements'
    )
    order_line = models.ForeignKey(
        'orders.OrderLine',  
        on_delete=models.CASCADE,
        db_column='order_line_id',
        related_name='vehicle_procurements'
    )
    received_at = models.DateTimeField(default=timezone.now)
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'vehicle_procurements'
        indexes = [
            models.Index(fields=['order', 'order_line'], name='idx_vehicle_po_line'),
        ]

    def __str__(self):
        return f"Vehicle Procurement {self.vehicle_id}"

