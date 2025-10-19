

# vendoritems/views.py
from rest_framework import generics
from .models import VendorItem
from .serializers import VendorItemSerializer
from rest_framework.request import Request
from django.db.models import Q
from django.http import HttpResponse
import csv



class VendorItemListCreateView(generics.ListCreateAPIView):
    queryset = VendorItem.objects.select_related("vendor", "item", "vendor_uom")
    serializer_class = VendorItemSerializer

    def get_queryset(self):
        qs = VendorItem.objects.select_related("vendor", "item", "vendor_uom").all()
        req: Request = self.request

        vendor_id = req.query_params.get("vendor")
        item_id = req.query_params.get("item")
        uom_code = req.query_params.get("vendor_uom")
        min_price = req.query_params.get("min_price")
        max_price = req.query_params.get("max_price")
        search = req.query_params.get("search")
        ordering = req.query_params.get("ordering")

        if vendor_id:
            qs = qs.filter(vendor_id=vendor_id)
        if item_id:
            qs = qs.filter(item_id=item_id)
        if uom_code:
            qs = qs.filter(vendor_uom__uom_code=uom_code)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        if search:
            qs = qs.filter(
                Q(vendor_sku__icontains=search)
                | Q(item__name__icontains=search)
                | Q(vendor__name__icontains=search)
            )
        if ordering in ("price", "-price", "id", "-id"):
            qs = qs.order_by(ordering)

        return qs


class VendorItemExportView(generics.GenericAPIView):
    queryset = VendorItem.objects.select_related("vendor", "item", "vendor_uom")

    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="vendor_items.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Vendor",
            "Item",
            "Vendor SKU",
            "Vendor UoM",
            "Price",
            "Conversion Factor",
            "Lead Time (days)",
            "Last Updated",
        ])

        for vi in self.get_queryset():
            writer.writerow([
                vi.vendor.name if vi.vendor else "",
                vi.item.name if vi.item else "",
                vi.vendor_sku or "",
                vi.vendor_uom.uom_code if vi.vendor_uom else "",
                vi.price,
                vi.conversion_factor,
                vi.lead_time_days or "",
                vi.last_updated.strftime("%Y-%m-%d %H:%M:%S"),
            ])

        return response