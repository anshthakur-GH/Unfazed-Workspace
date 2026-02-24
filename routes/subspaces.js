const express = require('express');
const router = express.Router();
const { Subspace } = require('../models/schemas');
const auth = require('../middleware/auth');

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
// Create a subspace
router.post('/', auth, async (req, res) => {
    try {
        const { title, assignedTo } = req.body;
        const subspace = new Subspace({
            title,
            assignedTo,
            createdBy: req.user.name
        });
        await subspace.save();
        res.json(subspace);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update subspace (add content/files represented as text)
// Update subspace (add content/files represented as text)
router.put('/:id', auth, async (req, res) => {
    try {
        const subspaceToCheck = await Subspace.findById(req.params.id);
        if (!subspaceToCheck) return res.status(404).json({ message: 'Subspace not found' });

        if (subspaceToCheck.createdBy && subspaceToCheck.createdBy !== req.user.name && req.user.username !== 'Ansh_Unfazed') {
            return res.status(403).json({ message: 'Not authorized to edit this subspace' });
        }

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
// Delete subspace
router.delete('/:id', auth, async (req, res) => {
    try {
        const subspaceToCheck = await Subspace.findById(req.params.id);
        if (!subspaceToCheck) return res.status(404).json({ message: 'Subspace not found' });

        if (subspaceToCheck.createdBy && subspaceToCheck.createdBy !== req.user.name && req.user.username !== 'Ansh_Unfazed') {
            return res.status(403).json({ message: 'Not authorized to delete this subspace' });
        }

        await Subspace.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subspace deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
