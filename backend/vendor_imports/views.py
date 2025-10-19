from drf_spectacular.utils import extend_schema


import csv
import io
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from vendors.models import Vendor
from inventory.models import Item, UnitOfMeasure
from vendoritems.models import VendorItem


@extend_schema(
    tags=["Vendor CSV Upload"],
    summary="Upload or update vendor pricing via CSV file",
    description="""
    Upload a CSV file with the following columns:
    - **vendor_name**
    - **item_sku**
    - **price**
    - **vendor_uom** (optional)
    - **lead_time_days** (optional)

    This endpoint will create or update VendorItem records.
    """,
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "created": {"type": "integer"},
                "updated": {"type": "integer"},
                "errors": {
                    "type": "array",
                    "items": {"type": "string"}
                },
            },
        },
        400: {"description": "Bad request or missing file"},
    }
)




class VendorItemUploadView(APIView):
    """
    POST /api/vendor-items/upload/
    Accepts CSV file with columns:
        vendor_name,item_sku,price,vendor_uom,lead_time_days
    """

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        decoded_file = file_obj.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        created, updated, errors = 0, 0, []

        with transaction.atomic():
            for i, row in enumerate(reader, start=1):
                vendor_name = row.get('vendor_name')
                item_sku = row.get('item_sku')
                price = row.get('price')

                if not (vendor_name and item_sku and price):
                    errors.append(f"Row {i}: missing required fields.")
                    continue

                try:
                    vendor = Vendor.objects.get(name__iexact=vendor_name.strip())
                    item = Item.objects.get(sku__iexact=item_sku.strip())
                except Vendor.DoesNotExist:
                    errors.append(f"Row {i}: Vendor '{vendor_name}' not found.")
                    continue
                except Item.DoesNotExist:
                    errors.append(f"Row {i}: Item '{item_sku}' not found.")
                    continue

                vendor_uom = None
                if row.get('vendor_uom'):
                    vendor_uom, _ = UnitOfMeasure.objects.get_or_create(
                        uom_code=row['vendor_uom'].strip()
                    )

                lead_time = int(row['lead_time_days']) if row.get('lead_time_days') else 0
                price = float(price)

                vendor_item, created_flag = VendorItem.objects.update_or_create(
                    vendor=vendor,
                    item=item,
                    defaults={
                        'price': price,
                        'vendor_uom': vendor_uom,
                        'lead_time_days': lead_time,
                    }
                )

                if created_flag:
                    created += 1
                else:
                    updated += 1

        return Response({
            "message": "Upload complete",
            "created": created,
            "updated": updated,
            "errors": errors,
        })
