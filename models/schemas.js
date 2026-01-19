const mongoose = require('mongoose');

const subspaceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, default: '' },
    assignedTo: { type: [String], default: [] },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const todoSchema = new mongoose.Schema({
    task: { type: String, required: true },
    date: { type: Date },
    author: { type: String, required: true },
    tags: { type: [String], default: [] },
    isCompleted: { type: Boolean, default: false }
});

const agencyWorkSchema = new mongoose.Schema({
    note: { type: String, required: true },
    assignedTo: { type: String, enum: ['Ansh', 'Navtej'], required: true },
    createdBy: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const recordSchema = new mongoose.Schema({
    title: { type: String, required: true },
    // 2D array for table data: 50 rows x 10 columns
    data: {
        type: [[String]],
        default: Array(50).fill(Array(10).fill(''))
    },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const dailyWorkSchema = new mongoose.Schema({
    dateLabel: { type: String, required: true },
    createdBy: { type: String }, // 'Ansh' or 'Navtej'
    date: { type: Date, required: true },
    content: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = {
    Subspace: mongoose.model('Subspace', subspaceSchema),
    Todo: mongoose.model('Todo', todoSchema),
    AgencyWork: mongoose.model('AgencyWork', agencyWorkSchema),
    Record: mongoose.model('Record', recordSchema),
    DailyWork: mongoose.model('DailyWork', dailyWorkSchema),
    User: mongoose.model('User', new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true }
    }))
};
