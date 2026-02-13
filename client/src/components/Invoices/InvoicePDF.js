import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './utils';

// Helper to format currency for PDF (standard font support)
// Using 'Rs.' instead of symbol to avoid encoding issues in standard fonts
const formatCurrencyPDF = (amount) => {
    return `Rs. ${Number(amount).toFixed(2)}`;
};

export const generateInvoicePDF = (invoice) => {
    const doc = new jsPDF();

    // Colors
    const ORANGE = [255, 140, 66]; // #FF8C42
    const DARK_GRAY = [26, 26, 26]; // #1a1a1a
    const BLUE_LINK = [0, 0, 238]; // Standard blue for links

    // Font setup
    doc.setFont('helvetica');

    // --- HEADER ---
    // Company Logo/Name
    try {
        const logoImg = new Image();
        logoImg.src = '/Logo.png';
        doc.addImage(logoImg, 'PNG', 20, 15, 25, 25); // x, y, w, h
    } catch (e) {
        console.warn('Logo could not be loaded', e);
    }

    doc.setFontSize(24);
    doc.setTextColor(...ORANGE);
    doc.text('Unfazed AI', 20, 50);

    // Website URL below Unfazed AI
    doc.setFontSize(10);
    doc.setTextColor(100); // Black text for URL
    doc.text('unfazed-ai.online', 20, 55);
    doc.link(20, 52, 35, 4, { url: 'https://unfazed-ai.online' });

    // Address below URL
    doc.setTextColor(100);
    doc.text('Ghaziabad, Uttar Pradesh, 201016', 20, 60);

    // Invoice Details (Right aligned)
    doc.setFontSize(36);
    doc.setTextColor(...DARK_GRAY);
    const typeText = invoice.type === 'quotation' ? 'QUOTATION' : 'INVOICE';
    doc.text(typeText, 190, 25, { align: 'right' });

    // Invoice Number (Just below header, no label)
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${invoice.invoiceNumber}`, 190, 32, { align: 'right' });

    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(invoice.date)}`, 190, 40, { align: 'right' });
    if (invoice.dueDate) {
        doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 190, 45, { align: 'right' });
    }

    // Divider
    doc.setDrawColor(200);
    doc.line(20, 68, 190, 68); // Adjusted Y

    // --- ADDRESS SECTION ---
    const yAddress = 80;

    // Bill To
    doc.setFontSize(12);
    doc.setTextColor(...DARK_GRAY);
    doc.text('Bill To:', 20, yAddress);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.setTextColor(80);
    // Safe access for billTo
    const billToName = invoice.billTo?.name || 'Unknown Client';
    doc.text(billToName, 20, yAddress + 6);

    if (invoice.billTo?.address) {
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
            formatCurrencyPDF(item.rate),
            formatCurrencyPDF(item.amount)
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        startY: 110,
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
            2: { cellWidth: 35, halign: 'right' }, // Rate
            3: { cellWidth: 35, halign: 'right' }, // Amount
        },
        footStyles: {
            fillColor: [255, 255, 255],
            textColor: 50,
            fontSize: 10,
            fontStyle: 'bold',
        },
    });

    // Totals & Adjustments
    const rightColX = 150;
    const valColX = 190;
    let currentYz = doc.lastAutoTable.finalY + 10;

    const safeDiscount = invoice.discount || { type: 'percentage', value: 0 };
    const safeTax = invoice.tax || { type: 'percentage', value: 0 };

    // Subtotal
    doc.text('Subtotal:', rightColX, currentYz);
    doc.text(formatCurrencyPDF(invoice.subtotal || 0), valColX, currentYz, { align: 'right' });
    currentYz += 6;

    // Discount
    if (safeDiscount.value > 0) {
        doc.text(`Discount (${safeDiscount.type === 'percentage' ? safeDiscount.value + '%' : 'Fixed'}):`, rightColX, currentYz);
        const discountAmount = safeDiscount.type === 'percentage'
            ? ((invoice.subtotal || 0) * safeDiscount.value / 100)
            : safeDiscount.value;
        doc.text(`- ${formatCurrencyPDF(discountAmount)}`, valColX, currentYz, { align: 'right' });
        currentYz += 6;
    }

    // Tax
    if (safeTax.value > 0) {
        doc.text(`Tax (${safeTax.value}%):`, rightColX, currentYz);

        let taxable = (invoice.subtotal || 0);
        if (safeDiscount.value > 0) {
            taxable -= (safeDiscount.type === 'percentage'
                ? ((invoice.subtotal || 0) * safeDiscount.value / 100)
                : safeDiscount.value);
        }
        const taxAmount = taxable * (safeTax.value / 100);

        doc.text(`+ ${formatCurrencyPDF(taxAmount)}`, valColX, currentYz, { align: 'right' });
        currentYz += 6;
    }

    // Shipping
    if ((invoice.shipping || 0) > 0) {
        doc.text('Shipping:', rightColX, currentYz);
        doc.text(`+ ${formatCurrencyPDF(invoice.shipping || 0)}`, valColX, currentYz, { align: 'right' });
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
    doc.text(formatCurrencyPDF(invoice.total), valColX, currentYz, { align: 'right' });
    currentYz += 8;

    // Amount Paid
    if (invoice.type !== 'quotation' && invoice.amountPaid > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Amount Paid:', rightColX, currentYz);
        doc.text(`- ${formatCurrencyPDF(invoice.amountPaid)}`, valColX, currentYz, { align: 'right' });
        currentYz += 6;
    }

    // Balance Due
    if (invoice.type !== 'quotation') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...ORANGE);
        doc.text('Balance Due:', rightColX, currentYz);
        doc.text(formatCurrencyPDF(invoice.balanceDue), valColX, currentYz, { align: 'right' });
    }

    // --- FOOTER / NOTES (Dynamic Height Boxes) ---
    // Calculate start Y (push below totals, but ensure minimum separation)
    let finalYz = currentYz;
    let bottomStart = finalYz;

    // If totals extend far down, use a fixed gap. If totals are short, use minimum Y (e.g. 210)
    // We want content to be at bottom if possible, or naturally flowing if list is long.
    // User requested "appear perfectly in the bottom left". 
    // We'll prioritize flow to avoid overlap, but try to start lower if space permits.

    const minFooterY = 210;

    // If the totals section pushes past minFooterY, we just add padding.
    // If totals are high up, we jump to minFooterY.
    let contentY = Math.max(currentYz + 20, minFooterY);

    // Check if we are too close to page end (A4 height ~297mm)
    // If so, add new page.
    if (contentY > 270) {
        doc.addPage();
        contentY = 20;
    }

    // Includes Box
    if (invoice.notes) {
        doc.setTextColor(...DARK_GRAY); // Reset color
        doc.setFont('helvetica', 'bold');
        doc.text('Includes:', 20, contentY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50);

        // Split text to fit box width (e.g., 170mm)
        const boxWidth = 170;
        const splitNotes = doc.splitTextToSize(invoice.notes, boxWidth);
        const notesHeight = doc.getTextDimensions(splitNotes).h + 4; // text height + padding

        // Draw Box
        doc.setDrawColor(230); // Light gray border
        doc.rect(20, contentY + 2, boxWidth, notesHeight + 4); // x, y, w, h

        doc.text(splitNotes, 22, contentY + 7); // Padding inside box

        contentY += notesHeight + 15; // Move Y down for next section
    }

    // Terms Box
    // Check new page again
    if (contentY > 270) {
        doc.addPage();
        contentY = 20;
    }

    doc.setTextColor(...DARK_GRAY);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 20, contentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLUE_LINK); // Make terms text blue to look link-like

    const termsText = [
        invoice.terms || '', // Existing terms if any
        'For full terms and conditions, please visit:',
        'https://unfazed-ai.online/policies'
    ].filter(Boolean).join('\n');

    const boxWidth = 170;
    const splitTerms = doc.splitTextToSize(termsText, boxWidth);
    const termsHeight = doc.getTextDimensions(splitTerms).h + 4;

    // Draw Box
    doc.setDrawColor(230);
    doc.rect(20, contentY + 2, boxWidth, termsHeight + 4);

    doc.text(splitTerms, 22, contentY + 7);

    // Add link over the URL if possible (simple approximation based on position)
    // For now, just having it textually is what was requested ("exact URL to appear")
    // If we want it clickable, we'd need more complex calculation, but standard text is fine for print/PDF.

    contentY += termsHeight + 10;

    doc.save(`${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'}_${invoice.invoiceNumber}.pdf`);
};
