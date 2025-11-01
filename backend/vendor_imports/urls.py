from django.urls import path
from .views import VendorItemUploadView, ItemUploadView, ItemExportView, VendorItemExportView
from .views_templates import TemplateListView, TemplateDownloadView

urlpatterns = [
    path('vendor-items-upload/', VendorItemUploadView.as_view(), name='vendor-item-upload'),
    path('items-upload/', ItemUploadView.as_view(), name='item-upload'),
    path('csv-templates/', TemplateListView.as_view(), name='template-list'),
    path('csv-templates/<str:template_key>/', TemplateDownloadView.as_view(), name='template-download'),
    path('items-export/', ItemExportView.as_view(), name='item-export'),
    path('vendor-items-export/', VendorItemExportView.as_view(), name='vendor-item-export'),
]

