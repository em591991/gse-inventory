# backend/orders/pick_ticket_service.py
"""
Pick Ticket PDF Generation Service

Generates professional pick tickets for sales orders using ReportLab
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import datetime
import barcode
from barcode.writer import ImageWriter


class PickTicketGenerator:
    """Generates pick ticket PDFs for sales orders"""
    
    def __init__(self, order):
        """
        Initialize generator with an order
        
        Args:
            order: Order object (must be order_type='SALES')
        """
        self.order = order
        self.buffer = BytesIO()
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        # Header info style
        self.header_style = ParagraphStyle(
            'HeaderInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#333333'),
            spaceAfter=6,
        )
        
        # Bold label style
        self.label_style = ParagraphStyle(
            'Label',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#666666'),
            fontName='Helvetica-Bold'
        )
    
    def _generate_barcode(self, code_text):
        """
        Generate barcode image
        
        Args:
            code_text: Text to encode in barcode
            
        Returns:
            BytesIO buffer containing barcode image
        """
        try:
            # Generate Code128 barcode
            code128 = barcode.get_barcode_class('code128')
            barcode_instance = code128(code_text, writer=ImageWriter())
            
            # Write to buffer
            buffer = BytesIO()
            barcode_instance.write(buffer)
            buffer.seek(0)
            return buffer
        except Exception as e:
            print(f"Barcode generation failed: {e}")
            return None
    
    def generate(self):
        """
        Generate the pick ticket PDF
        
        Returns:
            BytesIO buffer containing the PDF
        """
        # Create PDF document
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
        )
        
        # Build content
        story = []
        
        # Add header
        story.extend(self._build_header())
        story.append(Spacer(1, 0.3*inch))
        
        # Add order info
        story.extend(self._build_order_info())
        story.append(Spacer(1, 0.3*inch))
        
        # Add items table
        story.extend(self._build_items_table())
        story.append(Spacer(1, 0.3*inch))
        
        # Add footer
        story.extend(self._build_footer())
        
        # Build PDF
        doc.build(story)
        
        # Reset buffer position
        self.buffer.seek(0)
        return self.buffer
    
    def _build_header(self):
        """Build the header section with title and barcode"""
        elements = []
        
        # Title
        title = Paragraph("PICK TICKET", self.title_style)
        elements.append(title)
        
        # Barcode (if order has order_id)
        if self.order.order_id:
            barcode_buffer = self._generate_barcode(str(self.order.order_id))
            if barcode_buffer:
                try:
                    barcode_img = Image(barcode_buffer, width=3*inch, height=0.75*inch)
                    barcode_img.hAlign = 'CENTER'
                    elements.append(barcode_img)
                except Exception as e:
                    print(f"Failed to add barcode image: {e}")
        
        return elements
    
    def _build_order_info(self):
        """Build order information section"""
        elements = []
        
        # Order info data
        data = [
            ['Order ID:', str(self.order.order_id)[:18], 'Date:', datetime.now().strftime('%m/%d/%Y')],
            ['Customer:', self.order.customer.name if self.order.customer else 'N/A', 'Status:', self.order.order_status],
        ]
        
        if self.order.job:
            data.append(['Job:', self.order.job.job_code, 'Job Name:', self.order.job.name])
        
        # Create table
        table = Table(data, colWidths=[1.2*inch, 2.8*inch, 1.2*inch, 2.3*inch])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#666666')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(table)
        return elements
    
    def _build_items_table(self):
        """Build the items table with pick locations"""
        elements = []
        
        # Table header
        data = [
            ['Line', 'G-Code', 'Description', 'Qty', 'UOM', 'Location', 'Picked']
        ]
        
        # Add order lines
        lines = self.order.lines.all().order_by('line_no')
        for line in lines:
            # Get default location/bin for item (if exists)
            location = 'TBD'
            try:
                if hasattr(line.item, 'default_bins') and line.item.default_bins.exists():
                    default_bin = line.item.default_bins.first()
                    location = f"{default_bin.location.name}\n{default_bin.bin.bin_code if default_bin.bin else ''}"
            except:
                pass
            
            data.append([
                str(line.line_no),
                line.g_code,
                line.description,
                str(line.qty),
                line.uom.uom_code if line.uom else 'EA',
                location,
                '☐'  # Checkbox
            ])
        
        # Create table
        table = Table(data, colWidths=[0.5*inch, 1.2*inch, 2.5*inch, 0.7*inch, 0.6*inch, 1.3*inch, 0.7*inch])
        
        # Style the table
        table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a4a4a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),  # Line number
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),   # Qty
            ('ALIGN', (6, 0), (6, -1), 'CENTER'),  # Picked checkbox
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#4a4a4a')),
            
            # Padding
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(table)
        return elements
    
    def _build_footer(self):
        """Build footer with signature lines and notes"""
        elements = []
        
        # Notes section
        if self.order.notes:
            notes_style = ParagraphStyle(
                'Notes',
                parent=self.styles['Normal'],
                fontSize=9,
                textColor=colors.HexColor('#666666'),
            )
            notes = Paragraph(f"<b>Notes:</b> {self.order.notes}", notes_style)
            elements.append(notes)
            elements.append(Spacer(1, 0.2*inch))
        
        # Signature lines
        data = [
            ['', '', ''],
            ['Picked By: _____________________', 'Date: __________', 'Time: __________'],
            ['', '', ''],
            ['Verified By: _____________________', 'Date: __________', 'Time: __________'],
        ]
        
        table = Table(data, colWidths=[3.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        elements.append(table)
        return elements


def generate_pick_ticket(order):
    """
    Convenience function to generate a pick ticket PDF
    
    Args:
        order: Order object
        
    Returns:
        BytesIO buffer containing PDF
    """
    generator = PickTicketGenerator(order)
    return generator.generate()