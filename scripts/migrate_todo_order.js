const mongoose = require('mongoose');
const { Todo } = require('../models/schemas');
require('dotenv').config();

const migrateTodos = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const todos = await Todo.find().sort({ date: 1, _id: 1 });
        console.log(`Found ${todos.length} todos to migrate.`);

        for (let i = 0; i < todos.length; i++) {
            if (!todos[i].author) todos[i].author = 'System';
            if (!todos[i].priority) todos[i].priority = 'Medium';
            todos[i].order = i;
            try {
                await todos[i].save();
            } catch (saveErr) {
                console.error(`Failed to save todo ${todos[i]._id}:`, JSON.stringify(saveErr.errors, null, 2));
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateTodos();
