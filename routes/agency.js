const express = require('express');
const router = express.Router();
const { AgencyWork } = require('../models/schemas');
const auth = require('../middleware/auth');

// Get all works
router.get('/', auth, async (req, res) => {
    try {
        console.time('Fetch Agency Works');
        
        // 1. Fetch all works using lean() for performance
        const works = await AgencyWork.find().lean();
        const workIds = works.map(w => w._id);

        // 2. Efficiently check for todos using a single aggregation, filtered by workIds
        const worksWithTodos = await require('../models/schemas').Todo.aggregate([
            { $match: { agencyWork: { $in: workIds } } },
            { $group: { _id: '$agencyWork', count: { $sum: 1 } } }
        ]);

        // Create a lookup map for faster access
        const todoCountMap = worksWithTodos.reduce((acc, curr) => {
            if (curr._id) acc[curr._id.toString()] = curr.count;
            return acc;
        }, {});

        // 3. Attach hasTodos flag using the map
        const worksWithTodosStatus = works.map(work => ({
            ...work,
            hasTodos: (todoCountMap[work._id.toString()] || 0) > 0
        }));

        // 4. Custom Sorting Logic
        worksWithTodosStatus.sort((a, b) => {
            const aDone = a.progress === 100;
            const bDone = b.progress === 100;
            if (aDone && !bDone) return 1;
            if (!aDone && bDone) return -1;

            const priorities = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const aPrio = priorities[a.priority] || 2;
            const bPrio = priorities[b.priority] || 2;
            if (aPrio !== bPrio) return bPrio - aPrio;

            const aDead = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
            const bDead = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
            if (aDead !== bDead) return aDead - bDead;

            if (a.progress !== b.progress) return b.progress - a.progress;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        console.timeEnd('Fetch Agency Works');
        res.json(worksWithTodosStatus);
    } catch (err) {
        console.error('Fetch Agency Works Error:', err);
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

        if (workToCheck.createdBy && workToCheck.createdBy !== req.user.name && req.user.username !== 'Ansh_Unfazed') {
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

        if (workToCheck.createdBy && workToCheck.createdBy !== req.user.name && req.user.username !== 'Ansh_Unfazed') {
            return res.status(403).json({ message: 'Not authorized to delete this work' });
        }

        await AgencyWork.findByIdAndDelete(req.params.id);
        res.json({ message: 'Work deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
