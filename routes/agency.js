const express = require('express');
const router = express.Router();
const { AgencyWork } = require('../models/schemas');
const auth = require('../middleware/auth');

// Get all works
router.get('/', async (req, res) => {
    try {
        const works = await AgencyWork.find().sort({ timestamp: -1 });
        res.json(works);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add work
// Add work
router.post('/', auth, async (req, res) => {
    try {
        const { note, assignedTo } = req.body;
        const work = new AgencyWork({
            note,
            assignedTo,
            createdBy: req.user.name
        });
        await work.save();
        res.json(work);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update work
// Update work
router.put('/:id', auth, async (req, res) => {
    try {
        const workToCheck = await AgencyWork.findById(req.params.id);
        if (!workToCheck) return res.status(404).json({ message: 'Work not found' });

        if (workToCheck.createdBy && workToCheck.createdBy !== req.user.name) {
            return res.status(403).json({ message: 'Not authorized to edit this work' });
        }

        const { note, assignedTo } = req.body;
        const updateData = {};
        if (note) updateData.note = note;
        if (assignedTo) updateData.assignedTo = assignedTo;

        const work = await AgencyWork.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(work);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete work
// Delete work
router.delete('/:id', auth, async (req, res) => {
    try {
        const workToCheck = await AgencyWork.findById(req.params.id);
        if (!workToCheck) return res.status(404).json({ message: 'Work not found' });

        if (workToCheck.createdBy && workToCheck.createdBy !== req.user.name) {
            return res.status(403).json({ message: 'Not authorized to delete this work' });
        }

        await AgencyWork.findByIdAndDelete(req.params.id);
        res.json({ message: 'Work deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
