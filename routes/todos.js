const express = require('express');
const router = express.Router();
const { Todo, AgencyWork } = require('../models/schemas');
const auth = require('../middleware/auth');

// Helper to update Agency Work progress
const updateAgencyWorkProgress = async (agencyWorkId) => {
    try {
        if (!agencyWorkId) return;

        const todos = await Todo.find({ agencyWork: agencyWorkId });
        const total = todos.length;

        if (total === 0) {
            // If no todos, we don't reset progress to 0 automatically because 
            // the user might want to switch back to manual mode with their previous value,
            // OR per requirement: "if that To Do List is created and not any work is completed... progress will be zero"
            // AND "if any work does not contain any To Do List then the user can manually maintain"
            // The requirement says: "if that To Do List is created and not any work is completed... progress will be zero".
            // It implies if there ARE todos, progress is calculated. If there are NO todos, it's manual.
            // So if total === 0, we do NOTHING to the progress, leaving it as manual.
            return;
        }

        const completed = todos.filter(t => t.isCompleted).length;
        const progress = Math.round((completed / total) * 100);

        await AgencyWork.findByIdAndUpdate(agencyWorkId, { progress });
    } catch (err) {
        console.error('Error updating agency work progress:', err);
    }
};

// Get all todos
router.get('/', async (req, res) => {
    try {
        const { agencyWorkId } = req.query;
        let query = {};

        if (agencyWorkId) {
            query.agencyWork = agencyWorkId;
        } else if (req.query.goalId) {
            query.goal = req.query.goalId;
        } else {
            // If no agencyWorkId and no goalId provided, return global todos
            query.agencyWork = { $exists: false };
            query.goal = { $exists: false };
        }

        const todos = await Todo.find(query).sort({ order: 1 });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reorder todos
router.put('/reorder', auth, async (req, res) => {
    try {
        const { todos } = req.body; // Array of { _id, order }

        if (!Array.isArray(todos)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const updates = todos.map(({ _id, order }) => {
            return Todo.findByIdAndUpdate(_id, { order });
        });

        await Promise.all(updates);
        res.json({ message: 'Todos reordered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a todo
router.post('/', auth, async (req, res) => {
    try {
        const { task, date, tags, priority, agencyWorkId } = req.body;

        // Find the highest order to append the new todo at the end
        const lastTodo = await Todo.findOne().sort({ order: -1 });
        const newOrder = lastTodo && lastTodo.order !== undefined ? lastTodo.order + 1 : 0;

        // Enforce author as current user
        const todoData = {
            task,
            date,
            author: req.user.name,
            tags,
            priority,
            order: newOrder
        };

        if (agencyWorkId) {
            todoData.agencyWork = agencyWorkId;
        }

        if (req.body.goalId) {
            todoData.goal = req.body.goalId;
        }

        const todo = new Todo(todoData);
        await todo.save();

        if (agencyWorkId) {
            await updateAgencyWorkProgress(agencyWorkId);
        }

        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle completion
router.put('/:id', auth, async (req, res) => {
    try {
        const todoToCheck = await Todo.findById(req.params.id);
        if (!todoToCheck) return res.status(404).json({ message: 'Todo not found' });

        if (todoToCheck.author && todoToCheck.author !== req.user.name) {
            return res.status(403).json({ message: 'Not authorized to edit this todo' });
        }

        const { isCompleted, date, task, tags, priority } = req.body;
        const updateData = {};
        if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
        if (date !== undefined) updateData.date = date;
        if (task !== undefined) updateData.task = task;
        if (tags !== undefined) updateData.tags = tags;
        if (priority !== undefined) updateData.priority = priority;

        const todo = await Todo.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (todo.agencyWork) {
            await updateAgencyWorkProgress(todo.agencyWork);
        }

        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete todo
router.delete('/:id', auth, async (req, res) => {
    try {
        const todoToCheck = await Todo.findById(req.params.id);
        if (!todoToCheck) return res.status(404).json({ message: 'Todo not found' });

        if (todoToCheck.author && todoToCheck.author !== req.user.name) {
            return res.status(403).json({ message: 'Not authorized to delete this todo' });
        }

        const agencyWorkId = todoToCheck.agencyWork; // Capture ID before deletion

        await Todo.findByIdAndDelete(req.params.id);

        if (agencyWorkId) {
            await updateAgencyWorkProgress(agencyWorkId);
        }

        res.json({ message: 'Todo deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
