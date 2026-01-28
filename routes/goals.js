const express = require('express');
const router = express.Router();
const { Goal, Todo } = require('../models/schemas');
const auth = require('../middleware/auth');

// Get goals (optionally filtered by assignedTo)
router.get('/', async (req, res) => {
    try {
        const { assignedTo } = req.query;
        let query = {};
        if (assignedTo) {
            query.assignedTo = assignedTo;
        }
        const goals = await Goal.find(query).sort({ createdAt: -1 });
        res.json(goals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new goal
router.post('/', auth, async (req, res) => {
    try {
        const { title, targetDate, assignedTo } = req.body;
        const newGoal = new Goal({
            title,
            targetDate,
            assignedTo,
            createdBy: req.user.username // Assuming auth middleware adds user to req
        });
        await newGoal.save();
        res.json(newGoal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a goal
router.put('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        // Only creator can edit
        if (goal.createdBy !== req.user.username) {
            return res.status(403).json({ message: 'Not authorized to edit this goal' });
        }

        const { title, targetDate, assignedTo } = req.body;
        if (title) goal.title = title;
        if (targetDate) goal.targetDate = targetDate;
        if (assignedTo) goal.assignedTo = assignedTo;

        await goal.save();
        res.json(goal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        // Only creator can delete
        if (goal.createdBy !== req.user.username) {
            return res.status(403).json({ message: 'Not authorized to delete this goal' });
        }

        // Delete associated todos
        await Todo.deleteMany({ goal: req.params.id });

        await Goal.findByIdAndDelete(req.params.id);
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
