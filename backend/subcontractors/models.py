from django.db import models
import uuid

class Subcontractor(models.Model):
    subcontractor_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255)
    contact_phone = models.CharField(max_length=50)
    contact_email = models.EmailField(max_length=320)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
