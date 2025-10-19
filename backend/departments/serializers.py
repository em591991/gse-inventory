from rest_framework import serializers
from .models import Department, DepartmentAssignment


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class DepartmentAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentAssignment
        fields = '__all__'
