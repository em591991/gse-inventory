from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog (read-only)"""
    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'log_id',
            'timestamp',
            'user',
            'user_email',
            'action',
            'entity_type',
            'entity_id',
            'details',
            'ip'
        ]
        read_only_fields = [
            'log_id',
            'timestamp',
            'user',
            'action',
            'entity_type',
            'entity_id',
            'details',
            'ip'
        ]

