"""
Stock Levels API - Calculate current inventory from movements
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Q, F, DecimalField, Case, When
from django.db.models.functions import Coalesce
from .models import InventoryMovement, Item
from locations.models import Location


class StockLevelsView(APIView):
    """
    GET /api/stock-levels/
    Returns current stock levels calculated from inventory movements
    """

    def get(self, request):
        # Calculate stock by summing movements
        # Positive movements: to_location (receiving)
        # Negative movements: from_location (issuing)

        stock_data = []

        # Get all movements and group by item, location, bin
        movements = InventoryMovement.objects.select_related(
            'item',
            'to_location',
            'from_location',
            'to_bin',
            'from_bin',
            'uom'
        ).all()

        # Build a dictionary to aggregate quantities
        stock_dict = {}

        for movement in movements:
            # Receiving (to_location)
            if movement.to_location:
                key = (
                    movement.item.item_id,
                    movement.to_location.location_id if movement.to_location else None,
                    movement.to_bin.bin_id if movement.to_bin else None
                )

                if key not in stock_dict:
                    stock_dict[key] = {
                        'item': movement.item,
                        'location': movement.to_location,
                        'bin': movement.to_bin,
                        'uom': movement.uom,
                        'qty': 0,
                        'total_cost': 0,
                        'movement_count': 0
                    }

                stock_dict[key]['qty'] += float(movement.qty or 0)
                stock_dict[key]['total_cost'] += float(movement.total_cost or 0)
                stock_dict[key]['movement_count'] += 1

            # Issuing (from_location)
            if movement.from_location:
                key = (
                    movement.item.item_id,
                    movement.from_location.location_id if movement.from_location else None,
                    movement.from_bin.bin_id if movement.from_bin else None
                )

                if key not in stock_dict:
                    stock_dict[key] = {
                        'item': movement.item,
                        'location': movement.from_location,
                        'bin': movement.from_bin,
                        'uom': movement.uom,
                        'qty': 0,
                        'total_cost': 0,
                        'movement_count': 0
                    }

                stock_dict[key]['qty'] -= float(movement.qty or 0)
                stock_dict[key]['total_cost'] -= float(movement.total_cost or 0)
                stock_dict[key]['movement_count'] += 1

        # Convert to list and filter out zero quantities
        for key, data in stock_dict.items():
            if data['qty'] != 0:  # Only show non-zero stock
                avg_cost = data['total_cost'] / data['qty'] if data['qty'] != 0 else 0
                total_value = data['total_cost']

                stock_data.append({
                    'item_id': str(data['item'].item_id),
                    'g_code': data['item'].g_code,
                    'item_name': data['item'].item_name,
                    'category': data['item'].category,
                    'manufacturer': data['item'].manufacturer,
                    'location_id': str(data['location'].location_id) if data['location'] else None,
                    'location_name': data['location'].name if data['location'] else None,
                    'bin_id': str(data['bin'].bin_id) if data['bin'] else None,
                    'bin_code': data['bin'].bin_code if data['bin'] else None,
                    'qty_on_hand': round(data['qty'], 4),
                    'uom': data['uom'].uom_code if data['uom'] else None,
                    'avg_cost': round(avg_cost, 2) if avg_cost else None,
                    'total_value': round(total_value, 2) if total_value else None,
                })

        # Sort by location, then item
        stock_data.sort(key=lambda x: (x['location_name'] or '', x['g_code']))

        return Response(stock_data)
