import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_app.settings')
django.setup()

from inventory.models import Item, Location, UnitOfMeasure
from customers.models import Customer
from orders.models import Order, OrderLine

# Create UOM
ea, _ = UnitOfMeasure.objects.get_or_create(
    uom_code='EA',
    defaults={'description': 'Each'}
)

# Create Location
warehouse, _ = Location.objects.get_or_create(
    name='Main Warehouse',
    defaults={'type': 'WAREHOUSE', 'is_active': True}
)

# Create items
items = [
    ('WN-RED-100', 'Wire Nuts - Red', 'Red wire nuts', 5.00),
    ('WIRE-12-BLK', '12 AWG Wire - Black', 'Black 12 gauge wire', 0.50),
    ('BOX-4SQ', '4-Square Metal Box', '4" square box', 2.25),
]

for g_code, name, desc, cost in items:
    Item.objects.get_or_create(
        g_code=g_code,
        defaults={
            'item_name': name,
            'description': desc,
            'default_uom': ea,
            'category': 'ELECTRICAL',
            'current_replacement_cost': cost
        }
    )

# Create customer
customer, _ = Customer.objects.get_or_create(
    name='ACME Construction',
    defaults={'email': 'orders@acme.com'}
)

# Create sales order
order = Order.objects.create(
    order_type='SALES',
    order_status='PENDING',
    customer=customer
)

# Add lines
for i, (g_code, qty, price) in enumerate([
    ('WN-RED-100', 100, 5.50),
    ('WIRE-12-BLK', 500, 0.75),
    ('BOX-4SQ', 25, 2.50),
], 1):
    item = Item.objects.get(g_code=g_code)
    OrderLine.objects.create(
        order=order,
        line_no=i,
        item=item,
        g_code=g_code,
        description=item.item_name,
        qty=qty,
        price_each=price,
        uom=ea
    )

print(f"✅ Created test data!")
print(f"Order ID: {order.order_id}")