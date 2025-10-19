from django.shortcuts import render
from rest_framework import viewsets
from .models import Department, DepartmentAssignment
from .serializers import DepartmentSerializer, DepartmentAssignmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class DepartmentAssignmentViewSet(viewsets.ModelViewSet):
    queryset = DepartmentAssignment.objects.all()
    serializer_class = DepartmentAssignmentSerializer


# Create your views here.
