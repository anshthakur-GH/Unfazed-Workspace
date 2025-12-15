const express = require('express');
const router = express.Router();
const { Todo } = require('../models/schemas');

// Get all todos
router.get('/', async (req, res) => {
    try {
        const todos = await Todo.find().sort({ date: 1 });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a todo
router.post('/', async (req, res) => {
    try {
        const { task, date, author, tags } = req.body;
        const todo = new Todo({ task, date, author, tags });
        await todo.save();
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle completion
router.put('/:id', async (req, res) => {
    try {
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
router.delete('/:id', async (req, res) => {
    try {
        await Todo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Todo deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
