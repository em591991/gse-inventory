import uuid
from django.db import models
from django.utils import timezone

class ToolModel(models.Model):
    model_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    manufacturer = models.CharField(max_length=255)
    model_no = models.CharField(max_length=120)
    description = models.TextField()
    default_service_interval_days = models.IntegerField()

    def __str__(self):
        return self.name

class Tool(models.Model):
    tool_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model = models.ForeignKey(ToolModel, on_delete=models.CASCADE)
    serial_no = models.CharField(max_length=120, unique=True)
    status = models.CharField(max_length=20, choices=[('IN_STOCK', 'In Stock'), ('ASSIGNED', 'Assigned'), ('MAINTENANCE', 'Maintenance'), ('LOST', 'Lost'), ('RETIRED', 'Retired')])
    purchased_at = models.DateTimeField(null=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField()
    current_location = models.ForeignKey('locations.Location', null=True, blank=True, on_delete=models.SET_NULL)
    current_bin = models.ForeignKey('bins.Bin', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.serial_no

class ToolAssignment(models.Model):
    assignment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE)
    employee = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True)
    location = models.ForeignKey('locations.Location', on_delete=models.SET_NULL, null=True)
    start_at = models.DateTimeField(null=True)
    end_at = models.DateTimeField(null=True)
    notes = models.TextField()

    def __str__(self):
        return f"Assignment {self.assignment_id} - {self.tool}"

class MaintenanceType(models.TextChoices):
    INSPECTION = 'INSPECTION', 'Inspection'
    CALIBRATION = 'CALIBRATION', 'Calibration'
    REPAIR = 'REPAIR', 'Repair'
    OTHER = 'OTHER', 'Other'


class ToolMaintenance(models.Model):
    maintenance_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tool = models.ForeignKey(
        'tools.Tool',
        on_delete=models.CASCADE,
        db_column='tool_id',
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
        related_name='tool_maintenance_performed'
    )
    notes = models.CharField(max_length=500, blank=True)
    next_due_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tool_maintenance'
        indexes = [
            models.Index(fields=['tool'], name='idx_tm_tool'),
        ]

    def __str__(self):
        return f"Tool Maintenance {self.maintenance_id} - {self.type}"


class ToolCalibrationSchedule(models.Model):
    tool = models.OneToOneField(
        'tools.Tool',
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='tool_id',
        related_name='calibration_schedule'
    )
    calibration_interval_days = models.IntegerField()
    last_calibrated_at = models.DateTimeField(null=True, blank=True)
    next_due_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tool_calibration_schedule'

    def __str__(self):
        return f"Calibration Schedule for Tool {self.tool_id}"


class ToolProcurement(models.Model):
    tool = models.OneToOneField(
        'tools.Tool',
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='tool_id',
        related_name='procurement'
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        db_column='order_id',
        related_name='tool_procurements'
    )
    order_line = models.ForeignKey(
        'orders.OrderLine',
        on_delete=models.CASCADE,
        db_column='order_line_id',
        related_name='tool_procurements'
    )
    received_at = models.DateTimeField(default=timezone.now)
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'tool_procurements'
        indexes = [
            models.Index(fields=['order', 'order_line'], name='idx_tool_po_line'),
        ]

    def __str__(self):
        return f"Tool Procurement {self.tool_id}"