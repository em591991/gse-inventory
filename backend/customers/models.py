from django.db import models
import uuid

class Customer(models.Model):
    customer_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=500)
    email = models.EmailField(max_length=320, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    tax_exempt_no = models.CharField(max_length=64, null=True, blank=True)
    terms = models.CharField(max_length=64, null=True, blank=True)

    def __str__(self):
        return self.name

class CustomerAddress(models.Model):
    class AddressType(models.TextChoices):
        BILLING = 'BILLING'
        SHIPPING = 'SHIPPING'
        SITE = 'SITE'
        OTHER = 'OTHER'

    address_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, related_name="addresses", on_delete=models.CASCADE)
    address_type = models.CharField(max_length=10, choices=AddressType.choices)
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=200)
    state = models.CharField(max_length=100)
    postal = models.CharField(max_length=40)
    is_default = models.BooleanField()

    def __str__(self):
        return f"{self.name} ({self.address_type})"

class CustomerContact(models.Model):
    class ContactType(models.TextChoices):
        BILLING = 'BILLING'
        SITE = 'SITE'
        GENERAL = 'GENERAL'

    contact_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, related_name="contacts", on_delete=models.CASCADE)
    contact_type = models.CharField(max_length=10, choices=ContactType.choices)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=320)
    phone = models.CharField(max_length=50)
    is_primary = models.BooleanField()

    def __str__(self):
        return f"{self.name} ({self.contact_type})"
