"""
CSV Template definitions for bulk imports.
Each template defines the required and optional columns for importing data.
"""

CSV_TEMPLATES = {
    'items': {
        'name': 'Items',
        'description': 'Import inventory items with category hierarchy',
        'columns': [
            'g_code',
            'item_name',
            'description',
            'category',
            'subcategory',
            'subcategory2',
            'subcategory3',
            'manufacturer',
            'manufacturer_part_no',
            'default_uom'
        ],
        'example_row': [
            'G-100',
            '20A Circuit Breaker',
            'Single pole 20 amp breaker',
            'Electrical',
            'Breakers',
            'Single Pole',
            '15-20A Range',
            'Square D',
            'QO120',
            'EA'
        ],
        'required': ['g_code', 'item_name']
    },

    'vendor_items': {
        'name': 'Vendor Pricing',
        'description': 'Import vendor-specific pricing for items',
        'columns': [
            'vendor_name',
            'item_sku',
            'price',
            'vendor_uom',
            'lead_time_days'
        ],
        'example_row': [
            'Notoco Electric',
            'G-100',
            '12.50',
            'EA',
            '3'
        ],
        'required': ['vendor_name', 'item_sku', 'price']
    },

    'item_location_policies': {
        'name': 'Item Location Policies',
        'description': 'Set min/max/reorder quantities per location',
        'columns': [
            'g_code',
            'location_name',
            'min_qty',
            'max_qty',
            'reorder_qty',
            'lead_time_days',
            'preferred_vendor_name'
        ],
        'example_row': [
            'G-100',
            'Main Warehouse',
            '10',
            '50',
            '25',
            '3',
            'Notoco Electric'
        ],
        'required': ['g_code', 'location_name']
    },

    'locations': {
        'name': 'Locations',
        'description': 'Import warehouses, shops, and staging areas',
        'columns': [
            'name',
            'address',
            'city',
            'state',
            'zip_code',
            'location_type'
        ],
        'example_row': [
            'Main Warehouse',
            '123 Industrial Pkwy',
            'Houston',
            'TX',
            '77001',
            'WAREHOUSE'
        ],
        'required': ['name']
    },

    'vehicles': {
        'name': 'Vehicles',
        'description': 'Import service trucks and equipment',
        'columns': [
            'unit_number',
            'vin',
            'make',
            'model',
            'year',
            'license_plate',
            'status'
        ],
        'example_row': [
            'TRUCK-01',
            '1FTFW1E50KFA12345',
            'Ford',
            'F-150',
            '2020',
            'ABC1234',
            'ACTIVE'
        ],
        'required': ['unit_number']
    },

    'vehicle_models': {
        'name': 'Vehicle Models',
        'description': 'Import vehicle make/model definitions',
        'columns': [
            'make',
            'model',
            'year'
        ],
        'example_row': [
            'Ford',
            'F-150',
            '2020'
        ],
        'required': ['make', 'model', 'year']
    },

    'users': {
        'name': 'Users',
        'description': 'Import user accounts (requires Azure AD setup)',
        'columns': [
            'email',
            'first_name',
            'last_name',
            'role',
            'department'
        ],
        'example_row': [
            'john.doe@gse.com',
            'John',
            'Doe',
            'technician',
            'Field Services'
        ],
        'required': ['email']
    },

    'vendors': {
        'name': 'Vendors',
        'description': 'Import vendor/supplier information',
        'columns': [
            'name',
            'contact_name',
            'email',
            'phone',
            'address',
            'city',
            'state',
            'zip_code',
            'website'
        ],
        'example_row': [
            'Notoco Electric',
            'Sales Dept',
            'sales@notoco.com',
            '555-0100',
            '456 Commerce St',
            'Houston',
            'TX',
            '77002',
            'www.notoco.com'
        ],
        'required': ['name']
    },

    'bins': {
        'name': 'Bins',
        'description': 'Import storage bin locations within warehouses',
        'columns': [
            'location_name',
            'bin_code'
        ],
        'example_row': [
            'Main Warehouse',
            'A-01-01'
        ],
        'required': ['location_name', 'bin_code']
    },

    'equipment': {
        'name': 'Equipment',
        'description': 'Import equipment and assets to track',
        'columns': [
            'equipment_id',
            'name',
            'equipment_type',
            'manufacturer',
            'model',
            'serial_number',
            'location_name',
            'status'
        ],
        'example_row': [
            'LIFT-001',
            'Forklift #1',
            'FORKLIFT',
            'Toyota',
            '8FG25',
            'SN123456',
            'Main Warehouse',
            'ACTIVE'
        ],
        'required': ['equipment_id', 'name']
    }
}


def generate_csv_template(template_key):
    """Generate a CSV template string for the given template key"""
    if template_key not in CSV_TEMPLATES:
        raise ValueError(f"Unknown template: {template_key}")

    template = CSV_TEMPLATES[template_key]

    # Header row
    csv_lines = [','.join(template['columns'])]

    # Example row
    if 'example_row' in template:
        csv_lines.append(','.join(template['example_row']))

    return '\n'.join(csv_lines)
