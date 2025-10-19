from django.contrib import admin
from .models import Vendor

@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "email", "phone")
    list_filter = ("type",)
    search_fields = ("name", "email")
