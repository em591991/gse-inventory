# vendoritems/urls.py
from django.urls import path
from vendoritems.views import VendorItemListCreateView, VendorItemExportView


urlpatterns = [
    path("vendoritems/", VendorItemListCreateView.as_view(), name="vendoritem-list"),
    path("vendoritems/export/", VendorItemExportView.as_view(), name="vendoritem-export"),
]
