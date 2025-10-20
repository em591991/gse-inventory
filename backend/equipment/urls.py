# backend/equipment/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EquipmentModelViewSet,
    EquipmentViewSet,
    EquipmentAssignmentViewSet,
    EquipmentMaintenanceViewSet,
    EquipmentCalibrationScheduleViewSet,
    EquipmentProcurementViewSet
)

router = DefaultRouter()
router.register(r'models', EquipmentModelViewSet, basename='equipmentmodel')
router.register(r'equipment', EquipmentViewSet, basename='equipment')
router.register(r'assignments', EquipmentAssignmentViewSet, basename='equipmentassignment')
router.register(r'maintenance', EquipmentMaintenanceViewSet, basename='equipmentmaintenance')
router.register(r'calibration-schedules', EquipmentCalibrationScheduleViewSet, basename='equipmentcalibration')
router.register(r'procurements', EquipmentProcurementViewSet, basename='equipmentprocurement')

urlpatterns = [
    path('', include(router.urls)),
]