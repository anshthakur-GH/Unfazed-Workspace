import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './utils';

// Helper to format currency for PDF
const formatCurrencyPDF = (amount) => {
    return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generateInvoicePDF = (invoice) => {
    const doc = new jsPDF();

    // Colors
    const ORANGE = [255, 87, 34]; // #FF5722
    const DARK_GRAY = [26, 26, 26]; // #1a1a1a
    const LIGHT_GRAY = [245, 245, 245]; // #f5f5f5
    const MUTED_TEXT = [100, 100, 100];

    // Font setup
    doc.setFont('helvetica');

    // --- HEADER ---
    // Logo (Original Logo as requested)
    try {
        const logoImg = new Image();
        logoImg.src = '/Logo.png';
        doc.addImage(logoImg, 'PNG', 20, 15, 20, 20); // Scaled logo
    } catch (e) {
        console.warn('Logo could not be loaded', e);
    }

    // Company Name
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ORANGE);
    doc.text('Unfazed AI', 20, 48);

    // Company Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED_TEXT);
    doc.text('unfazedai.in', 20, 54);
    doc.text('Ghaziabad, Uttar Pradesh 201016, India', 20, 59);
    doc.text(`unfazedai.in@gmail.com | +91 7460011985`, 20, 64);

    // Document Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    const typeText = invoice.type === 'quotation' ? 'QUOTATION' : 'INVOICE';
    doc.text(typeText, 190, 25, { align: 'right' });

    // Document ID
    doc.setFontSize(12);
    doc.setTextColor(...ORANGE);
    const idLabel = invoice.type === 'quotation' ? '#' : '#';
    doc.text(`${idLabel} ${invoice.invoiceNumber}`, 190, 32, { align: 'right' });

    // Main Divider
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(1);
    doc.line(20, 72, 190, 72);

    // --- META SECTION ---
    const metaY = 85;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MUTED_TEXT);
    doc.text(invoice.type === 'quotation' ? 'PREPARED FOR' : 'BILL TO', 20, metaY);

    // Client Details
    doc.setFontSize(12);
    doc.setTextColor(...DARK_GRAY);
    const clientName = invoice.billTo?.name || 'Prospect Client';
    doc.text(clientName, 20, metaY + 8);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (invoice.billTo?.address) {
        const splitAddress = doc.splitTextToSize(invoice.billTo.address, 80);
        doc.text(splitAddress, 20, metaY + 14);
    }

    // Meta Details (Right Side)
    const rightMetaX = 130;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MUTED_TEXT);

    let currentMetaY = metaY;
    const metaLabels = [
        { label: 'DATE', value: formatDate(invoice.date) },
        { label: invoice.type === 'quotation' ? 'VALID UNTIL' : 'DUE DATE', value: formatDate(invoice.dueDate || new Date()) },
        { label: invoice.type === 'quotation' ? 'QUOTE NO.' : 'INVOICE NO.', value: invoice.invoiceNumber }
    ];

    if (invoice.type === 'quotation' && invoice.project) {
        metaLabels.push({ label: 'PROJECT', value: invoice.project });
    }

    metaLabels.forEach(m => {
        doc.setFont('helvetica', 'bold');
        doc.text(m.label, rightMetaX, currentMetaY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GRAY);
        doc.text(m.value, 190, currentMetaY, { align: 'right' });
        doc.setTextColor(...MUTED_TEXT);
        currentMetaY += 7;
    });

    // Disclaimer Box (Quotation only)
    let tableStartY = 125;
    if (invoice.type === 'quotation') {
        doc.setFillColor(...LIGHT_GRAY);
        doc.rect(20, currentMetaY + 5, 170, 15, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(80);
        const disclaimer = "This is a non-binding estimate based on our initial discovery call. Scope and pricing may be refined after a detailed audit. Valid for 14 days from the date above.";
        doc.text(doc.splitTextToSize(disclaimer, 160), 25, currentMetaY + 12);
        tableStartY = currentMetaY + 30;
    }

    // --- TABLE ---
    const tableColumn = ["#", "Description", "Qty", "Rate", "Amount"];
    const tableRows = invoice.items.map((item, index) => [
        index + 1,
        item.description, // We'll handle sub-text formatting in didParseCell if needed, or just standard
        item.quantity,
        formatCurrencyPDF(item.rate),
        formatCurrencyPDF(item.amount)
    ]);

    autoTable(doc, {
        startY: tableStartY,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: {
            fillColor: [0, 0, 0],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'normal',
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: LIGHT_GRAY
        },
        styles: {
            fontSize: 10,
            textColor: 50,
            cellPadding: 4,
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' },
        },
    });

    // --- TOTALS SECTION ---
    let finalY = doc.lastAutoTable.finalY + 10;
    const totalsX = 130;

    doc.setFontSize(10);
    doc.setTextColor(...DARK_GRAY);
    doc.setFont('helvetica', 'normal');

    // Subtotal
    doc.text('Subtotal', totalsX, finalY);
    doc.text(formatCurrencyPDF(invoice.subtotal), 190, finalY, { align: 'right' });

    let currentY = finalY + 8;

    // Discount
    if (invoice.discount?.value > 0) {
        const discountAmount = invoice.discount.type === 'percentage'
            ? (invoice.subtotal * invoice.discount.value / 100)
            : invoice.discount.value;
        const discountLabel = `Discount (${invoice.discount.type === 'percentage' ? invoice.discount.value + '%' : 'Fixed'})`;
        doc.text(discountLabel, totalsX, currentY);
        doc.text(`- ${formatCurrencyPDF(discountAmount)}`, 190, currentY, { align: 'right' });
        currentY += 8;
    }

    // Divider before Total
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(totalsX, currentY - 4, 190, currentY - 4);

    // Total
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text('Total', totalsX, currentY);
    doc.text(formatCurrencyPDF(invoice.total), 190, currentY, { align: 'right' });
    currentY += 8;

    // Divider before Balance Due
    doc.line(totalsX, currentY - 4, 190, currentY - 4);

    // Balance Due / Estimate
    doc.setFontSize(12);
    doc.setTextColor(...ORANGE);
    const balanceLabel = invoice.type === 'quotation' ? 'Total Estimate' : 'Balance Due';
    doc.text(balanceLabel, totalsX, currentY);
    doc.text(formatCurrencyPDF(invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.total), 190, currentY, { align: 'right' });

    // --- FOOTER SECTION (4 COLUMNS) ---
    const footerY = Math.max(currentY + 20, 230);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);

    const colWidth = 42;
    const gap = 3;
    let currentX = 20;

    // Column 1: WHAT'S INCLUDED
    doc.text("WHAT'S INCLUDED", currentX, footerY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_TEXT);
    doc.text(doc.splitTextToSize(invoice.notes || '', colWidth), currentX, footerY + 6);

    // Column 2: PAYMENT DETAILS
    currentX += colWidth + gap;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text("PAYMENT DETAILS", currentX, footerY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_TEXT);
    doc.text(doc.splitTextToSize(invoice.paymentDetails || '', colWidth), currentX, footerY + 6);

    // Column 3: TERMS & CONDITIONS
    currentX += colWidth + gap;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text("TERMS & CONDITIONS", currentX, footerY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_TEXT);
    doc.text(doc.splitTextToSize(invoice.terms || invoice.paymentTerms || '', colWidth), currentX, footerY + 6);

    // Column 4: HOW TO PROCEED (Quotation only)
    if (invoice.type === 'quotation') {
        currentX += colWidth + gap;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK_GRAY);
        doc.text("HOW TO PROCEED", currentX, footerY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...MUTED_TEXT);
        doc.text(doc.splitTextToSize(invoice.howToProceed || '', colWidth), currentX, footerY + 6);
    }

    // Final Bottom Footer
    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(20, 275, 190, 275);

    doc.setFontSize(9);
    doc.setTextColor(...MUTED_TEXT);
    doc.text("Thank you for choosing Unfazed AI. We build systems that work 24/7 so you don't have to.", 105, 282, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text("unfazedai.in | unfazedai.in@gmail.com | +91 7460011985 | Ghaziabad, UP 201016", 105, 287, { align: 'center' });

    doc.save(`${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'}_${invoice.invoiceNumber}.pdf`);
};
