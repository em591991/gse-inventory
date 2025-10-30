from django.urls import path
from .views import VendorItemUploadView, ItemUploadView

urlpatterns = [
    path('vendor-items-upload/', VendorItemUploadView.as_view(), name='vendor-item-upload'),
    path('items-upload/', ItemUploadView.as_view(), name='item-upload'),
]

