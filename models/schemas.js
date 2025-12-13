const mongoose = require('mongoose');

const subspaceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const todoSchema = new mongoose.Schema({
    task: { type: String, required: true },
    date: { type: Date },
    isCompleted: { type: Boolean, default: false }
});

const agencyWorkSchema = new mongoose.Schema({
    note: { type: String, required: true },
    assignedTo: { type: String, enum: ['Ansh', 'Navtej'], required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = {
    Subspace: mongoose.model('Subspace', subspaceSchema),
    Todo: mongoose.model('Todo', todoSchema),
    AgencyWork: mongoose.model('AgencyWork', agencyWorkSchema)
};
