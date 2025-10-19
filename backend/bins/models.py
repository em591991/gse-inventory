# bins/models.py
from django.db import models
from locations.models import Location

class Bin(models.Model):
    bin_code = models.CharField(max_length=64)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)

    def __str__(self):
        return self.bin_code
