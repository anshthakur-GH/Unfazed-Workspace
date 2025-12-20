import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Calendar, CheckCircle2, Circle, Trash2, Tag, CalendarClock } from 'lucide-react';
import { format, isToday, isFuture, parseISO } from 'date-fns';
import CustomCalendar from '../components/CustomCalendar';

const AVAILABLE_TAGS = ['CC', 'SEO', 'Website', 'Lead', 'Meet', 'Outreach', 'Personal'];

const Todos = () => {
    const [todos, setTodos] = useState([]);
    const [view, setView] = useState('today'); // 'today', 'future', 'previous'
    const [newTask, setNewTask] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [reschedulingId, setReschedulingId] = useState(null);
    const [editingTodoId, setEditingTodoId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/todos`);
            if (Array.isArray(res.data)) {
                setTodos(res.data);
            } else {
                console.error("Invalid API response format (expected array):", res.data);
                setTodos([]);
            }
        } catch (err) {
            console.error(err);
            setTodos([]);
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
                author,
                tags: selectedTags
            });
            setTodos([...todos, res.data]);
            setNewTask('');
            setSelectedTags([]);
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

    const rescheduleTodo = async (id, newDate) => {
        try {
            const res = await axios.put(`${API_URL}/api/todos/${id}`, {
                date: newDate
            });
            setTodos(todos.map(t => t._id === id ? res.data : t));
            setReschedulingId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const startEditing = (todo) => {
        setEditingTodoId(todo._id);
        setEditingText(todo.task);
    };

    const updateTodoTask = async () => {
        if (!editingTodoId || !editingText.trim()) {
            setEditingTodoId(null);
            return;
        }
        try {
            const res = await axios.put(`${API_URL}/api/todos/${editingTodoId}`, {
                task: editingText
            });
            setTodos(todos.map(t => t._id === editingTodoId ? res.data : t));
            setEditingTodoId(null);
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
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to midnight for comparison

        if (view === 'previous') {
            return taskDate < today;
        }
        if (view === 'today') {
            const isTaskToday = isToday(taskDate);
            const isOverdue = taskDate < today && !t.isCompleted;
            return isTaskToday || isOverdue;
        }
        if (view === 'future') return isFuture(taskDate) || (!isToday(taskDate) && taskDate > today);
        return true;
    }).sort((a, b) => {
        if (view === 'today') {
            // Sort overdue tasks first
            const dateA = parseISO(a.date);
            const dateB = parseISO(b.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isOverdueA = dateA < today && !a.isCompleted;
            const isOverdueB = dateB < today && !b.isCompleted;

            if (isOverdueA && !isOverdueB) return -1;
            if (!isOverdueA && isOverdueB) return 1;
        }
        return 0; // Keep original order otherwise (or add date sorting if needed)
    });

    return (
        <div className="bg-card rounded-xl border border-border p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white">To-Do List</h2>
                <div className="flex bg-background rounded-lg p-1 border border-border">
                    <button
                        onClick={() => setView('previous')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'previous' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text'
                            }`}
                    >
                        Previous
                    </button>
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


            <form onSubmit={addTodo} className="flex flex-col gap-4 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Add a new task..."
                        className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-accent"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />
                    <div className="relative">
                        <button type="button" onClick={() => setShowCalendar(!showCalendar)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-background border border-border rounded-lg px-4 py-3 text-text hover:border-accent transition-colors min-w-[160px]">
                            <Calendar size={20} className="text-accent" />
                            <span>{newDate === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(parseISO(newDate), 'MMM d, yyyy')}</span>
                        </button>
                        {showCalendar && (
                            <div className="absolute top-full left-0 mt-2 z-50">
                                <CustomCalendar
                                    selectedDate={newDate}
                                    onChange={(date) => {
                                        setNewDate(date);
                                        setShowCalendar(false);
                                    }}
                                    onClose={() => setShowCalendar(false)}
                                />
                            </div>
                        )}
                    </div>
                    <button type="submit" className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-bold transition-colors w-full md:w-auto">
                        Add Task
                    </button>
                </div>

                {/* Tags Selection */}
                <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map(tag => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => {
                                if (selectedTags.includes(tag)) {
                                    setSelectedTags(selectedTags.filter(t => t !== tag));
                                } else {
                                    setSelectedTags([...selectedTags, tag]);
                                }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${selectedTags.includes(tag)
                                ? 'bg-accent text-white border-accent'
                                : 'bg-background text-text-muted border-border hover:border-accent'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
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
                                {editingTodoId === todo._id ? (
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        onBlur={updateTodoTask}
                                        onKeyDown={(e) => e.key === 'Enter' && updateTodoTask()}
                                        autoFocus
                                        className="text-lg bg-transparent border-b border-accent focus:outline-none flex-1 min-w-[200px]"
                                    />
                                ) : (
                                    <span
                                        className={`text-lg cursor-pointer ${todo.isCompleted ? 'line-through text-text-muted' : 'text-text'}`}
                                        onDoubleClick={() => startEditing(todo)}
                                        title="Double click to edit"
                                    >
                                        {todo.task}
                                    </span>
                                )}
                                {todo.author && (
                                    <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ml-2">
                                        {todo.author}
                                    </span>
                                )}
                                {todo.tags && todo.tags.length > 0 && (
                                    <div className="flex gap-1 ml-2">
                                        {todo.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full border border-border">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    {view === 'today' && parseISO(todo.date) < new Date().setHours(0, 0, 0, 0) && !todo.isCompleted && (
                                        <span className="text-xs text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">Overdue</span>
                                    )}
                                    <div className="text-sm text-text-muted bg-card px-3 py-1 rounded-full border border-border">
                                        {format(parseISO(todo.date), 'MMM d, yyyy')}
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setReschedulingId(reschedulingId === todo._id ? null : todo._id)}
                                            className="text-text-muted hover:text-accent transition-colors p-1"
                                            title="Reschedule"
                                        >
                                            <CalendarClock size={16} />
                                        </button>
                                        {reschedulingId === todo._id && (
                                            <div className="absolute top-full right-0 mt-2 z-50">
                                                <CustomCalendar
                                                    selectedDate={todo.date}
                                                    onChange={(date) => rescheduleTodo(todo._id, date)}
                                                    onClose={() => setReschedulingId(null)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteTodo(todo._id)}
                                    className="text-text-muted hover:text-red-500 transition-colors p-2"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};

export default Todos;
