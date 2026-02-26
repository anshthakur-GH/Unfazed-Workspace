const express = require('express');
const router = express.Router();
const { Lead } = require('../models/schemas');

// Get all leads (optionally filtered by assignedTo)
router.get('/', async (req, res) => {
    try {
        const { assignedTo } = req.query;
        let query = {};
        if (assignedTo) {
            query.assignedTo = assignedTo;
        }
        // Sort by reminderDate ascending so upcoming reminders are first
        const leads = await Lead.find(query).sort({ reminderDate: 1, createdAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new lead
router.post('/', async (req, res) => {
    const lead = new Lead({
        name: req.body.name,
        status: req.body.status,
        platform: req.body.platform,
        profileUrl: req.body.profileUrl,
        assignedTo: req.body.assignedTo,
        lastContactDate: req.body.lastContactDate,
        reminderDate: req.body.reminderDate,
        notes: req.body.notes
    });

    try {
        const newLead = await lead.save();
        res.status(201).json(newLead);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a lead
router.put('/:id', async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        if (req.body.name != null) lead.name = req.body.name;
        if (req.body.status != null) lead.status = req.body.status;
        if (req.body.platform != null) lead.platform = req.body.platform;
        if (req.body.profileUrl != null) lead.profileUrl = req.body.profileUrl;
        if (req.body.assignedTo != null) lead.assignedTo = req.body.assignedTo;
        if (req.body.lastContactDate != null) lead.lastContactDate = req.body.lastContactDate;
        if (req.body.reminderDate !== undefined) lead.reminderDate = req.body.reminderDate; // Allow nulling out
        if (req.body.notes != null) lead.notes = req.body.notes;

        const updatedLead = await lead.save();
        res.json(updatedLead);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a lead
router.delete('/:id', async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        await lead.deleteOne();
        res.json({ message: 'Lead deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
