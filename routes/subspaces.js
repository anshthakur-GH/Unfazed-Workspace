const express = require('express');
const router = express.Router();
const { Subspace } = require('../models/schemas');

// Get all subspaces
router.get('/', async (req, res) => {
    try {
        const subspaces = await Subspace.find().sort({ createdAt: -1 });
        res.json(subspaces);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a subspace
router.post('/', async (req, res) => {
    try {
        const { title, assignedTo } = req.body;
        const subspace = new Subspace({ title, assignedTo });
        await subspace.save();
        res.json(subspace);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update subspace (add content/files represented as text)
router.put('/:id', async (req, res) => {
    try {
        const { content, title, assignedTo } = req.body;
        const updateData = {};
        if (content !== undefined) updateData.content = content;
        if (title !== undefined) updateData.title = title;
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

        const subspace = await Subspace.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(subspace);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete subspace
router.delete('/:id', async (req, res) => {
    try {
        await Subspace.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subspace deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
