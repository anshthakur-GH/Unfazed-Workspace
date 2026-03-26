const express = require('express');
const router = express.Router();
const { Record } = require('../models/schemas');
const auth = require('../middleware/auth');

// Get all records
router.get('/', async (req, res) => {
    try {
        const records = await Record.find().select('title createdBy createdAt').sort({ createdAt: -1 }).lean();
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single record
router.get('/:id', async (req, res) => {
    try {
        const record = await Record.findById(req.params.id).lean();
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a record
// Create a record
router.post('/', auth, async (req, res) => {
    try {
        const { title } = req.body;
        // Initialize 50x10 grid with empty strings if not provided
        const emptyRow = Array(10).fill('');
        const initialData = Array(50).fill(null).map(() => [...emptyRow]); // Deep copy rows

        const record = new Record({
            title,
            data: initialData,
            createdBy: req.user.name
        });
        await record.save();
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update record
// Update record
router.put('/:id', auth, async (req, res) => {
    try {
        const recordToCheck = await Record.findById(req.params.id);
        if (!recordToCheck) return res.status(404).json({ message: 'Record not found' });

        if (recordToCheck.createdBy && recordToCheck.createdBy !== req.user.name && req.user.username !== 'Ansh_Unfazed') {
            return res.status(403).json({ message: 'Not authorized to edit this record' });
        }

        const { title, data } = req.body;
        const updateData = {};
        if (title) updateData.title = title;
        if (data) updateData.data = data;

        const record = await Record.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete record
// Delete record
router.delete('/:id', auth, async (req, res) => {
    try {
        const recordToCheck = await Record.findById(req.params.id);
        if (!recordToCheck) return res.status(404).json({ message: 'Record not found' });

        if (recordToCheck.createdBy && recordToCheck.createdBy !== req.user.name && req.user.username !== 'Ansh_Unfazed') {
            return res.status(403).json({ message: 'Not authorized to delete this record' });
        }

        await Record.findByIdAndDelete(req.params.id);
        res.json({ message: 'Record deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
