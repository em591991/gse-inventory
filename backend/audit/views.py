from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, mixins
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(mixins.ListModelMixin,
                       mixins.RetrieveModelMixin,
                       viewsets.GenericViewSet):
    """
    Read-only ViewSet for AuditLog
    
    Only supports list and retrieve operations.
    Audit logs are created automatically by the system.
    """
    queryset = AuditLog.objects.all().select_related('user')
    serializer_class = AuditLogSerializer
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user', 'action', 'entity_type', 'timestamp']
    search_fields = ['action', 'entity_type', 'entity_id', 'details']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
