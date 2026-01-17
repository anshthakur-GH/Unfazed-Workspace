import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CURRENCY, formatCurrency, formatDate } from './utils';

export const generateInvoicePDF = (invoice) => {
    const doc = new jsPDF();

    // Colors
    const ORANGE = [255, 140, 66]; // #FF8C42
    const DARK_GRAY = [26, 26, 26]; // #1a1a1a
    const LIGHT_GRAY = [240, 240, 240];

    // Font setup
    doc.setFont('helvetica');

    // --- HEADER ---
    // Company Logo/Name
    doc.setFontSize(24);
    doc.setTextColor(...ORANGE);
    doc.text('Unfazed AI', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('www.unfazed-ai.online', 20, 26);
    doc.text('Ghaziabad, Uttar Pradesh', 20, 31);

    // Invoice Details (Right aligned)
    doc.setFontSize(36);
    doc.setTextColor(...DARK_GRAY);
    const typeText = invoice.type === 'quotation' ? 'QUOTATION' : 'INVOICE';
    doc.text(typeText, 190, 25, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'} #: ${invoice.invoiceNumber}`, 190, 35, { align: 'right' });
    doc.text(`Date: ${formatDate(invoice.date)}`, 190, 40, { align: 'right' });
    if (invoice.dueDate) {
        doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 190, 45, { align: 'right' });
    }

    // Divider
    doc.setDrawColor(200);
    doc.line(20, 55, 190, 55);

    // --- ADDRESS SECTION ---
    const yAddress = 70;

    // Bill To
    doc.setFontSize(12);
    doc.setTextColor(...DARK_GRAY);
    doc.text('Bill To:', 20, yAddress);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(invoice.billTo.name, 20, yAddress + 6);
    if (invoice.billTo.address) {
        const splitAddress = doc.splitTextToSize(invoice.billTo.address, 80);
        doc.text(splitAddress, 20, yAddress + 11);
    }

    // Ship To (if exists)
    if (invoice.shipTo && invoice.shipTo.address) {
        doc.setFontSize(12);
        doc.setTextColor(...DARK_GRAY);
        doc.text('Ship To:', 110, yAddress);

        doc.setFontSize(10);
        doc.setTextColor(80);
        const splitShipAddress = doc.splitTextToSize(invoice.shipTo.address, 80);
        doc.text(splitShipAddress, 110, yAddress + 6);
    }

    // --- TABLE ---
    const tableColumn = ["Item Description", "Qty", "Rate", "Amount"];
    const tableRows = [];

    invoice.items.forEach(item => {
        const itemData = [
            item.description,
            item.quantity,
            `${CURRENCY} ${item.rate.toFixed(2)}`,
            `${CURRENCY} ${item.amount.toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    doc.autoTable({
        startY: 100,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: DARK_GRAY,
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 10,
            textColor: 50,
            cellPadding: 4,
        },
        columnStyles: {
            0: { cellWidth: 'auto' }, // Description
            1: { cellWidth: 20, halign: 'center' }, // Qty
            2: { cellWidth: 30, halign: 'right' }, // Rate
            3: { cellWidth: 30, halign: 'right' }, // Amount
        },
        footStyles: {
            fillColor: [255, 255, 255],
            textColor: 50,
            fontSize: 10,
            fontStyle: 'bold',
        },
    });

    // --- TOTALS ---
    const finalYz = doc.lastAutoTable.finalY + 10;
    let currentYz = finalYz;
    const rightColX = 140;
    const valColX = 190;

    // Subtotal
    doc.text('Subtotal:', rightColX, currentYz);
    doc.text(formatCurrency(invoice.subtotal), valColX, currentYz, { align: 'right' });
    currentYz += 6;

    // Discount
    if (invoice.discount.value > 0) {
        doc.text(`Discount (${invoice.discount.type === 'percentage' ? invoice.discount.value + '%' : 'Fixed'}):`, rightColX, currentYz);
        const discountAmount = invoice.discount.type === 'percentage'
            ? (invoice.subtotal * invoice.discount.value / 100)
            : invoice.discount.value;
        doc.text(`- ${formatCurrency(discountAmount)}`, valColX, currentYz, { align: 'right' });
        currentYz += 6;
    }

    // Tax
    if (invoice.tax.value > 0) {
        doc.text(`Tax (${invoice.tax.value}%):`, rightColX, currentYz);
        // Rough calc for display logic consistency, real calc is in total
        // Assuming tax is on post-discount subtotal:
        let taxable = invoice.subtotal;
        if (invoice.discount.value > 0) {
            taxable -= (invoice.discount.type === 'percentage'
                ? (invoice.subtotal * invoice.discount.value / 100)
                : invoice.discount.value);
        }
        const taxAmount = taxable * (invoice.tax.value / 100);

        doc.text(`+ ${formatCurrency(taxAmount)}`, valColX, currentYz, { align: 'right' });
        currentYz += 6;
    }

    // Shipping
    if (invoice.shipping > 0) {
        doc.text('Shipping:', rightColX, currentYz);
        doc.text(`+ ${formatCurrency(invoice.shipping)}`, valColX, currentYz, { align: 'right' });
        currentYz += 6;
    }

    // Divider
    doc.setLineWidth(0.5);
    doc.line(rightColX, currentYz, 190, currentYz);
    currentYz += 8;

    // Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', rightColX, currentYz);
    doc.text(formatCurrency(invoice.total), valColX, currentYz, { align: 'right' });
    currentYz += 8;

    // Amount Paid
    if (invoice.amountPaid > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Amount Paid:', rightColX, currentYz);
        doc.text(`- ${formatCurrency(invoice.amountPaid)}`, valColX, currentYz, { align: 'right' });
        currentYz += 6;
    }

    // Balance Due
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ORANGE);
    doc.text('Balance Due:', rightColX, currentYz);
    doc.text(formatCurrency(invoice.balanceDue), valColX, currentYz, { align: 'right' });

    // --- FOOTER / NOTES ---
    doc.setTextColor(50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let bottomY = finalYz + 50;
    if (bottomY < 230) bottomY = 230; // Push to bottom if space allows

    if (invoice.notes) {
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, bottomY);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.notes, 20, bottomY + 5);
        bottomY += 20;
    }

    if (invoice.terms) {
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions:', 20, bottomY);
        doc.setFont('helvetica', 'normal');
        const splitTerms = doc.splitTextToSize(invoice.terms, 170);
        doc.text(splitTerms, 20, bottomY + 5);
    }

    // Save the PDF
    doc.save(`${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'}_${invoice.invoiceNumber}.pdf`);
};
