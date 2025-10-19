from rest_framework import viewsets, generics
from .models import Vendor
from .serializers import VendorSerializer, VendorDetailSerializer


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer

class VendorDetailView(generics.RetrieveAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorDetailSerializer
    lookup_field = "id"

class VendorListView(generics.ListCreateAPIView):  # ✅ not just ListAPIView
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
