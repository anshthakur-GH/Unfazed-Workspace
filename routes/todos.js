const express = require('express');
const router = express.Router();
const { Todo } = require('../models/schemas');
const auth = require('../middleware/auth');

// Get all todos
router.get('/', async (req, res) => {
    try {
        const { agencyWorkId } = req.query;
        let query = {};

        if (agencyWorkId) {
            query.agencyWork = agencyWorkId;
        } else {
            // If no agencyWorkId provided, return global todos (where agencyWork is not set)
            query.agencyWork = { $exists: false };
        }

        const todos = await Todo.find(query).sort({ date: 1 });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a todo
// Create a todo
router.post('/', auth, async (req, res) => {
    try {
        const { task, date, tags, agencyWorkId } = req.body;
        // Enforce author as current user
        const todoData = {
            task,
            date,
            author: req.user.name,
            tags
        };

        if (agencyWorkId) {
            todoData.agencyWork = agencyWorkId;
        }

        const todo = new Todo(todoData);
        await todo.save();
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle completion
// Toggle completion
router.put('/:id', auth, async (req, res) => {
    try {
        const todoToCheck = await Todo.findById(req.params.id);
        if (!todoToCheck) return res.status(404).json({ message: 'Todo not found' });

        if (todoToCheck.author && todoToCheck.author !== req.user.name) {
            return res.status(403).json({ message: 'Not authorized to edit this todo' });
        }

        const { isCompleted, date, task, tags } = req.body;
        const updateData = {};
        if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
        if (date !== undefined) updateData.date = date;
        if (task !== undefined) updateData.task = task;
        if (tags !== undefined) updateData.tags = tags;

        const todo = await Todo.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete todo
// Delete todo
router.delete('/:id', auth, async (req, res) => {
    try {
        const todoToCheck = await Todo.findById(req.params.id);
        if (!todoToCheck) return res.status(404).json({ message: 'Todo not found' });

        if (todoToCheck.author && todoToCheck.author !== req.user.name) {
            return res.status(403).json({ message: 'Not authorized to delete this todo' });
        }

        await Todo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Todo deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
