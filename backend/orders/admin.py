from django.contrib import admin
from .models import Order, OrderLine, SalesOrderInfo


class OrderLineInline(admin.TabularInline):
    model = OrderLine
    extra = 1
    fields = ['line_no', 'item', 'purchase_category', 'description', 'qty', 'uom', 'price_each']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'order_type', 'order_status', 'vendor', 'customer', 'ordered_at']
    list_filter = ['order_type', 'order_status', 'ordered_at']
    search_fields = ['order_id', 'notes']
    inlines = [OrderLineInline]
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('order_type', 'order_status', 'ordered_at', 'notes')
        }),
        ('References', {
            'fields': ('work_order', 'job', 'customer', 'vendor')
        }),
        ('Transfer Info', {
            'fields': ('from_location', 'to_location'),
            'classes': ('collapse',)
        }),
    )


@admin.register(OrderLine)
class OrderLineAdmin(admin.ModelAdmin):
    list_display = ['order', 'line_no', 'item', 'purchase_category', 'qty', 'price_each']
    list_filter = ['purchase_category']
    search_fields = ['description', 'g_code']


@admin.register(SalesOrderInfo)
class SalesOrderInfoAdmin(admin.ModelAdmin):
    list_display = ['order', 'ship_to_name', 'contact_name']