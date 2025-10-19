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
