const express = require('express');
const router = express.Router();
const { Invoice } = require('../models/schemas');
const auth = require('../middleware/auth');

// Admin check middleware
const adminCheck = (req, res, next) => {
    if (req.user && req.user.username === 'Ansh_Unfazed') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

// Get all invoices
router.get('/', auth, async (req, res) => {
    try {
        console.time('Fetch Invoices');
        const invoices = await Invoice.find().sort({ date: -1 }).lean();
        console.timeEnd('Fetch Invoices');
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
    }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).lean();
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
    }
});

// Create invoice
router.post('/', auth, adminCheck, async (req, res) => {
    try {
        const invoiceData = req.body;
        // Backend overrides
        invoiceData.createdBy = req.user.username || req.user.name || 'Admin';
        // Remove activeInvoice (frontend) 'id' if it's a UUID and we want to rely on Mongo _id,
        // OR we store it.
        // If I didn't add 'id' to schema, passing it will just be ignored by Mongoose (strict mode).
        // So we get a clean _id.

        const invoice = new Invoice(invoiceData);
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(400).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
    }
});

// Update invoice
router.put('/:id', auth, adminCheck, async (req, res) => {
    try {
        // We assume :id is the MongoDB _id
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        res.status(400).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
    }
});

// Delete invoice
router.delete('/:id', auth, adminCheck, async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
    }
});

module.exports = router;
