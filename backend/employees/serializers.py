from rest_framework import serializers
from .models import Employee, Department, EmployeeAssignment


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class EmployeeAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAssignment
        fields = '__all__'
