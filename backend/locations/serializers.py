# locations/serializers.py
from rest_framework import serializers
from .models import Location


class LocationSerializer(serializers.ModelSerializer):
    """
    Serializer for Location model
    Uses location_id (UUID) as primary key
    """
    class Meta:
        model = Location
        fields = ['location_id', 'name', 'type', 'is_active']
        read_only_fields = ['location_id']
    
    def validate_name(self, value):
        """Ensure name is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Name cannot be empty")
        return value.strip()
    
    def validate_type(self, value):
        """Ensure type is one of the valid choices"""
        valid_types = ['WAREHOUSE', 'TRUCK', 'JOB', 'STORAGE']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid type. Must be one of: {', '.join(valid_types)}"
            )
        return value