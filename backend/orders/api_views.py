# backend/orders/api_views.py
"""
API views for orders app
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from .models import Order
from .pick_ticket_service import generate_pick_ticket


@api_view(['GET'])
def download_pick_ticket(request, order_id):
    """
    Generate and download pick ticket PDF for a sales order
    
    GET /api/orders/{order_id}/pick-ticket/
    
    Returns:
        PDF file download
    """
    # Get the order
    order = get_object_or_404(Order, order_id=order_id)
    
    # Validate it's a sales order
    if order.order_type != 'SALES':
        return Response(
            {'error': 'Pick tickets can only be generated for sales orders'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if order has lines
    if not order.lines.exists():
        return Response(
            {'error': 'Order has no line items'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Generate PDF
        pdf_buffer = generate_pick_ticket(order)
        
        # Create response
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        
        # Set filename
        filename = f'pick_ticket_{str(order.order_id)[:8]}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return Response(
            {'error': f'Failed to generate pick ticket: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )