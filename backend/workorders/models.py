# workorders/models.py
from django.db import models
import uuid
from django.utils import timezone

class WorkOrder(models.Model):
    work_order_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=40)
    scheduled_date = models.DateField(null=True)
    department = models.ForeignKey('departments.Department', on_delete=models.CASCADE)
    wo_number = models.CharField(max_length=120, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Add this field
    # other fields...

    def __str__(self):
        return self.wo_number
