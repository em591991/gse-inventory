from django.db import models
import uuid

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
