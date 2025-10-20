# backend/shipments/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet, ShipmentLineViewSet

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet, basename='shipment')
router.register(r'shipment-lines', ShipmentLineViewSet, basename='shipmentline')

urlpatterns = [
    path('', include(router.urls)),
]