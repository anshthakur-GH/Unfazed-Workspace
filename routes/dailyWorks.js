const express = require('express');
const router = express.Router();
const { DailyWork } = require('../models/schemas');
const auth = require('../middleware/auth');

// GET all daily works (sorted by date desc)
router.get('/', async (req, res) => {
    try {
        const works = await DailyWork.find().sort({ date: -1 });
        res.json(works);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create new daily work
router.post('/', auth, async (req, res) => {
    const { date, dateLabel, content } = req.body;
    try {
        const newWork = new DailyWork({
            date,
            dateLabel,
            content,
            createdBy: req.user.name
        });
        const savedWork = await newWork.save();
        res.status(201).json(savedWork);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update daily work (content or label)
// PUT update daily work (content or label)
router.put('/:id', auth, async (req, res) => {
    try {
        const workToCheck = await DailyWork.findById(req.params.id);
        if (!workToCheck) return res.status(404).json({ message: 'Daily work not found' });

        if (workToCheck.createdBy && workToCheck.createdBy !== req.user.name) {
            return res.status(403).json({ message: 'Not authorized to edit this daily work' });
        }

        const { dateLabel, content } = req.body;
        const updateData = { updatedAt: Date.now() };

        if (dateLabel !== undefined) updateData.dateLabel = dateLabel;
        if (content !== undefined) updateData.content = content;

        const updatedWork = await DailyWork.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(updatedWork);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE daily work
// DELETE daily work
router.delete('/:id', auth, async (req, res) => {
    try {
        const workToCheck = await DailyWork.findById(req.params.id);
        if (!workToCheck) return res.status(404).json({ message: 'Daily work not found' });

        if (workToCheck.createdBy && workToCheck.createdBy !== req.user.name) {
            return res.status(403).json({ message: 'Not authorized to delete this daily work' });
        }

        await DailyWork.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
