from django.shortcuts import render
from rest_framework import viewsets
from .models import Subcontractor
from .serializers import SubcontractorSerializer

class SubcontractorViewSet(viewsets.ModelViewSet):
    queryset = Subcontractor.objects.all().order_by("name")
    serializer_class = SubcontractorSerializer


# Create your views here.
