from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    VehicleModel,
    Vehicle,
    VehicleAssignment,
    VehicleMaintenance,
    VehicleServiceSchedule,
    VehicleProcurement
)
from .serializers import (
    VehicleModelSerializer,
    VehicleSerializer,
    VehicleListSerializer,
    VehicleAssignmentSerializer,
    VehicleMaintenanceSerializer,
    VehicleServiceScheduleSerializer,
    VehicleProcurementSerializer
)


class VehicleModelViewSet(viewsets.ModelViewSet):
    """ViewSet for VehicleModel operations"""
    queryset = VehicleModel.objects.all()
    serializer_class = VehicleModelSerializer
    
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['make', 'model', 'year']
    ordering_fields = ['make', 'model', 'year']
    ordering = ['-year', 'make', 'model']


class VehicleViewSet(viewsets.ModelViewSet):
    """ViewSet for Vehicle operations"""
    queryset = Vehicle.objects.all().select_related(
        'vehicle_model',
        'location'
    )
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'vehicle_model', 'location']
    search_fields = ['vin', 'plate_no', 'vehicle_model__make', 'vehicle_model__model']
    ordering_fields = ['plate_no', 'current_odometer', 'status']
    ordering = ['plate_no']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleListSerializer
        return VehicleSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get assignment and maintenance history for vehicle"""
        vehicle = self.get_object()
        
        assignments = VehicleAssignment.objects.filter(
            vehicle=vehicle
        ).select_related('employee', 'location').order_by('-start_at')
        
        maintenance = VehicleMaintenance.objects.filter(
            vehicle=vehicle
        ).select_related('performed_by_employee').order_by('-performed_at')
        
        return Response({
            'vehicle': VehicleSerializer(vehicle).data,
            'assignments': VehicleAssignmentSerializer(assignments, many=True).data,
            'maintenance': VehicleMaintenanceSerializer(maintenance, many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign vehicle to employee/location"""
        vehicle = self.get_object()
        
        serializer = VehicleAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(vehicle=vehicle)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VehicleAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for VehicleAssignment operations"""
    queryset = VehicleAssignment.objects.all().select_related(
        'vehicle',
        'employee',
        'location'
    )
    serializer_class = VehicleAssignmentSerializer
    
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['vehicle', 'employee', 'location']
    ordering_fields = ['start_at', 'end_at']
    ordering = ['-start_at']


class VehicleMaintenanceViewSet(viewsets.ModelViewSet):
    """ViewSet for VehicleMaintenance operations"""
    queryset = VehicleMaintenance.objects.all().select_related(
        'vehicle',
        'performed_by_employee'
    )
    serializer_class = VehicleMaintenanceSerializer
    
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['vehicle', 'type', 'performed_by_employee']
    ordering_fields = ['performed_at', 'next_due_at', 'odometer_reading']
    ordering = ['-performed_at']


class VehicleServiceScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for VehicleServiceSchedule operations"""
    queryset = VehicleServiceSchedule.objects.all().select_related('vehicle')
    serializer_class = VehicleServiceScheduleSerializer
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['vehicle']


class VehicleProcurementViewSet(viewsets.ModelViewSet):
    """ViewSet for VehicleProcurement operations"""
    queryset = VehicleProcurement.objects.all().select_related(
        'vehicle',
        'order',
        'order_line'
    )
    serializer_class = VehicleProcurementSerializer
    
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['vehicle', 'order']
    ordering_fields = ['received_at']
    ordering = ['-received_at']