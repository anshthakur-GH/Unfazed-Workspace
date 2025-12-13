const express = require('express');
const router = express.Router();
const { AgencyWork } = require('../models/schemas');

// Get all works
router.get('/', async (req, res) => {
    try {
        const works = await AgencyWork.find().sort({ timestamp: -1 });
        res.json(works);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add work
router.post('/', async (req, res) => {
    try {
        const { note, assignedTo } = req.body;
        const work = new AgencyWork({ note, assignedTo });
        await work.save();
        res.json(work);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete work
router.delete('/:id', async (req, res) => {
    try {
        await AgencyWork.findByIdAndDelete(req.params.id);
        res.json({ message: 'Work deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
