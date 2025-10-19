from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VendorViewSet, VendorDetailView, VendorListView

router = DefaultRouter()
router.register(r'vendors', VendorViewSet)

urlpatterns = [
    # List and Create vendors
    path('vendors/', VendorViewSet.as_view({'get': 'list', 'post': 'create'}), name='vendor-list'),
    path('vendors/', VendorListView.as_view(), name='vendor-list'),
    path('vendors/<int:id>/detail/', VendorDetailView.as_view(), name='vendor-detail-view'),
    # Retrieve a single vendor (detail)
    path('vendors/<int:id>/detail/', VendorDetailView.as_view(), name='vendor-detail'),
]