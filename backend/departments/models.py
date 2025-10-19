# departments/models.py
from django.db import models
import uuid
from django.utils import timezone

class MyModel(models.Model):
    start_date = models.DateField(default=timezone.now)


class Department(models.Model):
    department_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=40, unique=True)
    parent_department = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name="sub_departments")
    is_active = models.BooleanField()

    def __str__(self):
        return self.name  # Add necessary imports

class DepartmentAssignment(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    # Add other fields that you need for this model, such as employee, start date, etc.
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)  # Example reference to Employee model
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.employee} assigned to {self.department}"
