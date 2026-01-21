const express = require('express');
const router = express.Router();
const { AgencyWork } = require('../models/schemas');
const auth = require('../middleware/auth');

// Get all works
router.get('/', async (req, res) => {
    try {
        const works = await AgencyWork.find();

        // Custom Sorting Logic
        works.sort((a, b) => {
            // 1. Completion: Non-100% before 100%
            const aDone = a.progress === 100;
            const bDone = b.progress === 100;
            if (aDone && !bDone) return 1;
            if (!aDone && bDone) return -1;

            // 2. Priority: High(3) > Medium(2) > Low(1)
            const priorities = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const aPrio = priorities[a.priority] || 2; // Default to Medium
            const bPrio = priorities[b.priority] || 2;
            if (aPrio !== bPrio) return bPrio - aPrio;

            // 3. Progress: Descending (Higher progress first)
            if (a.progress !== b.progress) return b.progress - a.progress;

            // 4. Timestamp: Descending (Newest first)
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        res.json(works);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add work
// Add work
router.post('/', auth, async (req, res) => {
    try {
        const { note, assignedTo, progress } = req.body;
        const work = new AgencyWork({
            note,
            assignedTo,
            note,
            assignedTo,
            progress: progress || 0,
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

        const { note, assignedTo, progress, priority, deadline } = req.body;
        const updateData = {};
        if (note) updateData.note = note;
        if (assignedTo) updateData.assignedTo = assignedTo;
        if (progress !== undefined) updateData.progress = progress;
        if (priority) updateData.priority = priority;
        if (deadline) updateData.deadline = deadline;

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
