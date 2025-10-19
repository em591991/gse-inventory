from rest_framework import serializers
from .models import WorkOrder


# workorders/serializers.py

class WorkOrderSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source="vendor.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)

    class Meta:
        model = WorkOrder
        fields = "__all__"
           
        