from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleModelViewSet,
    VehicleViewSet,
    VehicleAssignmentViewSet,
    VehicleMaintenanceViewSet,
    VehicleServiceScheduleViewSet,
    VehicleProcurementViewSet
)

router = DefaultRouter()
router.register(r'models', VehicleModelViewSet, basename='vehiclemodel')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'assignments', VehicleAssignmentViewSet, basename='vehicleassignment')
router.register(r'maintenance', VehicleMaintenanceViewSet, basename='vehiclemaintenance')
router.register(r'service-schedules', VehicleServiceScheduleViewSet, basename='vehicleservice')
router.register(r'procurements', VehicleProcurementViewSet, basename='vehicleprocurement')

urlpatterns = [
    path('', include(router.urls)),
]
