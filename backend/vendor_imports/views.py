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
import uuid


@extend_schema(
    tags=["Vendor CSV Upload"],
    summary="Upload or update vendor pricing via CSV file",
    description="""
    Upload a CSV file with the following columns:
    - **vendor_name** - Vendor name (must exist in database)
    - **item_sku** - Item G-code (must exist in Items table)
    - **price** - Unit price from vendor
    - **vendor_uom** (optional) - Vendor's unit of measure
    - **lead_time_days** (optional) - Lead time in days

    This endpoint will create or update VendorItem records.
    Note: The 'item_sku' column should contain your internal G-code, not the vendor's SKU.
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
                    item = Item.objects.get(g_code__iexact=item_sku.strip())
                except Vendor.DoesNotExist:
                    errors.append(f"Row {i}: Vendor '{vendor_name}' not found.")
                    continue
                except Item.DoesNotExist:
                    errors.append(f"Row {i}: Item with g_code '{item_sku}' not found.")
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


@extend_schema(
    tags=["Item CSV Upload"],
    summary="Upload or update items via CSV file",
    description="""
    Upload a CSV file with the following columns:
    - **g_code** (required) - Unique internal SKU
    - **item_name** (required)
    - **description** (optional)
    - **category** (optional) - Level 1 category
    - **subcategory** (optional) - Level 2 subcategory
    - **subcategory2** (optional) - Level 3 subcategory
    - **subcategory3** (optional) - Level 4 subcategory
    - **manufacturer** (optional)
    - **manufacturer_part_no** (optional)
    - **default_uom** (optional) - Unit of measure code

    This endpoint will create or update Item records.
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
class ItemUploadView(APIView):
    """
    POST /api/items-upload/
    Accepts CSV file with columns:
        g_code,item_name,description,category,subcategory,subcategory2,subcategory3,manufacturer,manufacturer_part_no,default_uom
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
                g_code = row.get('g_code')
                item_name = row.get('item_name')

                if not (g_code and item_name):
                    errors.append(f"Row {i}: missing required fields (g_code, item_name).")
                    continue

                # Get or create UOM if provided
                default_uom = None
                if row.get('default_uom'):
                    uom_code = row['default_uom'].strip()
                    default_uom, _ = UnitOfMeasure.objects.get_or_create(
                        uom_code=uom_code
                    )

                # Update or create item
                item, created_flag = Item.objects.update_or_create(
                    g_code=g_code.strip(),
                    defaults={
                        'item_name': item_name.strip(),
                        'description': row.get('description', '').strip(),
                        'category': row.get('category', '').strip() or None,
                        'subcategory': row.get('subcategory', '').strip() or None,
                        'subcategory2': row.get('subcategory2', '').strip() or None,
                        'subcategory3': row.get('subcategory3', '').strip() or None,
                        'manufacturer': row.get('manufacturer', '').strip() or None,
                        'manufacturer_part_no': row.get('manufacturer_part_no', '').strip() or None,
                        'default_uom': default_uom,
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
