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
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true, default: 'Medium' },
    isCompleted: { type: Boolean, default: false },
    agencyWork: { type: mongoose.Schema.Types.ObjectId, ref: 'AgencyWork' },
    goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' }
});

const agencyWorkSchema = new mongoose.Schema({
    note: { type: String, required: true },
    assignedTo: { type: String, enum: ['Ansh', 'Navtej'], required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    deadline: { type: Date },
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

const goalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    targetDate: { type: Date },
    assignedTo: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const invoiceSchema = new mongoose.Schema({
    type: { type: String, enum: ['invoice', 'quotation'], default: 'invoice' },
    invoiceNumber: { type: String, required: true },
    billTo: {
        name: { type: String, required: true },
        address: { type: String },
        email: { type: String }
    },
    date: { type: Date, default: Date.now },
    dueDate: { type: Date },
    items: [{
        description: { type: String },
        quantity: { type: Number },
        rate: { type: Number },
        amount: { type: Number }
    }],
    notes: { type: String },
    subtotal: { type: Number, default: 0 },
    tax: {
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: Number, default: 0 }
    },
    discount: {
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: Number, default: 0 }
    },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = {
    Subspace: mongoose.model('Subspace', subspaceSchema),
    Todo: mongoose.model('Todo', todoSchema),
    AgencyWork: mongoose.model('AgencyWork', agencyWorkSchema),
    Record: mongoose.model('Record', recordSchema),
    DailyWork: mongoose.model('DailyWork', dailyWorkSchema),
    Goal: mongoose.model('Goal', goalSchema),
    Invoice: mongoose.model('Invoice', invoiceSchema),
    User: mongoose.model('User', new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true }
    }))
};
