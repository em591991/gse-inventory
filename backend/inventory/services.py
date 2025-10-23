# backend/inventory/services.py
# FIFO Inventory Service - Core Business Logic

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from typing import Dict, List, Optional, Tuple

from .models import (
    Item,
    Location,
    Bin,
    InventoryLayer,
    InventoryMovement,
    PendingAllocation
)


class FIFOInventoryService:
    """
    Service for managing FIFO inventory allocation.
    Handles receiving inventory, consuming it in FIFO order,
    and managing negative inventory with pending allocations.
    """
    
    @staticmethod
    @transaction.atomic
    def receive_inventory(
        item: Item,
        location: Location,
        qty: Decimal,
        unit_cost: Decimal,
        bin: Optional[Bin] = None,
        purchase_order = None,
        reference: str = ""
    ) -> Tuple[InventoryLayer, InventoryMovement]:
        """
        Receive inventory into warehouse.
        Creates a new inventory layer and movement record.
        
        Args:
            item: Item instance
            location: Location instance
            qty: Decimal quantity received
            unit_cost: Decimal cost per unit
            bin: Bin instance (optional)
            purchase_order: Order instance (optional)
            reference: String reference (optional)
        
        Returns:
            tuple: (InventoryLayer, InventoryMovement)
        
        Example:
            layer, movement = FIFOInventoryService.receive_inventory(
                item=wire_nuts,
                location=warehouse,
                qty=Decimal('500'),
                unit_cost=Decimal('5.50'),
                purchase_order=po
            )
        """
        # Create new inventory layer
        layer = InventoryLayer.objects.create(
            item=item,
            location=location,
            bin=bin,
            qty_remaining=qty,
            unit_cost=unit_cost,
            received_at=timezone.now(),
            purchase_order=purchase_order,
            reference=reference
        )
        
        # Create movement record
        movement = InventoryMovement.objects.create(
            item=item,
            qty=qty,
            unit_cost=unit_cost,
            total_cost=qty * unit_cost,
            to_location=location,
            to_bin=bin,
            order=purchase_order,
            moved_at=timezone.now(),
            reference=reference,
            note=f"Received into inventory @ ${unit_cost}/unit"
        )
        
        # Update item's current replacement cost
        item.update_replacement_cost(unit_cost)
        
        # Check for pending allocations to fulfill
        FIFOInventoryService._auto_fulfill_pending_allocations(item, location)
        
        return layer, movement
    
    @staticmethod
    def get_available_quantity(
        item: Item,
        location: Location,
        bin: Optional[Bin] = None
    ) -> Decimal:
        """
        Get total available quantity for an item at a location.
        
        Args:
            item: Item instance
            location: Location instance
            bin: Bin instance (optional)
        
        Returns:
            Decimal: Total available quantity
        """
        filters = {
            'item': item,
            'location': location,
            'qty_remaining__gt': 0
        }
        if bin:
            filters['bin'] = bin
        
        layers = InventoryLayer.objects.filter(**filters)
        total = sum(layer.qty_remaining for layer in layers)
        return Decimal(str(total))
    
    @staticmethod
    def get_layer_breakdown(
        item: Item,
        location: Location,
        bin: Optional[Bin] = None
    ) -> List[Dict]:
        """
        Get breakdown of inventory layers with costs.
        Useful for displaying in UI.
        
        Returns:
            list: List of dicts with layer info
        """
        filters = {
            'item': item,
            'location': location,
            'qty_remaining__gt': 0
        }
        if bin:
            filters['bin'] = bin
        
        layers = InventoryLayer.objects.filter(**filters).order_by('received_at')
        
        return [{
            'layer_id': str(layer.layer_id),
            'qty_remaining': float(layer.qty_remaining),
            'unit_cost': float(layer.unit_cost),
            'total_value': float(layer.qty_remaining * layer.unit_cost),
            'received_at': layer.received_at.isoformat(),
            'purchase_order_id': str(layer.purchase_order.order_id) if layer.purchase_order else None,
            'reference': layer.reference
        } for layer in layers]
    
    @staticmethod
    @transaction.atomic
    def allocate_inventory_fifo(
        item: Item,
        location: Location,
        qty_needed: Decimal,
        bin: Optional[Bin] = None,
        work_order = None,
        order = None,
        order_line = None,
        reference: str = "",
        note: str = "",
        allow_negative: bool = True
    ) -> Dict:
        """
        Allocate inventory using FIFO method.
        Pulls from oldest layers first until qty_needed is satisfied.
        If insufficient inventory and allow_negative=True, creates pending allocation.
        
        Args:
            item: Item instance
            location: Location instance
            qty_needed: Decimal quantity to allocate
            bin: Bin instance (optional)
            work_order: WorkOrder instance (optional, for job costing)
            order: Order instance (optional)
            order_line: OrderLine instance (optional)
            reference: String reference
            note: String note
            allow_negative: Allow allocation when insufficient stock
        
        Returns:
            dict: {
                'success': bool,
                'allocated_qty': Decimal,
                'total_cost': Decimal,
                'movements': [InventoryMovement instances],
                'allocations': [allocation details],
                'pending_allocation': PendingAllocation or None,
                'shortage': Decimal (if negative inventory)
            }
        
        Raises:
            ValueError: If insufficient inventory and allow_negative=False
        """
        # Get layers in FIFO order (oldest first)
        filters = {
            'item': item,
            'location': location,
            'qty_remaining__gt': 0
        }
        if bin:
            filters['bin'] = bin
        
        layers = InventoryLayer.objects.filter(**filters).order_by('received_at')
        
        # Check available quantity
        available = sum(layer.qty_remaining for layer in layers)
        
        if available < qty_needed:
            if not allow_negative:
                raise ValueError(
                    f"Insufficient inventory. Requested: {qty_needed}, "
                    f"Available: {available}"
                )
            # Handle negative inventory
            return FIFOInventoryService._allocate_with_negative_inventory(
                item=item,
                location=location,
                qty_needed=qty_needed,
                available_qty=available,
                layers=layers,
                bin=bin,
                work_order=work_order,
                order=order,
                order_line=order_line,
                reference=reference,
                note=note
            )
        
        # Sufficient inventory - allocate normally
        allocations = []
        movements = []
        remaining = Decimal(str(qty_needed))
        total_cost = Decimal('0')
        
        for layer in layers:
            if remaining <= 0:
                break
            
            # Determine how much to take from this layer
            qty_from_layer = min(layer.qty_remaining, remaining)
            cost_from_layer = qty_from_layer * layer.unit_cost
            
            # Update layer
            layer.qty_remaining -= qty_from_layer
            layer.save()
            
            # Create movement record (negative qty = consumption)
            movement = InventoryMovement.objects.create(
                item=item,
                qty=-qty_from_layer,  # Negative for consumption
                unit_cost=layer.unit_cost,
                total_cost=cost_from_layer,
                from_location=location,
                from_bin=bin,
                order=order,
                order_line=order_line,
                work_order=work_order,
                moved_at=timezone.now(),
                reference=reference,
                note=note or f"FIFO allocation from layer {layer.layer_id}",
                is_estimated=False
            )
            movements.append(movement)
            
            # Track allocation details
            allocations.append({
                'layer_id': str(layer.layer_id),
                'qty': float(qty_from_layer),
                'unit_cost': float(layer.unit_cost),
                'total_cost': float(cost_from_layer),
                'received_at': layer.received_at.isoformat()
            })
            
            total_cost += cost_from_layer
            remaining -= qty_from_layer
        
        return {
            'success': True,
            'allocated_qty': float(qty_needed),
            'total_cost': float(total_cost),
            'movements': movements,
            'allocations': allocations,
            'pending_allocation': None,
            'shortage': 0
        }
    
    @staticmethod
    @transaction.atomic
    def _allocate_with_negative_inventory(
        item: Item,
        location: Location,
        qty_needed: Decimal,
        available_qty: Decimal,
        layers,
        bin: Optional[Bin] = None,
        work_order = None,
        order = None,
        order_line = None,
        reference: str = "",
        note: str = ""
    ) -> Dict:
        """
        Handle allocation when insufficient inventory.
        Allocates what's available, then creates pending allocation for shortage.
        """
        movements = []
        allocations = []
        total_cost = Decimal('0')
        
        # Allocate what we have
        if available_qty > 0:
            for layer in layers:
                qty_from_layer = layer.qty_remaining
                cost_from_layer = qty_from_layer * layer.unit_cost
                
                # Update layer
                layer.qty_remaining = Decimal('0')
                layer.save()
                
                # Create movement
                movement = InventoryMovement.objects.create(
                    item=item,
                    qty=-qty_from_layer,
                    unit_cost=layer.unit_cost,
                    total_cost=cost_from_layer,
                    from_location=location,
                    from_bin=bin,
                    order=order,
                    order_line=order_line,
                    work_order=work_order,
                    moved_at=timezone.now(),
                    reference=reference,
                    note=note,
                    is_estimated=False
                )
                movements.append(movement)
                
                allocations.append({
                    'layer_id': str(layer.layer_id),
                    'qty': float(qty_from_layer),
                    'unit_cost': float(layer.unit_cost),
                    'total_cost': float(cost_from_layer),
                    'received_at': layer.received_at.isoformat()
                })
                
                total_cost += cost_from_layer
        
        # Create pending allocation for shortage
        shortage = qty_needed - available_qty
        
        # Use current replacement cost as estimate
        estimated_cost = item.current_replacement_cost or Decimal('0')
        if not estimated_cost and layers.exists():
            # Use last layer's cost as estimate
            estimated_cost = layers.last().unit_cost
        
        pending = PendingAllocation.objects.create(
            item=item,
            location=location,
            work_order=work_order,
            order=order,
            qty=shortage,
            estimated_unit_cost=estimated_cost,
            estimated_total_cost=shortage * estimated_cost,
            status=PendingAllocation.Status.AWAITING_RECEIPT,
            notes=note or f"Shortage from allocation: {reference}"
        )
        
        # Create estimated movement for the shortage
        estimated_movement = InventoryMovement.objects.create(
            item=item,
            qty=-shortage,
            unit_cost=estimated_cost,
            total_cost=shortage * estimated_cost,
            from_location=location,
            from_bin=bin,
            order=order,
            order_line=order_line,
            work_order=work_order,
            moved_at=timezone.now(),
            reference=reference,
            note=f"ESTIMATED - Pending fulfillment: {pending.pending_allocation_id}",
            is_estimated=True
        )
        movements.append(estimated_movement)
        
        total_cost += shortage * estimated_cost
        
        return {
            'success': True,
            'allocated_qty': float(qty_needed),
            'total_cost': float(total_cost),
            'movements': movements,
            'allocations': allocations,
            'pending_allocation': pending,
            'shortage': float(shortage),
            'warning': f"Insufficient inventory. Allocated {available_qty}, pending {shortage} units."
        }
    
    @staticmethod
    @transaction.atomic
    def _auto_fulfill_pending_allocations(item: Item, location: Location):
        """
        Automatically fulfill pending allocations when inventory is received.
        Called internally after receiving inventory.
        """
        pending = PendingAllocation.objects.filter(
            item=item,
            location=location,
            status=PendingAllocation.Status.AWAITING_RECEIPT
        ).order_by('created_at')
        
        for allocation in pending:
            available = FIFOInventoryService.get_available_quantity(item, location)
            
            if available >= allocation.qty:
                # Fulfill this pending allocation
                result = FIFOInventoryService.allocate_inventory_fifo(
                    item=item,
                    location=location,
                    qty_needed=allocation.qty,
                    work_order=allocation.work_order,
                    order=allocation.order,
                    reference=f"Auto-fulfill pending: {allocation.pending_allocation_id}",
                    note=f"Fulfilled pending allocation from {allocation.created_at}",
                    allow_negative=False
                )
                
                # Update pending allocation status
                allocation.status = PendingAllocation.Status.FULFILLED
                allocation.fulfilled_at = timezone.now()
                allocation.save()
                
                # Update estimated movement with actual cost
                estimated_movements = InventoryMovement.objects.filter(
                    item=item,
                    work_order=allocation.work_order,
                    is_estimated=True,
                    qty=-allocation.qty
                )
                
                if estimated_movements.exists():
                    estimated = estimated_movements.first()
                    actual_cost = Decimal(str(result['total_cost']))
                    variance = actual_cost - (estimated.total_cost or Decimal('0'))
                    
                    estimated.is_estimated = False
                    estimated.unit_cost = Decimal(str(result['total_cost'])) / allocation.qty
                    estimated.total_cost = actual_cost
                    estimated.actual_cost_variance = variance
                    estimated.note += f" | Fulfilled with actual cost: ${actual_cost}"
                    estimated.save()
    
    @staticmethod
    @transaction.atomic
    def transfer_inventory(
        item: Item,
        from_location: Location,
        to_location: Location,
        qty: Decimal,
        from_bin: Optional[Bin] = None,
        to_bin: Optional[Bin] = None,
        work_order = None,
        order = None,
        reference: str = "",
        note: str = ""
    ) -> Dict:
        """
        Transfer inventory between locations using FIFO.
        First allocates from source, then creates layers at destination.
        
        Returns:
            dict: Transfer details with movements and costs
        """
        # Allocate from source location
        allocation_result = FIFOInventoryService.allocate_inventory_fifo(
            item=item,
            location=from_location,
            qty_needed=qty,
            bin=from_bin,
            work_order=work_order,
            order=order,
            reference=reference,
            note=note or f"Transfer to {to_location.name}",
            allow_negative=True
        )
        
        # Create new layers at destination for each allocation
        destination_movements = []
        for alloc in allocation_result['allocations']:
            layer, movement = FIFOInventoryService.receive_inventory(
                item=item,
                location=to_location,
                qty=Decimal(str(alloc['qty'])),
                unit_cost=Decimal(str(alloc['unit_cost'])),
                bin=to_bin,
                purchase_order=None,
                reference=reference or f"Transfer from {from_location.name}"
            )
            destination_movements.append(movement)
        
        return {
            'success': True,
            'qty_transferred': float(qty),
            'total_cost': allocation_result['total_cost'],
            'from_movements': allocation_result['movements'],
            'to_movements': destination_movements,
            'allocations': allocation_result['allocations']
        }