from django.urls import path
from .views import VendorItemUploadView

urlpatterns = [
    path('vendor-items-upload/', VendorItemUploadView.as_view(), name='vendor-item-upload'),
]

