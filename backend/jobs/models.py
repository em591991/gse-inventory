from django.db import models
import uuid
from customers.models import Customer
from django.utils import timezone

class MyModel(models.Model):
    start_date = models.DateField(default=timezone.now)



class Job(models.Model):
    job_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, related_name="jobs", on_delete=models.CASCADE)
    job_code = models.CharField(max_length=120)
    name = models.CharField(max_length=255)
    site_address = models.ForeignKey('customers.CustomerAddress', null=True, blank=True, on_delete=models.SET_NULL)
    site_contact = models.ForeignKey('customers.CustomerContact', null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=40)
    created_at = models.DateTimeField(default=timezone.now, null=True)
    closed_at = models.DateTimeField(default=timezone.now, null=True)


    def __str__(self):
        return self.job_code

class WorkOrder(models.Model):
    """
    Work orders within jobs.
    Used for tracking material allocations and costs.
    """
    work_order_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='work_order_id'
    )
    
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='work_orders',
        db_column='job_id'
    )
    
    wo_number = models.CharField(
        max_length=120,
        help_text="Work order number (unique per job)"
    )
    
    title = models.CharField(
        max_length=255,
        blank=True,
        help_text="Work order title/description"
    )
    
    status = models.CharField(
        max_length=40,
        default='DRAFT',
        help_text="Work order status"
    )
    
    scheduled_date = models.DateField(
        null=True,
        blank=True,
        help_text="When work is scheduled"
    )
    
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_orders',
        db_column='department_id'
    )
    
    class Meta:
        db_table = 'work_orders'
        unique_together = [['job', 'wo_number']]
        indexes = [
            models.Index(fields=['job', 'wo_number'], name='idx_wo_job_number'),
            models.Index(fields=['status'], name='idx_wo_status'),
        ]
        verbose_name = 'Work Order'
        verbose_name_plural = 'Work Orders'
    
    def __str__(self):
        return f"{self.wo_number} - {self.title}"
    
    def get_material_cost(self):
        """Get total material cost from inventory movements"""
        from inventory.models import InventoryMovement
        movements = InventoryMovement.objects.filter(work_order=self)
        total = sum(m.total_cost or 0 for m in movements)
        return total