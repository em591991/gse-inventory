# workorders/views.py

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import WorkOrder
from .serializers import WorkOrderSerializer


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all().order_by("-created_at")
    serializer_class = WorkOrderSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # 🆕 /api/workorders/sub/
    @action(detail=False, methods=["get"], url_path="sub")
    def sub_workorders(self, request):
        vendor_id = request.query_params.get("vendor_id")

        if not vendor_id:
            return Response(
                {"error": "vendor_id parameter is required"},
                status=400
            )

        qs = self.queryset.filter(assigned_to_id=vendor_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
