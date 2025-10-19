# employees/models.py
from django.db import models
import uuid
from django.utils import timezone

class MyModel(models.Model):
    start_date = models.DateField(default=timezone.now)


# Import Department model from departments app
from departments.models import Department

class Employee(models.Model):
    employee_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    email = models.EmailField(max_length=320)
    phone = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    home_location = models.ForeignKey('locations.Location', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class EmployeeDepartment(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee} - {self.department}"
