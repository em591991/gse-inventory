from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, UnitOfMeasureViewSet
from vendoritems.views import VendorItemListCreateView

router = DefaultRouter()
router.register(r'items', ItemViewSet)
router.register(r'units', UnitOfMeasureViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('vendoritems/', VendorItemListCreateView.as_view(), name='vendoritem-list-create'),
]
