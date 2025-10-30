from django.apps import AppConfig


class ShipmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'shipments'
    verbose_name = 'Shipments'

    def ready(self):
        """Import signals when app is ready"""
        import shipments.signals  # noqa
