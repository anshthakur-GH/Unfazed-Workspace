const mongoose = require('mongoose');

const subspaceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, default: '' },
    assignedTo: { type: [String], default: [] },
    createdBy: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
subspaceSchema.index({ order: 1 });

const todoSchema = new mongoose.Schema({
    task: { type: String, required: true },
    date: { type: Date },
    author: { type: String, required: true },
    tags: { type: [String], default: [] },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true, default: 'Medium' },
    isCompleted: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    agencyWork: { type: mongoose.Schema.Types.ObjectId, ref: 'AgencyWork' },
    goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' }
});
todoSchema.index({ agencyWork: 1, order: 1 });
todoSchema.index({ goal: 1, order: 1 });
todoSchema.index({ author: 1 });

const agencyWorkSchema = new mongoose.Schema({
    note: { type: String, required: true },
    assignedTo: { type: String, enum: ['Ansh', 'Navtej', 'Ayush', 'Ansh Saxena'], required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    deadline: { type: Date },
    createdBy: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
agencyWorkSchema.index({ timestamp: -1 });
agencyWorkSchema.index({ progress: 1 });

const recordSchema = new mongoose.Schema({
    title: { type: String, required: true },
    // 2D array for table data: 50 rows x 10 columns
    data: {
        type: [[String]],
        default: () => Array.from({ length: 50 }, () => Array(10).fill(''))
    },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
recordSchema.index({ createdAt: -1 });

const goalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['global', 'individual'], default: 'individual' },
    member: { type: String }, // 'Ansh Thakur', 'Navtej', 'Ansh Saxena', 'Ayush'
    author: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    month: { type: String },
    year: { type: String },
    date: { type: Date },
    createdAt: { type: Date, default: Date.now }
});
goalSchema.index({ month: 1, year: 1, type: 1 });
goalSchema.index({ author: 1 });

const leadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: {
        type: String,
        enum: ['Interested', 'follow up scheduled', 'Meet scheduled', 'Feedback Scheduled', 'Pending', 'Not Interested', 'Follow-up Scheduled'],
        default: 'Interested'
    },
    platform: {
        type: String,
        enum: ['WhatsApp', 'Linkedin', 'Facebook', 'Instagram', 'X', 'Phone Call', 'LinkedIn', 'Other'],
        required: true
    },
    profileUrl: { type: String },
    email: { type: String },
    phone: { type: String },
    assignedTo: { type: String, required: true }, // The team member managing this lead
    lastContactDate: { type: Date, default: Date.now },
    reminderDate: { type: Date }, // Date when a follow-up is required
    nextMessage: { type: String, default: '' },
    notes: { type: String, default: '' },
    companyWebsite: { type: String },
    createdAt: { type: Date, default: Date.now }
});
leadSchema.index({ assignedTo: 1, reminderDate: 1 });
leadSchema.index({ status: 1 });

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
invoiceSchema.index({ date: -1 });
invoiceSchema.index({ invoiceNumber: 1 });

module.exports = {
    Subspace: mongoose.model('Subspace', subspaceSchema),
    Todo: mongoose.model('Todo', todoSchema),
    AgencyWork: mongoose.model('AgencyWork', agencyWorkSchema),
    Record: mongoose.model('Record', recordSchema),
    Goal: mongoose.model('Goal', goalSchema),
    Invoice: mongoose.model('Invoice', invoiceSchema),
    Lead: mongoose.model('Lead', leadSchema),
    User: mongoose.model('User', new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true }
    }))
};
