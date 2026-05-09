const express = require('express');
const router = express.Router();
const { Todo, AgencyWork } = require('../models/schemas');
const auth = require('../middleware/auth');

// Helper to update Agency Work progress
const updateAgencyWorkProgress = async (agencyWorkId) => {
    try {
        if (!agencyWorkId) return;

        // Optimized: Use countDocuments instead of fetching all records
        const [total, completed] = await Promise.all([
            Todo.countDocuments({ agencyWork: agencyWorkId }),
            Todo.countDocuments({ agencyWork: agencyWorkId, isCompleted: true })
        ]);

        if (total === 0) {
            // If no todos, it's manual mode
            return;
        }

        const progress = Math.round((completed / total) * 100);
        await AgencyWork.findByIdAndUpdate(agencyWorkId, { progress });
    } catch (err) {
        console.error('Error updating agency work progress:', err);
    }
};

// Get all todos
router.get('/', async (req, res) => {
    try {
        console.time('Fetch Todos');
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

        const todos = await Todo.find(query).sort({ order: 1 }).lean();
        console.timeEnd('Fetch Todos');
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
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
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
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
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
    }
});

// Repeat a todo
router.post('/:id/repeat', auth, async (req, res) => {
    try {
        const { repeatUntil } = req.body;
        if (!repeatUntil) return res.status(400).json({ message: 'Repeat until date is required' });

        const originalTodo = await Todo.findById(req.params.id);
        if (!originalTodo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        const startDate = new Date(originalTodo.date);
        const endDate = new Date(repeatUntil);

        if (endDate <= startDate) {
            return res.status(400).json({ message: 'Repeat until date must be after the original task date' });
        }

        const newTodos = [];
        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1); // Start from the next day

        // Loop through each day until the end date
        while (currentDate <= endDate) {
            const todoData = {
                task: originalTodo.task,
                date: new Date(currentDate),
                author: originalTodo.author,
                tags: originalTodo.tags,
                priority: originalTodo.priority,
                agencyWork: originalTodo.agencyWork,
                goal: originalTodo.goal,
                order: originalTodo.order,
                isCompleted: false // New repetitions are always incomplete
            };
            newTodos.push(todoData);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (newTodos.length > 0) {
            await Todo.insertMany(newTodos);
            
            // Update agency work progress if needed
            if (originalTodo.agencyWork) {
                await updateAgencyWorkProgress(originalTodo.agencyWork);
            }
        }

        res.json({ 
            message: `Task repeated successfully until ${repeatUntil}`,
            count: newTodos.length 
        });
    } catch (err) {
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
    }
});

// Toggle completion
router.put('/:id', auth, async (req, res) => {
    try {
        const todoToCheck = await Todo.findById(req.params.id);
        if (!todoToCheck) return res.status(404).json({ message: 'Todo not found' });

        if (todoToCheck.author && todoToCheck.author !== req.user.name && req.user.username !== 'Ansh_Unfazed') {
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
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
    }
});

// Delete todo
router.delete('/:id', auth, async (req, res) => {
    try {
        const todoToCheck = await Todo.findById(req.params.id);
        if (!todoToCheck) return res.status(404).json({ message: 'Todo not found' });

        if (todoToCheck.author && todoToCheck.author !== req.user.name && req.user.username !== 'Ansh_Unfazed') {
            return res.status(403).json({ message: 'Not authorized to delete this todo' });
        }

        const agencyWorkId = todoToCheck.agencyWork; // Capture ID before deletion

        await Todo.findByIdAndDelete(req.params.id);

        if (agencyWorkId) {
            await updateAgencyWorkProgress(agencyWorkId);
        }

        res.json({ message: 'Todo deleted' });
    } catch (err) {
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
    }
});

module.exports = router;
