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
    doc.text('INVOICE', 190, 25, { align: 'right' });

    // Document ID
    doc.setFontSize(12);
    doc.setTextColor(...ORANGE);
    doc.text(`# ${invoice.invoiceNumber}`, 190, 32, { align: 'right' });

    // Main Divider
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(1);
    doc.line(20, 72, 190, 72);

    // --- META SECTION ---
    const metaY = 85;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MUTED_TEXT);
    doc.text('BILL TO', 20, metaY);

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
        { label: 'DUE DATE', value: formatDate(invoice.dueDate || new Date()) },
        { label: 'INVOICE NO.', value: invoice.invoiceNumber }
    ];

    metaLabels.forEach(m => {
        doc.setFont('helvetica', 'bold');
        doc.text(m.label, rightMetaX, currentMetaY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GRAY);
        doc.text(m.value, 190, currentMetaY, { align: 'right' });
        doc.setTextColor(...MUTED_TEXT);
        currentMetaY += 7;
    });

    let tableStartY = 125;

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

    // Balance Due
    doc.setFontSize(12);
    doc.setTextColor(...ORANGE);
    doc.text('Balance Due', totalsX, currentY);
    doc.text(formatCurrencyPDF(invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.total), 190, currentY, { align: 'right' });

    // --- FOOTER SECTION (STACKED VERTICALLY) ---
    let blockY = currentY + 15;
    const fullWidth = 170;

    const renderBlock = (title, text) => {
        if (!text) return;
        
        // Ensure we don't draw off the page
        if (blockY > 265) {
            doc.addPage();
            blockY = 20;
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK_GRAY);
        doc.text(title, 20, blockY);
        
        blockY += 4;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...MUTED_TEXT);
        const splitText = doc.splitTextToSize(text, fullWidth);
        doc.text(splitText, 20, blockY);
        
        blockY += (splitText.length * 3.5) + 4; // Advance Y based on text height
    };

    // Section 1: WHAT'S INCLUDED
    let finalNotes = invoice.notes || "Workflow Setup: Designing and configuring n8n workflows with nodes for triggers, actions, and data flows.\nAPI Integrations: Connecting external APIs (e.g., LinkedIn, WhatsApp) with auth, error handling, and data mapping.\nCustom Logic, Testing & Deployment: Adding JS/Python code for logic, full testing cycles, and live deployment to your server.";
    if (finalNotes.toLowerCase().includes('workflow setup') && !finalNotes.includes('n8n')) {
        finalNotes = "Workflow Setup: Designing and configuring n8n workflows with nodes for triggers, actions, and data flows.\nAPI Integrations: Connecting external APIs (e.g., LinkedIn, WhatsApp) with auth, error handling, and data mapping.\nCustom Logic, Testing & Deployment: Adding JS/Python code for logic, full testing cycles, and live deployment to your server.";
    }
    renderBlock("WHAT'S INCLUDED", finalNotes);

    // Section 2: PAYMENT DETAILS
    let finalPaymentDetails = invoice.paymentDetails || "UPI: 7393800862@upi\nBank: BOB \nA/C 44890100012075\nIFSC: BARB0ATARSU\nPlease include invoice number in\npayment reference.";
    if (!finalPaymentDetails.includes('\n') && (finalPaymentDetails.includes('7393800862@upi') || finalPaymentDetails.includes('unfazedai@upi'))) {
        finalPaymentDetails = "UPI: 7393800862@upi\nBank: BOB \nA/C 44890100012075\nIFSC: BARB0ATARSU\nPlease include invoice number in\npayment reference.";
    }
    renderBlock("PAYMENT DETAILS", finalPaymentDetails);

    // Section 3: TERMS & CONDITIONS
    const finalTerms = invoice.terms || invoice.paymentTerms || "Full Terms: unfazedai.in/policies\n50% advance required to begin work.\nBalance due upon delivery.\nRevisions beyond scope billed separately.";
    renderBlock("TERMS & CONDITIONS", finalTerms);



    // Final Bottom Footer
    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(20, 275, 190, 275);

    doc.setFontSize(9);
    doc.setTextColor(...MUTED_TEXT);
    doc.text("Thank you for choosing Unfazed AI. We build systems that work 24/7 so you don't have to.", 105, 282, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text("unfazedai.in | unfazedai.in@gmail.com | +91 7460011985 | Ghaziabad, UP 201016", 105, 287, { align: 'center' });

    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
};
