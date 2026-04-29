const express = require('express');
const router = express.Router();
const { Goal } = require('../models/schemas');
const auth = require('../middleware/auth');

// Get all goals
router.get('/', async (req, res) => {
    try {
        console.time('Fetch Goals');
        const { month, year, type } = req.query;
        let query = {};
        if (month) query.month = month;
        if (year) query.year = year;
        if (type) query.type = type;
        
        const goals = await Goal.find(query).sort({ createdAt: -1 }).lean();
        console.timeEnd('Fetch Goals');
        res.json(goals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a goal
router.post('/', auth, async (req, res) => {
    try {
        const { title, type, member, month, year, date } = req.body;
        
        // Only Ansh_Unfazed can create global goals
        if (type === 'global' && req.user.username !== 'Ansh_Unfazed') {
            return res.status(403).json({ message: 'Only admin can create global goals' });
        }

        const goal = new Goal({
            title,
            type: type || 'individual',
            member,
            month,
            year,
            date: date || new Date(),
            author: req.user.name || req.user.username
        });

        await goal.save();
        res.json(goal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a goal
router.put('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        // Authorization: Admin can edit anything. 
        // For individual goals, the 'author' or Admin can edit.
        if (goal.type === 'global' && req.user.username !== 'Ansh_Unfazed') {
            return res.status(403).json({ message: 'Only admin can edit global goals' });
        }
        
        const updatedGoal = await Goal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedGoal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        if (goal.type === 'global' && req.user.username !== 'Ansh_Unfazed') {
            return res.status(403).json({ message: 'Only admin can delete global goals' });
        }

        await Goal.findByIdAndDelete(req.params.id);
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
