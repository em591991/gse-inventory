# backend/rfqs/views.py
"""
ViewSets for RFQ REST API
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction

from .models import (
    RFQ, RFQLine, RFQVendor, VendorQuote,
    ReplenishmentOrder, ReplenishmentLine,
    RFQStatus, RFQVendorStatus
)
from .serializers import (
    RFQListSerializer, RFQDetailSerializer, RFQCreateSerializer,
    RFQLineSerializer, RFQVendorSerializer, VendorQuoteSerializer,
    ReplenishmentOrderSerializer, ReplenishmentLineSerializer
)


class RFQViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing RFQs
    """
    queryset = RFQ.objects.all().select_related('created_by', 'created_by__employee')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['rfq_number', 'description']
    ordering_fields = ['created_at', 'sent_at', 'rfq_number']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return RFQListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return RFQCreateSerializer
        return RFQDetailSerializer

    @action(detail=True, methods=['post'])
    def send_to_vendors(self, request, pk=None):
        """
        Mark RFQ as sent to vendors
        Updates status and timestamps
        """
        rfq = self.get_object()

        if rfq.status != RFQStatus.DRAFT:
            return Response(
                {'error': 'Only draft RFQs can be sent'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update RFQ status
        rfq.status = RFQStatus.SENT
        rfq.sent_at = timezone.now()
        rfq.save()

        # Update all vendor statuses to PENDING and set sent_at
        rfq.rfq_vendors.update(
            status=RFQVendorStatus.PENDING,
            sent_at=timezone.now()
        )

        return Response({
            'message': 'RFQ sent to vendors',
            'rfq_number': rfq.rfq_number,
            'sent_at': rfq.sent_at,
            'vendors_count': rfq.rfq_vendors.count()
        })

    @action(detail=True, methods=['get'])
    def quotes(self, request, pk=None):
        """
        Get all quotes for this RFQ
        Returns quotes grouped by line item
        """
        rfq = self.get_object()

        # Get all quotes for this RFQ's lines
        quotes = VendorQuote.objects.filter(
            rfq_line__rfq=rfq
        ).select_related(
            'vendor',
            'rfq_line',
            'rfq_line__item',
            'vendor_item'
        ).order_by('rfq_line__line_no', 'vendor__name')

        serializer = VendorQuoteSerializer(quotes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def replenishment_data(self, request, pk=None):
        """
        Get data formatted for replenishment view
        Returns RFQ lines with all vendor quotes side-by-side
        """
        rfq = self.get_object()

        data = []
        for line in rfq.lines.all().select_related('item', 'uom'):
            quotes = VendorQuote.objects.filter(
                rfq_line=line
            ).select_related('vendor')

            data.append({
                'rfq_line_id': str(line.rfq_line_id),
                'line_no': line.line_no,
                'item': {
                    'item_id': str(line.item.item_id),
                    'name': line.item.name,
                    'g_code': line.item.g_code,
                },
                'qty_requested': float(line.qty_requested),
                'uom': line.uom.uom_code,
                'quotes': [
                    {
                        'quote_id': str(q.quote_id),
                        'vendor': {
                            'vendor_id': str(q.vendor.vendor_id),
                            'name': q.vendor.name,
                        },
                        'price_each': float(q.price_each),
                        'qty_available': float(q.qty_available),
                        'lead_time_days': q.lead_time_days,
                        'manufacturer': q.manufacturer,
                        'manufacturer_part_number': q.manufacturer_part_number,
                        'is_selected': q.is_selected,
                    }
                    for q in quotes
                ]
            })

        return Response(data)


class RFQLineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing RFQ Lines
    """
    queryset = RFQLine.objects.all().select_related('rfq', 'item', 'uom')
    serializer_class = RFQLineSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['rfq']


class RFQVendorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing RFQ Vendor associations
    """
    queryset = RFQVendor.objects.all().select_related('rfq', 'vendor')
    serializer_class = RFQVendorSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['rfq', 'vendor', 'status']

    @action(detail=True, methods=['post'])
    def mark_quoted(self, request, pk=None):
        """Mark vendor as having provided a quote"""
        rfq_vendor = self.get_object()
        rfq_vendor.status = RFQVendorStatus.QUOTED
        rfq_vendor.responded_at = timezone.now()
        rfq_vendor.save()

        # Update RFQ status if all vendors have responded
        rfq = rfq_vendor.rfq
        if not rfq.rfq_vendors.filter(status=RFQVendorStatus.PENDING).exists():
            rfq.status = RFQStatus.QUOTED
            rfq.save()

        return Response({'status': 'Vendor marked as quoted'})

    @action(detail=True, methods=['post'])
    def mark_declined(self, request, pk=None):
        """Mark vendor as having declined to quote"""
        rfq_vendor = self.get_object()
        rfq_vendor.status = RFQVendorStatus.DECLINED
        rfq_vendor.responded_at = timezone.now()
        rfq_vendor.save()

        return Response({'status': 'Vendor marked as declined'})


class VendorQuoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Vendor Quotes
    """
    queryset = VendorQuote.objects.all().select_related(
        'rfq_line',
        'rfq_line__rfq',
        'rfq_line__item',
        'vendor',
        'vendor_item'
    )
    serializer_class = VendorQuoteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['rfq_line', 'vendor', 'rfq_line__rfq']

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Bulk create quotes from CSV import
        Expects array of quote data
        """
        quotes_data = request.data.get('quotes', [])

        if not quotes_data:
            return Response(
                {'error': 'No quotes provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_quotes = []
        errors = []

        with transaction.atomic():
            for quote_data in quotes_data:
                serializer = VendorQuoteSerializer(data=quote_data)
                if serializer.is_valid():
                    quote = serializer.save()
                    created_quotes.append(serializer.data)

                    # Update RFQVendor status
                    rfq_vendor = RFQVendor.objects.filter(
                        rfq=quote.rfq_line.rfq,
                        vendor=quote.vendor
                    ).first()
                    if rfq_vendor and rfq_vendor.status == RFQVendorStatus.PENDING:
                        rfq_vendor.status = RFQVendorStatus.QUOTED
                        rfq_vendor.responded_at = timezone.now()
                        rfq_vendor.save()
                else:
                    errors.append({
                        'data': quote_data,
                        'errors': serializer.errors
                    })

        return Response({
            'created': len(created_quotes),
            'errors': errors,
            'quotes': created_quotes
        }, status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS)


class ReplenishmentOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Replenishment Orders
    """
    queryset = ReplenishmentOrder.objects.all().select_related(
        'rfq',
        'created_by',
        'created_by__employee'
    ).prefetch_related('lines')
    serializer_class = ReplenishmentOrderSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['rfq', 'status']

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """
        Finalize replenishment and create Purchase Orders
        """
        from orders.models import Order, OrderLine, OrderType, OrderStatus
        from django.db.models import Sum

        replenishment = self.get_object()

        if replenishment.status != 'DRAFT':
            return Response(
                {'error': 'Only draft replenishments can be finalized'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Group selections by vendor
        vendor_lines = {}
        for line in replenishment.lines.all():
            vendor_id = line.selected_vendor_quote.vendor.vendor_id
            if vendor_id not in vendor_lines:
                vendor_lines[vendor_id] = {
                    'vendor': line.selected_vendor_quote.vendor,
                    'lines': []
                }
            vendor_lines[vendor_id]['lines'].append(line)

        created_pos = []

        with transaction.atomic():
            # Create a PO for each vendor
            for vendor_id, data in vendor_lines.items():
                vendor = data['vendor']

                # Create Purchase Order
                po = Order.objects.create(
                    order_type=OrderType.PURCHASE,
                    order_status=OrderStatus.DRAFT,
                    vendor=vendor,
                    description=f"From RFQ {replenishment.rfq.rfq_number}",
                    created_by=request.user if request.user.is_authenticated else None
                )

                # Create order lines
                for idx, repl_line in enumerate(data['lines'], start=1):
                    quote = repl_line.selected_vendor_quote

                    OrderLine.objects.create(
                        order=po,
                        line_no=idx,
                        item=repl_line.rfq_line.item,
                        description=repl_line.rfq_line.item.name,
                        uom=repl_line.rfq_line.uom,
                        qty=repl_line.qty_to_order,
                        price_each=quote.price_each,
                        g_code=repl_line.rfq_line.item.g_code
                    )

                    # Link replenishment line to PO
                    repl_line.purchase_order = po
                    repl_line.save()

                created_pos.append({
                    'order_id': str(po.order_id),
                    'vendor': vendor.name,
                    'line_count': len(data['lines'])
                })

            # Update replenishment status
            replenishment.status = 'POS_CREATED'
            replenishment.finalized_at = timezone.now()
            replenishment.save()

            # Update RFQ status
            replenishment.rfq.status = RFQStatus.COMPLETED
            replenishment.rfq.save()

        return Response({
            'message': 'Purchase Orders created successfully',
            'purchase_orders': created_pos
        }, status=status.HTTP_201_CREATED)


class ReplenishmentLineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Replenishment Lines
    """
    queryset = ReplenishmentLine.objects.all().select_related(
        'replenishment',
        'rfq_line',
        'rfq_line__item',
        'selected_vendor_quote',
        'selected_vendor_quote__vendor',
        'purchase_order'
    )
    serializer_class = ReplenishmentLineSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['replenishment', 'rfq_line']
