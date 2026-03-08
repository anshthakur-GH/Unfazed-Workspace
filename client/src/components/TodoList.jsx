import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Calendar, CheckCircle2, Circle, Trash2, Tag, CalendarClock, Plus, X, GripVertical } from 'lucide-react';
import { format, isToday, isFuture, parseISO } from 'date-fns';
import CustomCalendar from './CustomCalendar';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const AVAILABLE_TAGS = ['CC', 'Follow-up', 'Project', 'Website', 'Lead', 'Meet', 'Outreach', 'Personal'];

const SortableTodoItem = ({ todo, toggleTodo, startEditing, editingTodoId, editingText, setEditingText, updateTodoTask, readOnly, isAdmin, view, reschedulingId, setReschedulingId, rescheduleTodo, deleteTodo }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: todo._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 md:p-4 rounded-lg border transition-all ${todo.isCompleted ? 'bg-background/50 border-border opacity-60' : 'bg-background border-border hover:border-accent/50'
                } ${isDragging ? 'shadow-2xl border-accent' : ''}`}
        >
            <div className="flex items-center gap-4 flex-1">
                {(!readOnly || isAdmin) && (
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-text-muted hover:text-accent p-1">
                        <GripVertical size={20} />
                    </div>
                )}
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
                        className={`text-base md:text-lg cursor-pointer ${todo.isCompleted ? 'line-through text-text-muted' : 'text-text'}`}
                        onDoubleClick={() => startEditing(todo)}
                        title={(readOnly && !isAdmin) ? "" : "Double click to edit"}
                    >
                        {todo.task}
                    </span>
                )}
                {todo.author && (
                    <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ml-2">
                        {todo.author}
                    </span>
                )}
                {todo.priority && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ml-2 border ${todo.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        todo.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'bg-green-500/10 text-green-500 border-green-500/20'
                        }`}>
                        {todo.priority}
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
                    <div className="text-sm text-text-muted bg-card px-3 py-1 rounded-full border border-border flex items-center gap-2">
                        {format(parseISO(todo.date), 'MMM d, yyyy')}
                    </div>

                    {(!readOnly || isAdmin) && (
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
                    )}
                </div>
                {(!readOnly || isAdmin) && (
                    <button
                        onClick={() => deleteTodo(todo._id)}
                        className="text-text-muted hover:text-red-500 transition-colors p-2"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

const TodoList = ({ agencyWorkId, goalId, title = "To-Do List", onUpdate, readOnly = false }) => {
    const [todos, setTodos] = useState([]);
    const [view, setView] = useState('today'); // 'today', 'future', 'previous'
    const [newTask, setNewTask] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [priority, setPriority] = useState(''); // 'High', 'Medium', 'Low'
    const [reschedulingId, setReschedulingId] = useState(null);
    const [editingTodoId, setEditingTodoId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [showMobileForm, setShowMobileForm] = useState(false);
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('username') === 'Ansh_Unfazed');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchTodos();
    }, [agencyWorkId, goalId]);

    const fetchTodos = async () => {
        try {
            const params = {};
            if (agencyWorkId) {
                params.agencyWorkId = agencyWorkId;
            } else if (goalId) {
                params.goalId = goalId;
            }
            const res = await axios.get(`${API_URL}/api/todos`, { params });
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

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = sortedTodos.findIndex((item) => item._id === active.id);
            const newIndex = sortedTodos.findIndex((item) => item._id === over.id);

            const newSortedTodos = arrayMove(sortedTodos, oldIndex, newIndex);

            // Calculate new orders for todos that moved
            const reorderedTodos = newSortedTodos.map((todo, index) => ({
                _id: todo._id,
                order: index
            }));

            // Optimistic update
            const updatedTodos = todos.map(t => {
                const reorderMatch = reorderedTodos.find(rt => rt._id === t._id);
                return reorderMatch ? { ...t, order: reorderMatch.order } : t;
            });
            setTodos(updatedTodos);

            try {
                await axios.put(`${API_URL}/api/todos/reorder`, {
                    todos: reorderedTodos
                });
            } catch (err) {
                console.error("Failed to reorder:", err);
                fetchTodos(); // Rollback on error
            }
        }
    };

    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        if (!priority) {
            alert("Please select a priority level (High, Medium, Low) before adding the task.");
            return;
        }

        const token = localStorage.getItem('token');
        const author = token ? token.replace('fake-jwt-token-', '') : 'Unknown';

        try {
            const res = await axios.post(`${API_URL}/api/todos`, {
                task: newTask,
                date: new Date(newDate).toISOString(),
                author,
                tags: selectedTags,
                priority,
                agencyWorkId: agencyWorkId || undefined,
                goalId: goalId || undefined
            });
            setTodos([...todos, res.data]);
            setNewTask('');
            setSelectedTags([]);
            setPriority('');
            if (onUpdate) onUpdate();
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
            if (onUpdate) onUpdate();
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
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const startEditing = (todo) => {
        if (readOnly && !isAdmin) return;
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
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteTodo = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/todos/${id}`);
            setTodos(todos.filter(t => t._id !== id));
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredTodos = todos.filter(t => {
        const taskDate = parseISO(t.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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
    });

    const sortedTodos = [...filteredTodos].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const priorityA = priorityMap[a.priority] || 0;
        const priorityB = priorityMap[b.priority] || 0;
        if (priorityA !== priorityB) {
            return priorityB - priorityA;
        }
        return new Date(a.date) - new Date(b.date);
    });

    return (
        <div className="bg-card rounded-xl border border-border p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white">{title}</h2>
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


            {(!readOnly || isAdmin) && (
                <div className="mb-8">
                    <button
                        onClick={() => setShowMobileForm(!showMobileForm)}
                        className="w-full md:hidden bg-accent/10 border border-accent/20 text-accent font-black py-4 rounded-2xl flex items-center justify-center gap-2 mb-4 active:scale-95 transition-all"
                    >
                        {showMobileForm ? <X size={20} /> : <Plus size={20} />}
                        {showMobileForm ? 'Close Form' : 'Add New Task'}
                    </button>

                    <form
                        onSubmit={addTodo}
                        className={`flex flex-col gap-4 ${!showMobileForm ? 'hidden md:flex' : 'flex'} bg-secondary/10 p-4 md:p-0 rounded-2xl md:bg-transparent border border-border md:border-0`}
                    >
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <input
                                    type="text"
                                    placeholder="What needs to be done?"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-4 md:py-3 text-white focus:outline-none focus:border-accent transition-all pl-12"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                />
                                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={20} />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1 sm:flex-none">
                                    <button
                                        type="button"
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-3 bg-background border border-border rounded-xl px-5 py-4 md:py-3 text-text hover:border-accent transition-colors min-w-[180px]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar size={18} className="text-accent" />
                                            <span className="font-bold">{newDate === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(parseISO(newDate), 'MMM d, yyyy')}</span>
                                        </div>
                                        <div className="sm:hidden text-text-muted">▼</div>
                                    </button>
                                    {showCalendar && (
                                        <div className="fixed sm:absolute inset-0 sm:inset-auto sm:top-full sm:left-0 z-[60] flex items-center justify-center sm:block p-4 sm:p-0 bg-black/60 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-0">
                                            <div className="bg-card border border-border rounded-2xl shadow-2xl p-2 scale-110 sm:scale-100">
                                                <CustomCalendar
                                                    selectedDate={newDate}
                                                    onChange={(date) => {
                                                        setNewDate(date);
                                                        setShowCalendar(false);
                                                    }}
                                                    onClose={() => setShowCalendar(false)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-1.5 flex-1 sm:flex-none">
                                    {['High', 'Medium', 'Low'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 sm:px-4 py-3 sm:py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${priority === p
                                                ? (p === 'High' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                                                    p === 'Medium' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' :
                                                        'bg-green-500 text-white shadow-lg shadow-green-500/20')
                                                : 'text-text-muted hover:text-text hover:bg-secondary/20'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="bg-accent hover:bg-accent-hover text-white px-8 py-3.5 md:py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-accent/20 text-[11px] md:text-sm">
                                Add Task
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Assign Tags</span>
                            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
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
                                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${selectedTags.includes(tag)
                                            ? 'bg-accent text-white border-accent shadow-md shadow-accent/10'
                                            : 'bg-background text-text-muted border-border hover:border-accent'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {sortedTodos.length === 0 ? (
                    <div className="text-center text-text-muted opacity-50 py-10">No tasks found for this view.</div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext
                            items={sortedTodos.map(t => t._id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {sortedTodos.map((todo) => (
                                    <SortableTodoItem
                                        key={todo._id}
                                        todo={todo}
                                        toggleTodo={toggleTodo}
                                        startEditing={startEditing}
                                        editingTodoId={editingTodoId}
                                        editingText={editingText}
                                        setEditingText={setEditingText}
                                        updateTodoTask={updateTodoTask}
                                        readOnly={readOnly}
                                        isAdmin={isAdmin}
                                        view={view}
                                        reschedulingId={reschedulingId}
                                        setReschedulingId={setReschedulingId}
                                        rescheduleTodo={rescheduleTodo}
                                        deleteTodo={deleteTodo}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div >
    );
};

export default TodoList;
