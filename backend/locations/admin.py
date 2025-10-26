# locations/admin.py
from django.contrib import admin
from .models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['location_id', 'name', 'type', 'is_active']
    list_filter = ['type', 'is_active']
    search_fields = ['name', 'type']
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'type', 'is_active')
        }),
        ('System', {
            'fields': ('location_id',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['location_id']