from django.contrib import admin
from .models import Manufacturer, ManufacturerPart, ItemManufacturerPart

@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    list_display = ['name', 'website', 'support_email']
    search_fields = ['name']

@admin.register(ManufacturerPart)
class ManufacturerPartAdmin(admin.ModelAdmin):
    list_display = ['part_number', 'manufacturer', 'description', 'upc']
    list_filter = ['manufacturer']
    search_fields = ['part_number', 'description', 'upc']

@admin.register(ItemManufacturerPart)
class ItemManufacturerPartAdmin(admin.ModelAdmin):
    list_display = ['item', 'mfr_part', 'is_primary']
    list_filter = ['is_primary']