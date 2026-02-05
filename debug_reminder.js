const mongoose = require('mongoose');
require('dotenv').config();
// Import schemas properly based on how they are exported
const { Todo } = require('./models/schemas');

const checkTodo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const todos = await Todo.find({ task: /Testing email reminder/i });
        console.log(`Found ${todos.length} matching todos.`);

        todos.forEach(t => {
            console.log('--- Todo ---');
            console.log(`Task: ${t.task}`);
            console.log(`Date (Stored): ${t.date}`);
            console.log(`Date (Local): ${t.date.toLocaleString()}`);
            console.log(`Is Completed: ${t.isCompleted}`);
            console.log(`Reminder Sent: ${t.reminderSent}`);
            console.log(`Now (Server): ${new Date().toLocaleString()}`);
            console.log(`Is Due? ${t.date <= new Date()}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkTodo();
