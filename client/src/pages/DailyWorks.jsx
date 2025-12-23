import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { format } from 'date-fns';
import { Plus, Edit2, Check, Clock, Calendar as CalendarIcon, Save } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: token } : {};
};

const DailyWorks = () => {
    const [works, setWorks] = useState([]);
    const [selectedWorkId, setSelectedWorkId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Editing State
    const [content, setContent] = useState('');
    const [dateLabel, setDateLabel] = useState('');
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Ctrl+S Shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveWork();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, dateLabel, selectedWorkId]);

    useEffect(() => {
        fetchWorks();
    }, []);

    const fetchWorks = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/daily-works`);
            setWorks(res.data);
            if (res.data.length > 0) {
                // Select latest work by default
                selectWork(res.data[0]);
            } else {
                // If no works, maybe offer to create today's?
                // For now just stop loading
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const selectWork = (work) => {
        if (!work) return;
        setSelectedWorkId(work._id);
        setContent(work.content || '');
        setDateLabel(work.dateLabel || format(new Date(work.date), 'd MMM yyyy'));
        setIsEditingLabel(false);
    };

    const handleCreateToday = async () => {
        const todayLabel = format(new Date(), 'd MMM yyyy');

        // Check if today (by label) already exists to prevent dupes (simple check)
        const exists = works.find(w => w.dateLabel === todayLabel);
        if (exists) {
            selectWork(exists);
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/api/daily-works`, {
                date: new Date(),
                dateLabel: todayLabel,
                content: ''
            }, {
                headers: getAuthHeader()
            });
            const newWorks = [res.data, ...works];
            setWorks(newWorks);
            selectWork(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const saveWork = async () => {
        if (!selectedWorkId) return;
        setSaving(true);
        try {
            const res = await axios.put(`${API_URL}/api/daily-works/${selectedWorkId}`, {
                content: content,
                dateLabel: dateLabel
            });

            // Update local list
            setWorks(works.map(w => w._id === selectedWorkId ? res.data : w));
            setSaving(false);
            setLastSaved(new Date());
        } catch (err) {
            console.error(err);
            setSaving(false);
        }
    };

    const updateLabel = async () => {
        if (!selectedWorkId) return;
        // Just triggers save, but specifically for label change UI
        setIsEditingLabel(false);
        saveWork();
    };

    // Auto-save content debounce
    useEffect(() => {
        if (!selectedWorkId) return;

        const currentWork = works.find(w => w._id === selectedWorkId);
        if (currentWork && (content !== currentWork.content || dateLabel !== currentWork.dateLabel)) {
            const timer = setTimeout(() => {
                saveWork();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [content, dateLabel]);

    if (loading) return <div className="p-10 text-text-muted">Loading...</div>;

    const selectedWork = works.find(w => w._id === selectedWorkId);

    return (
        <div className="flex h-full gap-6">
            {/* Sidebar List */}
            <div className="w-64 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/20">
                    <h3 className="font-bold text-text-muted text-sm uppercase tracking-wider">History</h3>
                    <button
                        onClick={handleCreateToday}
                        className="p-1 hover:bg-accent hover:text-white rounded-full transition-colors text-accent"
                        title="Add Today's Work"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {works.length === 0 ? (
                        <div className="p-4 text-center text-xs text-text-muted">No records yet.</div>
                    ) : (
                        works.map(work => (
                            <div
                                key={work._id}
                                onClick={() => selectWork(work)}
                                className={`p-4 border-b border-border cursor-pointer transition-all hover:bg-secondary/30 ${selectedWorkId === work._id ? 'bg-accent/10 border-l-4 border-l-accent' : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="font-bold text-sm text-text mb-1 truncate flex items-center gap-2">
                                    {work.dateLabel}
                                    {work.createdBy && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${work.createdBy === 'Ansh' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                                            {work.createdBy}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-text-muted flex items-center gap-1">
                                    <Clock size={12} />
                                    {format(new Date(work.updatedAt), 'HH:mm')}
                                    <span className="mx-1">•</span>
                                    {work.content ? 'Has content' : 'Empty'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-lg">
                {selectedWorkId ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/10">
                            <div className="flex-1">
                                {isEditingLabel ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={dateLabel}
                                            onChange={(e) => setDateLabel(e.target.value)}
                                            className="bg-background border border-border rounded px-3 py-1 text-xl font-bold text-text focus:outline-none focus:border-accent"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && updateLabel()}
                                        />
                                        <button onClick={updateLabel} className="p-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors">
                                            <Check size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 group">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <CalendarIcon className="text-accent" size={24} />
                                            {dateLabel}
                                        </h2>
                                        <button
                                            onClick={() => setIsEditingLabel(true)}
                                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent transition-all p-1"
                                            title="Rename"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                )}
                                <div className="text-sm text-text-muted mt-1">
                                    Created: {format(new Date(selectedWork.createdAt), 'PP pp')}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <div className={`text-xs font-mono transition-opacity ${saving ? 'opacity-100' : 'opacity-0'} text-accent`}>
                                        Saving...
                                    </div>
                                    {lastSaved && !saving && (
                                        <div className="text-[10px] text-text-muted">
                                            Saved: {lastSaved.toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-background p-2 rounded-lg border border-border">
                                    <Save size={20} className={saving ? 'text-accent animate-pulse' : 'text-text-muted'} />
                                </div>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="flex-1 p-6 overflow-hidden flex flex-col">
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Write your daily work updates here..."
                                className="flex-1 h-full"
                                minHeight="100%"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-10">
                        <CalendarIcon size={64} className="mb-4 opacity-20" />
                        <p className="text-lg mb-4">Select a day working record or create a new one.</p>
                        <button
                            onClick={handleCreateToday}
                            className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-accent/20 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Create Record for Today
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyWorks;
