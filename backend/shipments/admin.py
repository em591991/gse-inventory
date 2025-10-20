from django.contrib import admin
from shipments.models import Shipment, ShipmentLine


class ShipmentLineInline(admin.TabularInline):
    model = ShipmentLine
    extra = 1
    fields = ('order_line', 'qty_to_ship', 'qty_picked', 'notes')


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('shipment_id', 'order', 'status', 'created_at', 'staged_at', 'picked_up_at')
    list_filter = ('status', 'created_at')
    search_fields = ('shipment_id', 'order__id', 'notes')
    inlines = [ShipmentLineInline]
    readonly_fields = ('shipment_id', 'created_at')


@admin.register(ShipmentLine)
class ShipmentLineAdmin(admin.ModelAdmin):
    list_display = ('shipment_line_id', 'shipment', 'order_line', 'qty_to_ship', 'qty_picked')
    search_fields = ('shipment_line_id', 'shipment__shipment_id')
    readonly_fields = ('shipment_line_id',)

