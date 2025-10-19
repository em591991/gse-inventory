"""
URL configuration for backend_app project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,   # ← added this
)

# Basic home page (health check)
def home(request):
    return HttpResponse("<h1>GSE Inventory API</h1><p>Backend is running successfully.</p>")

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),

    # API app routes
    path('api/', include('inventory.urls')),
    path('api/', include('vendors.urls')),
    path('api/', include('orders.urls')),
    path("api/", include("vendoritems.urls")),
     path("api/", include("workorders.urls")),

    # API documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/', include('vendor_imports.urls')),
]
