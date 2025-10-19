from rest_framework import serializers
from .models import Subcontractor

class SubcontractorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcontractor
        fields = "__all__"
