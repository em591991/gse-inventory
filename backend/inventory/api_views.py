# backend/inventory/api_views.py
# REST API endpoints for FIFO inventory management

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from decimal import Decimal
from django.shortcuts import get_object_or_404

from .models import Item, Location, Bin, InventoryLayer, PendingAllocation
from .services import FIFOInventoryService
from orders.models import Order, OrderLine
from jobs.models import WorkOrder


@api_view(['POST'])
def receive_inventory(request):
    """
    Receive inventory into a location.
    Creates inventory layer and movement records.
    
    POST /api/inventory/receive/
    
    Request Body:
    {
        "item_id": "uuid",
        "location_id": "uuid",
        "bin_id": "uuid" (optional),
        "qty": "100.0",
        "unit_cost": "5.50",
        "purchase_order_id": "uuid" (optional),
        "reference": "PO-2025-001" (optional)
    }
    
    Response:
    {
        "success": true,
        "layer": {
            "layer_id": "uuid",
            "qty_remaining": 100.0,
            "unit_cost": 5.50,
            "total_value": 550.00
        },
        "movement_id": "uuid"
    }
    """
    try:
        # Validate required fields
        item_id = request.data.get('item_id')
        location_id = request.data.get('location_id')
        qty = request.data.get('qty')
        unit_cost = request.data.get('unit_cost')
        
        if not all([item_id, location_id, qty, unit_cost]):
            return Response(
                {'error': 'Missing required fields: item_id, location_id, qty, unit_cost'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get objects
        item = get_object_or_404(Item, item_id=item_id)
        location = get_object_or_404(Location, location_id=location_id)
        
        bin_id = request.data.get('bin_id')
        bin_obj = get_object_or_404(Bin, bin_id=bin_id) if bin_id else None
        
        po_id = request.data.get('purchase_order_id')
        purchase_order = get_object_or_404(Order, order_id=po_id) if po_id else None
        
        # Receive inventory
        layer, movement = FIFOInventoryService.receive_inventory(
            item=item,
            location=location,
            qty=Decimal(str(qty)),
            unit_cost=Decimal(str(unit_cost)),
            bin=bin_obj,
            purchase_order=purchase_order,
            reference=request.data.get('reference', '')
        )
        
        return Response({
            'success': True,
            'layer': {
                'layer_id': str(layer.layer_id),
                'qty_remaining': float(layer.qty_remaining),
                'unit_cost': float(layer.unit_cost),
                'total_value': float(layer.total_value),
                'received_at': layer.received_at.isoformat()
            },
            'movement_id': str(movement.id)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
def get_available_quantity(request, item_id, location_id):
    """
    Get available quantity for an item at a location.
    
    GET /api/inventory/available/{item_id}/{location_id}/
    
    Optional query params:
    - bin_id: Filter by specific bin
    
    Response:
    {
        "item_id": "uuid",
        "item_code": "GSE-12345",
        "location_id": "uuid",
        "location_name": "Main Warehouse",
        "available_qty": 150.0,
        "bin_id": "uuid" (if filtered)
    }
    """
    try:
        item = get_object_or_404(Item, item_id=item_id)
        location = get_object_or_404(Location, location_id=location_id)
        
        bin_id = request.query_params.get('bin_id')
        bin_obj = get_object_or_404(Bin, bin_id=bin_id) if bin_id else None
        
        available = FIFOInventoryService.get_available_quantity(
            item=item,
            location=location,
            bin=bin_obj
        )
        
        return Response({
            'item_id': str(item.item_id),
            'item_code': item.g_code,
            'item_name': item.item_name,
            'location_id': str(location.location_id),
            'location_name': location.name,
            'available_qty': float(available),
            'bin_id': str(bin_obj.bin_id) if bin_obj else None
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
def get_inventory_layers(request, item_id, location_id):
    """
    Get cost layer breakdown for an item at a location.
    Shows FIFO layers with quantities and costs.
    
    GET /api/inventory/layers/{item_id}/{location_id}/
    
    Optional query params:
    - bin_id: Filter by specific bin
    
    Response:
    {
        "item_id": "uuid",
        "item_code": "GSE-12345",
        "location_id": "uuid",
        "location_name": "Main Warehouse",
        "total_qty": 200.0,
        "total_value": 1050.00,
        "layers": [
            {
                "layer_id": "uuid",
                "qty_remaining": 100.0,
                "unit_cost": 5.00,
                "total_value": 500.00,
                "received_at": "2025-01-22T10:30:00Z",
                "purchase_order_id": "uuid",
                "reference": "PO-2025-001"
            },
            ...
        ]
    }
    """
    try:
        item = get_object_or_404(Item, item_id=item_id)
        location = get_object_or_404(Location, location_id=location_id)
        
        bin_id = request.query_params.get('bin_id')
        bin_obj = get_object_or_404(Bin, bin_id=bin_id) if bin_id else None
        
        layers = FIFOInventoryService.get_layer_breakdown(
            item=item,
            location=location,
            bin=bin_obj
        )
        
        total_qty = sum(layer['qty_remaining'] for layer in layers)
        total_value = sum(layer['total_value'] for layer in layers)
        
        return Response({
            'item_id': str(item.item_id),
            'item_code': item.g_code,
            'item_name': item.item_name,
            'location_id': str(location.location_id),
            'location_name': location.name,
            'total_qty': float(total_qty),
            'total_value': float(total_value),
            'layers': layers
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
def allocate_inventory(request):
    """
    Allocate inventory using FIFO method.
    Can allocate to work order, order, or general use.
    Supports negative inventory (creates pending allocation).
    
    POST /api/inventory/allocate/
    
    Request Body:
    {
        "item_id": "uuid",
        "location_id": "uuid",
        "bin_id": "uuid" (optional),
        "qty": "50.0",
        "work_order_id": "uuid" (optional),
        "order_id": "uuid" (optional),
        "order_line_id": "uuid" (optional),
        "reference": "Job-123",
        "note": "Materials for 2nd floor",
        "allow_negative": true
    }
    
    Response:
    {
        "success": true,
        "allocated_qty": 50.0,
        "total_cost": 250.00,
        "allocations": [
            {
                "layer_id": "uuid",
                "qty": 50.0,
                "unit_cost": 5.00,
                "total_cost": 250.00,
                "received_at": "2025-01-22T10:30:00Z"
            }
        ],
        "pending_allocation": null,
        "shortage": 0,
        "warning": null
    }
    """
    try:
        # Validate required fields
        item_id = request.data.get('item_id')
        location_id = request.data.get('location_id')
        qty = request.data.get('qty')
        
        if not all([item_id, location_id, qty]):
            return Response(
                {'error': 'Missing required fields: item_id, location_id, qty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get objects
        item = get_object_or_404(Item, item_id=item_id)
        location = get_object_or_404(Location, location_id=location_id)
        
        bin_id = request.data.get('bin_id')
        bin_obj = get_object_or_404(Bin, bin_id=bin_id) if bin_id else None
        
        work_order_id = request.data.get('work_order_id')
        work_order = get_object_or_404(WorkOrder, work_order_id=work_order_id) if work_order_id else None
        
        order_id = request.data.get('order_id')
        order = get_object_or_404(Order, order_id=order_id) if order_id else None
        
        order_line_id = request.data.get('order_line_id')
        order_line = get_object_or_404(OrderLine, order_line_id=order_line_id) if order_line_id else None
        
        # Allocate inventory
        result = FIFOInventoryService.allocate_inventory_fifo(
            item=item,
            location=location,
            qty_needed=Decimal(str(qty)),
            bin=bin_obj,
            work_order=work_order,
            order=order,
            order_line=order_line,
            reference=request.data.get('reference', ''),
            note=request.data.get('note', ''),
            allow_negative=request.data.get('allow_negative', True)
        )
        
        # Format response
        response_data = {
            'success': result['success'],
            'allocated_qty': result['allocated_qty'],
            'total_cost': result['total_cost'],
            'allocations': result['allocations'],
            'shortage': result.get('shortage', 0)
        }
        
        # Add pending allocation info if exists
        if result.get('pending_allocation'):
            pending = result['pending_allocation']
            response_data['pending_allocation'] = {
                'pending_allocation_id': str(pending.pending_allocation_id),
                'qty': float(pending.qty),
                'estimated_unit_cost': float(pending.estimated_unit_cost or 0),
                'estimated_total_cost': float(pending.estimated_total_cost or 0),
                'status': pending.status
            }
        else:
            response_data['pending_allocation'] = None
        
        # Add warning if exists
        response_data['warning'] = result.get('warning')
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def estimate_allocation_cost(request):
    """
    Estimate cost of allocation without actually allocating.
    Useful for showing cost preview in UI.
    
    POST /api/inventory/estimate-cost/
    
    Request Body:
    {
        "item_id": "uuid",
        "location_id": "uuid",
        "qty": "50.0"
    }
    
    Response:
    {
        "item_id": "uuid",
        "item_code": "GSE-12345",
        "qty_requested": 50.0,
        "available_qty": 150.0,
        "sufficient": true,
        "estimated_cost": 250.00,
        "cost_breakdown": [
            {
                "layer_id": "uuid",
                "qty": 50.0,
                "unit_cost": 5.00,
                "total_cost": 250.00,
                "received_at": "2025-01-22T10:30:00Z"
            }
        ],
        "shortage": 0,
        "shortage_estimated_cost": 0
    }
    """
    try:
        item_id = request.data.get('item_id')
        location_id = request.data.get('location_id')
        qty = request.data.get('qty')
        
        if not all([item_id, location_id, qty]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item = get_object_or_404(Item, item_id=item_id)
        location = get_object_or_404(Location, location_id=location_id)
        qty_decimal = Decimal(str(qty))
        
        # Get available quantity
        available = FIFOInventoryService.get_available_quantity(item, location)
        
        # Get layer breakdown
        layers = FIFOInventoryService.get_layer_breakdown(item, location)
        
        # Calculate cost estimate
        cost_breakdown = []
        remaining = qty_decimal
        total_cost = Decimal('0')
        
        for layer in layers:
            if remaining <= 0:
                break
            
            qty_from_layer = min(Decimal(str(layer['qty_remaining'])), remaining)
            cost_from_layer = qty_from_layer * Decimal(str(layer['unit_cost']))
            
            cost_breakdown.append({
                'layer_id': layer['layer_id'],
                'qty': float(qty_from_layer),
                'unit_cost': layer['unit_cost'],
                'total_cost': float(cost_from_layer),
                'received_at': layer['received_at']
            })
            
            total_cost += cost_from_layer
            remaining -= qty_from_layer
        
        # Calculate shortage if any
        shortage = float(max(Decimal('0'), remaining))
        shortage_cost = 0
        
        if shortage > 0:
            # Use current replacement cost or last layer cost
            est_cost = item.current_replacement_cost
            if not est_cost and layers:
                est_cost = Decimal(str(layers[-1]['unit_cost']))
            if est_cost:
                shortage_cost = float(Decimal(str(shortage)) * est_cost)
                total_cost += Decimal(str(shortage_cost))
        
        return Response({
            'item_id': str(item.item_id),
            'item_code': item.g_code,
            'item_name': item.item_name,
            'qty_requested': float(qty_decimal),
            'available_qty': float(available),
            'sufficient': available >= qty_decimal,
            'estimated_cost': float(total_cost),
            'cost_breakdown': cost_breakdown,
            'shortage': shortage,
            'shortage_estimated_cost': shortage_cost
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
def get_pending_allocations(request):
    """
    Get list of pending allocations (negative inventory items).
    
    GET /api/inventory/pending-allocations/
    
    Optional query params:
    - item_id: Filter by item
    - location_id: Filter by location
    - work_order_id: Filter by work order
    - status: Filter by status (AWAITING_RECEIPT, FULFILLED, etc.)
    
    Response:
    {
        "count": 5,
        "pending_allocations": [
            {
                "pending_allocation_id": "uuid",
                "item_id": "uuid",
                "item_code": "GSE-12345",
                "item_name": "Wire Nuts",
                "location_id": "uuid",
                "location_name": "Main Warehouse",
                "qty": 200.0,
                "estimated_unit_cost": 5.50,
                "estimated_total_cost": 1100.00,
                "status": "AWAITING_RECEIPT",
                "work_order_id": "uuid",
                "created_at": "2025-01-22T10:30:00Z"
            },
            ...
        ]
    }
    """
    try:
        # Start with all pending allocations
        queryset = PendingAllocation.objects.select_related(
            'item', 'location', 'work_order'
        ).all()
        
        # Apply filters
        item_id = request.query_params.get('item_id')
        if item_id:
            queryset = queryset.filter(item__item_id=item_id)
        
        location_id = request.query_params.get('location_id')
        if location_id:
            queryset = queryset.filter(location__location_id=location_id)
        
        work_order_id = request.query_params.get('work_order_id')
        if work_order_id:
            queryset = queryset.filter(work_order__work_order_id=work_order_id)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Default to only unfulfilled
        if not status_filter:
            queryset = queryset.exclude(status=PendingAllocation.Status.FULFILLED)
        
        # Order by created date
        queryset = queryset.order_by('-created_at')
        
        # Serialize
        allocations = []
        for pa in queryset:
            allocations.append({
                'pending_allocation_id': str(pa.pending_allocation_id),
                'item_id': str(pa.item.item_id),
                'item_code': pa.item.g_code,
                'item_name': pa.item.item_name,
                'location_id': str(pa.location.location_id),
                'location_name': pa.location.name,
                'qty': float(pa.qty),
                'estimated_unit_cost': float(pa.estimated_unit_cost or 0),
                'estimated_total_cost': float(pa.estimated_total_cost or 0),
                'status': pa.status,
                'work_order_id': str(pa.work_order.work_order_id) if pa.work_order else None,
                'created_at': pa.created_at.isoformat(),
                'fulfilled_at': pa.fulfilled_at.isoformat() if pa.fulfilled_at else None,
                'notes': pa.notes
            })
        
        return Response({
            'count': len(allocations),
            'pending_allocations': allocations
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
def transfer_inventory(request):
    """
    Transfer inventory between locations using FIFO.
    
    POST /api/inventory/transfer/
    
    Request Body:
    {
        "item_id": "uuid",
        "from_location_id": "uuid",
        "to_location_id": "uuid",
        "from_bin_id": "uuid" (optional),
        "to_bin_id": "uuid" (optional),
        "qty": "50.0",
        "reference": "Transfer to Truck #5",
        "note": "For job site"
    }
    
    Response:
    {
        "success": true,
        "qty_transferred": 50.0,
        "total_cost": 250.00,
        "allocations": [...],
        "from_movements": [...],
        "to_movements": [...]
    }
    """
    try:
        item_id = request.data.get('item_id')
        from_location_id = request.data.get('from_location_id')
        to_location_id = request.data.get('to_location_id')
        qty = request.data.get('qty')
        
        if not all([item_id, from_location_id, to_location_id, qty]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item = get_object_or_404(Item, item_id=item_id)
        from_location = get_object_or_404(Location, location_id=from_location_id)
        to_location = get_object_or_404(Location, location_id=to_location_id)
        
        from_bin_id = request.data.get('from_bin_id')
        from_bin = get_object_or_404(Bin, bin_id=from_bin_id) if from_bin_id else None
        
        to_bin_id = request.data.get('to_bin_id')
        to_bin = get_object_or_404(Bin, bin_id=to_bin_id) if to_bin_id else None
        
        result = FIFOInventoryService.transfer_inventory(
            item=item,
            from_location=from_location,
            to_location=to_location,
            qty=Decimal(str(qty)),
            from_bin=from_bin,
            to_bin=to_bin,
            reference=request.data.get('reference', ''),
            note=request.data.get('note', '')
        )
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )