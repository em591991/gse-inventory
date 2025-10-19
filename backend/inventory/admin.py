from django.contrib import admin
from .models import Item, UnitOfMeasure


from .models import (
    Item,
    UnitOfMeasure,
    Location,
    Bin,
    ItemDefaultBin,
    InventoryMovement,
    ItemLocationPolicy,
)

admin.site.register(ItemLocationPolicy)


admin.site.register(Item)
admin.site.register(UnitOfMeasure)
admin.site.register(Location)
admin.site.register(Bin)
admin.site.register(ItemDefaultBin)
admin.site.register(InventoryMovement)

