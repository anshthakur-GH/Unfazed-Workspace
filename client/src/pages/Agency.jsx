import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { User, Clock, Send, Trash2, Edit2, Save, X, Calendar, AlertCircle, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import RichTextEditor from '../components/RichTextEditor';
import TodoList from '../components/TodoList';

const Agency = () => {
    const [works, setWorks] = useState([]);
    const [note, setNote] = useState('');
    const [assignedTo, setAssignedTo] = useState('Ansh'); // Default
    const [progress, setProgress] = useState(0);
    const [priority, setPriority] = useState('Medium');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTodoWorkId, setActiveTodoWorkId] = useState(null);

    useEffect(() => {
        fetchWorks();
    }, []);

    const fetchWorks = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/agency`);
            setWorks(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteWork = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/agency/${id}`);
            setWorks(works.filter(w => w._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const addWork = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/agency`, { note, assignedTo, progress, priority, deadline });
            setWorks([res.data, ...works]);
            setNote('');
            setProgress(0);
            setPriority('Medium');
            setDeadline('');
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // Editing Logic
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editProgress, setEditProgress] = useState(0);
    const [editPriority, setEditPriority] = useState('Medium');
    const [editDeadline, setEditDeadline] = useState('');
    const [saving, setSaving] = useState(false);

    const startEditing = (work) => {
        setEditingId(work._id);
        setEditContent(work.note);
        setEditProgress(work.progress || 0);
        setEditPriority(work.priority || 'Medium');
        setEditDeadline(work.deadline ? work.deadline.split('T')[0] : '');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent('');
        setEditProgress(0);
        setEditPriority('Medium');
        setEditDeadline('');
    };

    const saveEdit = async (id, content, prog, prio, dead) => {
        setSaving(true);
        try {
            const res = await axios.put(`${API_URL}/api/agency/${id}`, {
                note: content,
                progress: prog,
                priority: prio,
                deadline: dead
            });
            setWorks(works.map(w => w._id === id ? res.data : w));
            setSaving(false);
        } catch (err) {
            console.error(err);
            setSaving(false);
        }
    };

    // Auto-Save for Editing
    useEffect(() => {
        if (!editingId) return;

        const timer = setTimeout(() => {
            const work = works.find(w => w._id === editingId);
            if (work && (
                editContent !== work.note ||
                editProgress !== work.progress ||
                editPriority !== work.priority ||
                editDeadline !== (work.deadline ? work.deadline.split('T')[0] : '')
            )) {
                saveEdit(editingId, editContent, editProgress, editPriority, editDeadline);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [editContent, editProgress, editPriority, editDeadline, editingId]);

    return (
        <div className="flex flex-col md:flex-row h-full gap-8">
            {/* Section 1: Latest Work Input */}
            <div className="w-full md:w-1/3 flex flex-col order-2 md:order-1">
                <div className="bg-card p-6 rounded-xl border border-border shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Send size={24} className="text-accent" />
                        Add Latest Work
                    </h2>
                    <form onSubmit={addWork} className="space-y-4">
                        <div>
                            <label className="block text-sm text-text-muted mb-2">Work Description / Note</label>
                            <RichTextEditor
                                value={note}
                                onChange={setNote}
                                placeholder="What's the update?"
                                minHeight="128px"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-text-muted mb-2">Priority</label>
                                <select
                                    className="w-full bg-background border border-border rounded-lg p-3 text-text focus:outline-none focus:border-accent"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-text-muted mb-2">Deadline</label>
                                <input
                                    type="date"
                                    className="w-full bg-background border border-border rounded-lg p-3 text-text focus:outline-none focus:border-accent"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-text-muted mb-2">Assign To</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-background border border-border rounded-lg p-3 text-text appearance-none focus:outline-none focus:border-accent cursor-pointer"
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                >
                                    <option value="Ansh">Ansh</option>
                                    <option value="Navtej">Navtej</option>
                                </select>
                                <User className="absolute right-3 top-3 text-text-muted pointer-events-none" size={18} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-text-muted mb-2">Progress: {progress}%</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={(e) => setProgress(Number(e.target.value))}
                                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Work'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Section 2: Work Progress Feed */}
            <div className="flex-1 flex flex-col bg-card rounded-xl border border-border p-6 shadow-lg overflow-hidden order-1 md:order-2 h-[50vh] md:h-auto">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Clock size={24} className="text-accent" />
                    Work Progress
                </h2>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                    {works.length === 0 ? (
                        <div className="text-center text-text-muted opacity-50 py-10">No work updates yet.</div>
                    ) : (
                        works.map((work) => (
                            <div key={work._id} className="bg-background border border-border p-4 rounded-lg flex flex-col gap-2 hover:border-accent/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        {work.assignedTo}
                                    </span>
                                    <span className="text-xs text-text-muted font-mono">
                                        {format(new Date(work.timestamp), 'MMM d, HH:mm')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mt-1 mb-2">
                                    <span className={`text-xs px-2 py-0.5 rounded border ${work.priority === 'High' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                        work.priority === 'Low' ? 'border-green-500 text-green-500 bg-green-500/10' :
                                            'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                                        }`}>
                                        {work.priority || 'Medium'}
                                    </span>
                                    {work.deadline && (
                                        <span className="text-xs text-text-muted flex items-center gap-1">
                                            <Calendar size={12} />
                                            {format(new Date(work.deadline), 'MMM d, yyyy')}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between items-start gap-2">
                                    {editingId === work._id ? (
                                        <div className="flex-1">
                                            <RichTextEditor
                                                value={editContent}
                                                onChange={setEditContent}
                                                minHeight="80px"
                                                className="mb-2"
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <label className="text-xs text-text-muted mb-1 block">Priority</label>
                                                    <select
                                                        className="w-full bg-background border border-border rounded p-2 text-text text-sm"
                                                        value={editPriority}
                                                        onChange={(e) => setEditPriority(e.target.value)}
                                                    >
                                                        <option value="High">High</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="Low">Low</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-text-muted mb-1 block">Deadline</label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-background border border-border rounded p-2 text-text text-sm"
                                                        value={editDeadline}
                                                        onChange={(e) => setEditDeadline(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-2">
                                                <label className="text-xs text-text-muted mb-1 block">
                                                    Progress: {editProgress}%
                                                    {work.hasTodos && <span className="ml-2 text-accent italic">(Auto-calculated from Tasks)</span>}
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={editProgress}
                                                    onChange={(e) => setEditProgress(Number(e.target.value))}
                                                    disabled={work.hasTodos}
                                                    className={`w-full h-1 bg-border rounded-lg appearance-none ${work.hasTodos ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} accent-accent`}
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <span className="text-xs text-text-muted self-center">
                                                    {saving ? 'Auto-saving...' : 'Saved'}
                                                </span>
                                                <button onClick={cancelEditing} className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded hover:bg-red-500/20">
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div
                                                className="text-text leading-relaxed mt-1 whitespace-pre-wrap prose prose-invert max-w-none prose-p:my-0 prose-headings:my-1"
                                                dangerouslySetInnerHTML={{ __html: work.note }}
                                            />
                                            {work.progress !== undefined && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-full bg-border/30 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-accent transition-all duration-500"
                                                            style={{ width: `${work.progress}%` }}
                                                        />
                                                    </div>
                                                    <span
                                                        className="text-2xl font-bold text-accent"
                                                        style={{
                                                            textShadow: '0 0 10px rgba(var(--accent-rgb), 0.5), 0 0 20px rgba(var(--accent-rgb), 0.3)'
                                                        }}
                                                    >
                                                        {work.progress}%
                                                    </span>
                                                    {work.hasTodos && (
                                                        <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                                            AUTO
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => editingId === work._id ? cancelEditing() : startEditing(work)}
                                            className={`text-text-muted transition-colors p-1 ${editingId === work._id ? 'text-accent' : 'hover:text-accent'}`}
                                        >
                                            {editingId === work._id ? <X size={16} /> : <Edit2 size={16} />}
                                        </button>
                                        <button
                                            onClick={() => setActiveTodoWorkId(work._id)}
                                            className="text-text-muted hover:text-accent transition-colors p-1"
                                            title="To-Do List"
                                        >
                                            <CheckSquare size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteWork(work._id)}
                                            className="text-text-muted hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {/* Todo List Modal */}
            {activeTodoWorkId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-4xl h-[90vh] rounded-xl overflow-hidden relative border border-border shadow-2xl flex flex-col">
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setActiveTodoWorkId(null)}
                                className="bg-background/80 hover:bg-red-500 text-text-muted hover:text-white rounded-full p-2 transition-all border border-border hover:border-red-500"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 p-2 h-full">
                            <TodoList
                                agencyWorkId={activeTodoWorkId}
                                title="Work Tasks"
                                onUpdate={fetchWorks}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agency;
