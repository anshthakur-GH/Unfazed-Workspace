import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Clock, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Agency = () => {
    const [works, setWorks] = useState([]);
    const [note, setNote] = useState('');
    const [assignedTo, setAssignedTo] = useState('Ansh'); // Default
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchWorks();
    }, []);

    const fetchWorks = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/agency');
            setWorks(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteWork = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/agency/${id}`);
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
            const res = await axios.post('http://localhost:5000/api/agency', { note, assignedTo });
            setWorks([res.data, ...works]);
            setNote('');
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full gap-8">
            {/* Section 1: Latest Work Input */}
            <div className="w-1/3 flex flex-col">
                <div className="bg-card p-6 rounded-xl border border-border shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Send size={24} className="text-accent" />
                        Add Latest Work
                    </h2>
                    <form onSubmit={addWork} className="space-y-4">
                        <div>
                            <label className="block text-sm text-text-muted mb-2">Work Description / Note</label>
                            <textarea
                                className="w-full bg-background border border-border rounded-lg p-3 text-text h-32 resize-none focus:outline-none focus:border-accent"
                                placeholder="What's the update?"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
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
            <div className="flex-1 flex flex-col bg-card rounded-xl border border-border p-6 shadow-lg overflow-hidden">
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
                                <div className="flex justify-between items-start gap-2">
                                    <p className="text-text leading-relaxed mt-1 flex-1">
                                        {work.note}
                                    </p>
                                    <button
                                        onClick={() => deleteWork(work._id)}
                                        className="text-text-muted hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Agency;
