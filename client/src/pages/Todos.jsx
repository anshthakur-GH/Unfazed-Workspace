import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Calendar, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { format, isToday, isFuture, parseISO } from 'date-fns';

const Todos = () => {
    const [todos, setTodos] = useState([]);
    const [view, setView] = useState('today'); // 'today' or 'future'
    const [newTask, setNewTask] = useState('');
    const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const res = await axios.get('${API_URL}/api/todos');
            setTodos(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        // Extract author from token
        const token = localStorage.getItem('token');
        const author = token ? token.replace('fake-jwt-token-', '') : 'Unknown';

        try {
            const res = await axios.post(`${API_URL}/api/todos`, {
                task: newTask,
                date: newDate,
                author
            });
            setTodos([...todos, res.data]);
            setNewTask('');
        } catch (err) {
            console.error(err);
        }
    };

    const toggleTodo = async (id, currentStatus) => {
        try {
            const res = await axios.put(`${API_URL}/api/todos/${id}`, {
                isCompleted: !currentStatus
            });
            setTodos(todos.map(t => t._id === id ? res.data : t));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteTodo = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/todos/${id}`);
            setTodos(todos.filter(t => t._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const filteredTodos = todos.filter(t => {
        const taskDate = parseISO(t.date);
        if (view === 'today') return isToday(taskDate);
        if (view === 'future') return isFuture(taskDate) || (!isToday(taskDate) && taskDate > new Date());
        return true;
    });

    return (
        <div className="bg-card rounded-xl border border-border p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">To-Do List</h2>
                <div className="flex bg-background rounded-lg p-1 border border-border">
                    <button
                        onClick={() => setView('today')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'today' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text'
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setView('future')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'future' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text'
                            }`}
                    >
                        Upcoming
                    </button>
                </div>
            </div>

            <form onSubmit={addTodo} className="flex gap-4 mb-8">
                <input
                    type="text"
                    placeholder="Add a new task..."
                    className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-accent"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
                <input
                    type="date"
                    className="bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-accent"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                />
                <button type="submit" className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-bold transition-colors">
                    Add Task
                </button>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {filteredTodos.length === 0 ? (
                    <div className="text-center text-text-muted opacity-50 py-10">No tasks found for this view.</div>
                ) : (
                    filteredTodos.map(todo => (
                        <div
                            key={todo._id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${todo.isCompleted ? 'bg-background/50 border-border opacity-60' : 'bg-background border-border hover:border-accent/50'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => toggleTodo(todo._id, todo.isCompleted)}
                                    className={`text-accent transition-transform hover:scale-110`}
                                >
                                    {todo.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </button>
                                <span className={`text-lg ${todo.isCompleted ? 'line-through text-text-muted' : 'text-text'}`}>
                                    {todo.task}
                                </span>
                                {todo.author && (
                                    <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ml-2">
                                        {todo.author}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-muted bg-card px-3 py-1 rounded-full">
                                {format(parseISO(todo.date), 'MMM d, yyyy')}
                            </div>
                            <button
                                onClick={() => deleteTodo(todo._id)}
                                className="text-text-muted hover:text-red-500 transition-colors ml-2 p-2"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Todos;
