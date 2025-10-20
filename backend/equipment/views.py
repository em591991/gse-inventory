from django.shortcuts import render

# Create your views here.
# backend/equipment/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    EquipmentModel,
    Equipment,
    EquipmentAssignment,
    EquipmentMaintenance,
    EquipmentCalibrationSchedule,
    EquipmentProcurement
)
from .serializers import (
    EquipmentModelSerializer,
    EquipmentSerializer,
    EquipmentListSerializer,
    EquipmentAssignmentSerializer,
    EquipmentMaintenanceSerializer,
    EquipmentCalibrationScheduleSerializer,
    EquipmentProcurementSerializer
)


class EquipmentModelViewSet(viewsets.ModelViewSet):
    """ViewSet for EquipmentModel operations"""
    queryset = EquipmentModel.objects.all()
    serializer_class = EquipmentModelSerializer
    
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'manufacturer', 'model_no']
    ordering_fields = ['name', 'manufacturer']
    ordering = ['name']


class EquipmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Equipment operations"""
    queryset = Equipment.objects.all().select_related(
        'equipment_model',
        'current_location',
        'current_bin'
    )
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'equipment_model', 'current_location']
    search_fields = ['serial_no', 'equipment_model__name', 'notes']
    ordering_fields = ['serial_no', 'purchased_at', 'status']
    ordering = ['-purchased_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EquipmentListSerializer
        return EquipmentSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get assignment and maintenance history for equipment"""
        equipment = self.get_object()
        
        assignments = EquipmentAssignment.objects.filter(
            equipment=equipment
        ).select_related('employee', 'location', 'work_order').order_by('-start_at')
        
        maintenance = EquipmentMaintenance.objects.filter(
            equipment=equipment
        ).select_related('performed_by_employee').order_by('-performed_at')
        
        return Response({
            'equipment': EquipmentSerializer(equipment).data,
            'assignments': EquipmentAssignmentSerializer(assignments, many=True).data,
            'maintenance': EquipmentMaintenanceSerializer(maintenance, many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign equipment to employee/location/work order"""
        equipment = self.get_object()
        
        serializer = EquipmentAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(equipment=equipment)
            equipment.status = 'ASSIGNED'
            equipment.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EquipmentAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for EquipmentAssignment operations"""
    queryset = EquipmentAssignment.objects.all().select_related(
        'equipment',
        'employee',
        'location',
        'work_order'
    )
    serializer_class = EquipmentAssignmentSerializer
    
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['equipment', 'employee', 'location', 'work_order']
    ordering_fields = ['start_at', 'end_at']
    ordering = ['-start_at']


class EquipmentMaintenanceViewSet(viewsets.ModelViewSet):
    """ViewSet for EquipmentMaintenance operations"""
    queryset = EquipmentMaintenance.objects.all().select_related(
        'equipment',
        'performed_by_employee'
    )
    serializer_class = EquipmentMaintenanceSerializer
    
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['equipment', 'type', 'performed_by_employee']
    ordering_fields = ['performed_at', 'next_due_at']
    ordering = ['-performed_at']


class EquipmentCalibrationScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for EquipmentCalibrationSchedule operations"""
    queryset = EquipmentCalibrationSchedule.objects.all().select_related('equipment')
    serializer_class = EquipmentCalibrationScheduleSerializer
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['equipment']


class EquipmentProcurementViewSet(viewsets.ModelViewSet):
    """ViewSet for EquipmentProcurement operations"""
    queryset = EquipmentProcurement.objects.all().select_related(
        'equipment',
        'order',
        'order_line'
    )
    serializer_class = EquipmentProcurementSerializer
    
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['equipment', 'order']
    ordering_fields = ['received_at']
    ordering = ['-received_at']