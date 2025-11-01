"""
Views for CSV template generation and download
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from drf_spectacular.utils import extend_schema


@extend_schema(
    tags=["CSV Templates"],
    summary="Get available CSV import templates",
    description="Returns list of all available CSV templates for bulk imports"
)
class TemplateListView(APIView):
    """GET /api/csv-templates/ - List all available templates"""

    def get(self, request, *args, **kwargs):
        from .templates import CSV_TEMPLATES

        templates = []
        for key, template in CSV_TEMPLATES.items():
            templates.append({
                'key': key,
                'name': template['name'],
                'description': template['description'],
                'required_fields': template['required'],
                'download_url': f'/api/csv-templates/{key}/'
            })

        return Response({'templates': templates})


@extend_schema(
    tags=["CSV Templates"],
    summary="Download CSV template",
    description="Download a specific CSV template with headers and example row"
)
class TemplateDownloadView(APIView):
    """GET /api/csv-templates/{template_key}/ - Download template CSV"""

    def get(self, request, template_key, *args, **kwargs):
        from .templates import CSV_TEMPLATES, generate_csv_template

        if template_key not in CSV_TEMPLATES:
            return Response(
                {"error": f"Template '{template_key}' not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generate CSV content
        csv_content = generate_csv_template(template_key)
        template_name = CSV_TEMPLATES[template_key]['name']

        # Return as downloadable file
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{template_key}_template.csv"'

        return response
