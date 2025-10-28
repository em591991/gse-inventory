# backend/rfqs/urls.py
"""
URL patterns for RFQ API endpoints
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RFQViewSet,
    RFQLineViewSet,
    RFQVendorViewSet,
    VendorQuoteViewSet,
    ReplenishmentOrderViewSet,
    ReplenishmentLineViewSet,
)

router = DefaultRouter()
router.register(r'rfqs', RFQViewSet, basename='rfq')
router.register(r'rfq-lines', RFQLineViewSet, basename='rfqline')
router.register(r'rfq-vendors', RFQVendorViewSet, basename='rfqvendor')
router.register(r'vendor-quotes', VendorQuoteViewSet, basename='vendorquote')
router.register(r'replenishments', ReplenishmentOrderViewSet, basename='replenishment')
router.register(r'replenishment-lines', ReplenishmentLineViewSet, basename='replenishmentline')

urlpatterns = [
    path('', include(router.urls)),
]
