# backend/jobs/serializers.py
from rest_framework import serializers
from .models import Job
from customers.models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for Customer model.
    CRITICAL: Customer has NO 'notes' field - only 6 fields total.
    """
    class Meta:
        model = Customer
        fields = [
            'customer_id',
            'name',
            'email',
            'phone',
            'tax_exempt_no',
            'terms'
            # ❌ NO 'notes' field exists in Customer model
        ]
        read_only_fields = ['customer_id']


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for Job model.
    CRITICAL: Job has NO 'description' or 'job_name' fields.
    Field is 'name', not 'job_name'.
    """
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = Job
        fields = [
            'job_id',
            'customer',           # ForeignKey ID
            'customer_name',      # Read-only display name
            'job_code',
            'name',               # ✅ Correct - NOT 'job_name'
            'site_address',       # ForeignKey to CustomerAddress
            'site_contact',       # ForeignKey to CustomerContact
            'status',
            'created_at',
            'closed_at'
            # ❌ NO 'description' field exists in Job model
        ]
        read_only_fields = ['job_id', 'customer_name']