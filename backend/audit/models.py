import uuid
from django.db import models
from django.utils import timezone


class AuditLog(models.Model):
    """
    ERD Table: audit_log
    Tracks all system actions for compliance and debugging
    """
    log_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='user_id',
        related_name='audit_logs'
    )
    action = models.CharField(max_length=80)
    entity_type = models.CharField(max_length=80, blank=True)
    entity_id = models.UUIDField(null=True, blank=True)
    details = models.TextField(blank=True)
    ip = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = 'audit_log'
        indexes = [
            models.Index(fields=['timestamp'], name='idx_audit_timestamp'),
            models.Index(fields=['user'], name='idx_audit_user'),
            models.Index(fields=['entity_type', 'entity_id'], name='idx_audit_entity'),
        ]

    def __str__(self):
        return f"{self.timestamp} - {self.action} by {self.user}"