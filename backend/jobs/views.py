from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Customer, Job
from .serializers import CustomerSerializer, JobSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("name")
    serializer_class = CustomerSerializer


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().order_by("created_at")
    serializer_class = JobSerializer
