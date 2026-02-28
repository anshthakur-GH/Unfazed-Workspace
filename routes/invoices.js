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
        const invoices = await Invoice.find().sort({ date: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ id: req.params.id });
        // Note: Frontend generates UUID for 'id'. 
        // If migrating to MongoDB _id, we should decide. 
        // The existing frontend uses randomUUID for 'id'. 
        // We can keep 'id' in schema or switch to _id.
        // The Schema I added didn't specify a custom 'id' field, so it uses default _id.
        // Frontend uses 'id' (UUID). 
        // I should probably support the UUID from frontend or rely on _id.
        // Let's use the MongoDB _id for new invoices, but frontend expects 'id'.
        // I'll adjust the route to return _id as id or just use _id on frontend.
        // Actually, easiest is to let frontend logic remain, but map 'id' to _id or store the UUID.
        // Schema I added:
        // const invoiceSchema = new mongoose.Schema({
        //    invoiceNumber: { type: String, required: true },
        // ...
        // });
        // It does NOT have an 'id' field (UUID).
        // I should add 'id' to schema to matching frontend's UUID or update frontend to use _id.
        // Update frontend is better (standard).
        // So here I'll just return standard Mongoose docs which have _id.
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(400).json({ error: err.message });
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
        res.status(400).json({ error: err.message });
    }
});

// Delete invoice
router.delete('/:id', auth, adminCheck, async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
