import uuid
from django.db import models
from django.utils import timezone


class EquipmentStatus(models.TextChoices):
    """ERD enum: equipment_status"""
    IN_STOCK = 'IN_STOCK', 'In Stock'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    MAINTENANCE = 'MAINTENANCE', 'Maintenance'
    LOST = 'LOST', 'Lost'
    RETIRED = 'RETIRED', 'Retired'


class MaintenanceType(models.TextChoices):
    """ERD enum: maintenance_type"""
    INSPECTION = 'INSPECTION', 'Inspection'
    CALIBRATION = 'CALIBRATION', 'Calibration'
    REPAIR = 'REPAIR', 'Repair'
    OTHER = 'OTHER', 'Other'


class EquipmentModel(models.Model):
    """
    ERD Table: equipment_models
    Defines types/models of equipment
    """
    equipment_model_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    manufacturer = models.CharField(max_length=255, blank=True)
    model_no = models.CharField(max_length=120, blank=True)
    description = models.CharField(max_length=500, blank=True)
    default_service_interval_days = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'equipment_models'
        indexes = [
            models.Index(fields=['manufacturer', 'model_no'], name='idx_equip_model_lookup'),
        ]

    def __str__(self):
        return f"{self.manufacturer} {self.model_no}" if self.manufacturer else self.name


class Equipment(models.Model):
    """
    ERD Table: equipment
    Individual equipment instances
    """
    equipment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment_model = models.ForeignKey(
        EquipmentModel,
        on_delete=models.PROTECT,
        db_column='equipment_model_id',
        related_name='equipment_instances',
    )
    serial_no = models.CharField(max_length=120, unique=True, blank=True, null=True)
    asset_tag = models.CharField(max_length=120, unique=True, blank=True, null=True)  # ← ADD THIS
    status = models.CharField(max_length=20, choices=EquipmentStatus.choices)

    purchased_at = models.DateTimeField(null=True, blank=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.CharField(max_length=500, blank=True)
    current_location = models.ForeignKey(
        'locations.Location',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='current_location_id',
        related_name='equipment'
    )
    current_bin = models.ForeignKey(
        'inventory.Bin',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='current_bin_id',
        related_name='equipment'
    )

    class Meta:
        db_table = 'equipment'
        verbose_name_plural = 'Equipment'
        indexes = [
            models.Index(fields=['equipment_model'], name='idx_equipment_model'),
            models.Index(fields=['current_location'], name='idx_equipment_loc'),
            models.Index(fields=['current_bin'], name='idx_equipment_bin'),
        ]

    def __str__(self):
        return f"Equipment {self.serial_no or self.equipment_id}"


class EquipmentAssignment(models.Model):
    """
    ERD Table: equipment_assignments
    Tracks equipment assignments to employees/locations/work orders
    """
    equipment_assignment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        db_column='equipment_id',
        related_name='assignments'
    )
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='employee_id',
        related_name='equipment_assignments'
    )
    location = models.ForeignKey(
        'locations.Location',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='location_id',
        related_name='equipment_assignments'
    )
    work_order = models.ForeignKey(
        'workorders.WorkOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='work_order_id',
        related_name='equipment_assignments'
    )
    start_at = models.DateTimeField(default=timezone.now)
    end_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'equipment_assignments'
        indexes = [
            models.Index(fields=['equipment'], name='idx_eqa_equipment'),
            models.Index(fields=['employee'], name='idx_eqa_employee'),
            models.Index(fields=['location'], name='idx_eqa_location'),
            models.Index(fields=['work_order'], name='idx_eqa_wo'),
            models.Index(fields=['equipment', 'end_at'], name='idx_eqa_active_picker'),
        ]

    def __str__(self):
        return f"Equipment Assignment {self.equipment_assignment_id}"


class EquipmentMaintenance(models.Model):
    """
    ERD Table: equipment_maintenance
    Tracks maintenance performed on equipment
    """
    equipment_maintenance_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        db_column='equipment_id',
        related_name='maintenance_records'
    )
    performed_at = models.DateTimeField(default=timezone.now)
    type = models.CharField(max_length=20, choices=MaintenanceType.choices)
    performed_by_employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='performed_by_employee_id',
        related_name='equipment_maintenance_performed'
    )
    notes = models.CharField(max_length=500, blank=True)
    next_due_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'equipment_maintenance'
        indexes = [
            models.Index(fields=['equipment'], name='idx_em_equipment'),
        ]

    def __str__(self):
        return f"Equipment Maintenance {self.equipment_maintenance_id}"


class EquipmentCalibrationSchedule(models.Model):
    """
    ERD Table: equipment_calibration_schedule
    Defines calibration requirements for equipment
    """
    equipment = models.OneToOneField(
        Equipment,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='equipment_id',
        related_name='calibration_schedule'
    )
    calibration_interval_days = models.IntegerField(null=True, blank=True)
    last_calibrated_at = models.DateTimeField(null=True, blank=True)
    next_due_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'equipment_calibration_schedule'

    def __str__(self):
        return f"Calibration Schedule for Equipment {self.equipment_id}"


class EquipmentProcurement(models.Model):
    """
    ERD Table: equipment_procurements
    Links equipment to their purchase orders
    """
    equipment = models.OneToOneField(
        Equipment,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='equipment_id',
        related_name='procurement'
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        db_column='order_id',
        related_name='equipment_procurements'
    )
    order_line = models.ForeignKey(
        'orders.OrderLine',  
        on_delete=models.CASCADE,
        db_column='order_line_id',
        related_name='equipment_procurements'
    )
    received_at = models.DateTimeField(default=timezone.now)
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'equipment_procurements'
        indexes = [
            models.Index(fields=['order', 'order_line'], name='idx_equipment_po_line'),
        ]

    def __str__(self):
        return f"Equipment Procurement {self.equipment_id}"

