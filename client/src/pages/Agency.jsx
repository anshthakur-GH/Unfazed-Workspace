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

    const [activeMobileTab, setActiveMobileTab] = useState('feed'); // 'feed' or 'add'

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex bg-card rounded-xl p-1 border border-border">
                <button
                    onClick={() => setActiveMobileTab('feed')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeMobileTab === 'feed' ? 'bg-accent text-white shadow-lg' : 'text-text-muted'}`}
                >
                    Updates Feed
                </button>
                <button
                    onClick={() => setActiveMobileTab('add')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeMobileTab === 'add' ? 'bg-accent text-white shadow-lg' : 'text-text-muted'}`}
                >
                    Add Update
                </button>
            </div>

            <div className="flex flex-col md:flex-row h-full gap-6 overflow-hidden">
                {/* Section 1: Latest Work Input */}
                <div className={`${activeMobileTab === 'add' ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 flex-col order-2 md:order-1 overflow-y-auto`}>
                    <div className="bg-card p-4 md:p-6 rounded-xl border border-border shadow-lg">
                        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                            <Send size={20} className="text-accent" />
                            Add Latest Work
                        </h2>
                        <form onSubmit={addWork} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase font-black tracking-widest text-text-muted mb-2">Description</label>
                                <RichTextEditor
                                    value={note}
                                    onChange={setNote}
                                    placeholder="What happened today?"
                                    minHeight="150px"
                                />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase font-black tracking-widest text-text-muted mb-2">Priority</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-xl p-3 text-sm text-text focus:border-accent"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-black tracking-widest text-text-muted mb-2">Deadline</label>
                                    <input
                                        type="date"
                                        className="w-full bg-background border border-border rounded-xl p-3 text-sm text-text focus:border-accent [color-scheme:dark]"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-black tracking-widest text-text-muted mb-2">Assign To</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-background border border-border rounded-xl p-3 text-sm text-text appearance-none focus:border-accent"
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
                                <label className="block text-xs uppercase font-black tracking-widest text-text-muted mb-2">Progress: {progress}%</label>
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
                                className="w-full bg-accent hover:bg-accent-hover text-white font-black uppercase tracking-widest py-3 md:py-4 rounded-xl text-[11px] md:text-sm transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Update'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Section 2: Work Progress Feed */}
                <div className={`${activeMobileTab === 'feed' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-card rounded-xl border border-border p-4 md:p-6 shadow-lg overflow-hidden order-1 md:order-2 h-full`}>
                    <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-accent" />
                        Updates Feed
                    </h2>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 pb-10">
                        {works.length === 0 ? (
                            <div className="text-center text-text-muted opacity-50 py-20">No updates yet.</div>
                        ) : (
                            works.map((work) => (
                                <div key={work._id} className="bg-background/40 backdrop-blur-sm border border-border/50 p-4 rounded-2xl flex flex-col gap-3 hover:border-accent/40 transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-accent/10 text-accent text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                                                {work.assignedTo}
                                            </span>
                                            <span className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${work.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                work.priority === 'Low' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                }`}>
                                                {work.priority || 'Medium'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-text-muted font-black uppercase tracking-tighter">
                                            {format(new Date(work.timestamp), 'MMM d, HH:mm')}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4 z-10">
                                        {editingId === work._id ? (
                                            <div className="flex-1 space-y-3">
                                                <RichTextEditor
                                                    value={editContent}
                                                    onChange={setEditContent}
                                                    minHeight="100px"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <span className="text-[10px] text-text-muted self-center uppercase font-black">
                                                        {saving ? 'Saving...' : 'Auto-Saved'}
                                                    </span>
                                                    <button onClick={cancelEditing} className="text-xs bg-accent text-white px-4 py-2 rounded-lg font-bold">
                                                        Close Editor
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col gap-3">
                                                <div
                                                    className="text-sm md:text-base text-text/90 leading-relaxed prose prose-invert max-w-none prose-p:my-0"
                                                    dangerouslySetInnerHTML={{ __html: work.note }}
                                                />
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-border/20 h-1.5 md:h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-accent transition-all duration-1000 ease-out"
                                                            style={{ width: `${work.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-base md:text-xl font-black text-accent">{work.progress}%</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => editingId === work._id ? cancelEditing() : startEditing(work)}
                                                className={`p-3 rounded-xl transition-all ${editingId === work._id ? 'bg-accent text-white' : 'bg-background/50 text-text-muted hover:text-accent border border-border/50'}`}
                                            >
                                                {editingId === work._id ? <X size={18} /> : <Edit2 size={18} />}
                                            </button>
                                            <button
                                                onClick={() => setActiveTodoWorkId(work._id)}
                                                className="p-3 bg-background/50 rounded-xl text-text-muted hover:text-accent border border-border/50 transition-all"
                                            >
                                                <CheckSquare size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteWork(work._id)}
                                                className="p-3 bg-background/50 rounded-xl text-text-muted hover:text-red-500 border border-border/50 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Todo List Modal - Mobile Drawer Style */}
            {activeTodoWorkId && (
                <div className="fixed inset-0 bg-black/90 flex items-end md:items-center justify-center z-[100] backdrop-blur-md">
                    <div className="bg-card w-full md:max-w-4xl h-[95vh] md:h-[90vh] rounded-t-3xl md:rounded-3xl overflow-hidden relative border-t md:border border-border shadow-2xl flex flex-col">
                        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mt-3 md:hidden" />
                        <div className="absolute top-4 right-4 z-[110]">
                            <button
                                onClick={() => setActiveTodoWorkId(null)}
                                className="bg-background/80 hover:bg-red-500 text-text-muted hover:text-white rounded-full p-3 transition-all border border-border shadow-xl"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 p-2 md:p-6 h-full overflow-hidden">
                            <TodoList
                                agencyWorkId={activeTodoWorkId}
                                title="Task Manager"
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
