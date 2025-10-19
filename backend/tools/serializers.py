from rest_framework import serializers
from .models import Tool, ToolAssignment, ToolMaintenance


class ToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tool
        fields = '__all__'


class ToolAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolAssignment
        fields = '__all__'


class ToolMaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolMaintenance
        fields = '__all__'
