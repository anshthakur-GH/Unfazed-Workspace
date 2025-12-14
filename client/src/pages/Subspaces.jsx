import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Plus, FileText, Save, Trash2 } from 'lucide-react';

const Subspaces = () => {
    const [subspaces, setSubspaces] = useState([]);
    const [selectedSubspace, setSelectedSubspace] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSubspaces();
    }, []);

    useEffect(() => {
        if (selectedSubspace) {
            setNoteContent(selectedSubspace.content || '');
        }
    }, [selectedSubspace]);

    const fetchSubspaces = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/subspaces`);
            if (Array.isArray(res.data)) {
                setSubspaces(res.data);
            } else {
                console.error("Invalid API response format (expected array):", res.data);
                setSubspaces([]);
            }
        } catch (err) {
            console.error(err);
            setSubspaces([]);
        }
    };

    const createSubspace = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/api/subspaces`, { title: newTitle });
            setSubspaces([res.data, ...subspaces]);
            setNewTitle('');
            setSelectedSubspace(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const updateContent = async () => {
        if (!selectedSubspace) return;
        setLoading(true);
        try {
            const res = await axios.put(`${API_URL}/api/subspaces/${selectedSubspace._id}`, {
                content: noteContent
            });
            // Update local state
            setSubspaces(subspaces.map(s => s._id === res.data._id ? res.data : s));
            setSelectedSubspace(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const deleteSubspace = async (e, id) => {
        e.stopPropagation(); // Prevent selection when clicking delete
        if (!window.confirm("Are you sure you want to delete this subspace?")) return;

        try {
            await axios.delete(`${API_URL}/api/subspaces/${id}`);
            setSubspaces(subspaces.filter(s => s._id !== id));
            if (selectedSubspace && selectedSubspace._id === id) {
                setSelectedSubspace(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex h-full gap-6">
            {/* List of Subspaces */}
            <div className="w-1/3 flex flex-col gap-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                    <h2 className="text-xl font-bold text-white mb-4">Subspaces</h2>
                    <form onSubmit={createSubspace} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="New Subspace..."
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <button type="submit" className="bg-accent hover:bg-accent-hover text-white p-2 rounded-lg transition-colors">
                            <Plus size={20} />
                        </button>
                    </form>
                    <div className="space-y-2 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                        {subspaces.map(sub => (
                            <div
                                key={sub._id}
                                onClick={() => setSelectedSubspace(sub)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedSubspace?._id === sub._id
                                    ? 'bg-accent/10 border-accent text-accent'
                                    : 'bg-background hover:bg-border/50 border-transparent text-text-muted'
                                    }`}
                            >
                                <div className="font-medium">{sub.title}</div>

                                <div className="flex justify-between items-center mt-1">
                                    <div className="text-xs opacity-70">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </div>
                                    <button
                                        onClick={(e) => deleteSubspace(e, sub._id)}
                                        className="text-text-muted hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-card rounded-xl border border-border p-6 flex flex-col">
                {selectedSubspace ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">{selectedSubspace.title}</h2>
                            <button
                                onClick={updateContent}
                                disabled={loading}
                                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Save size={18} />
                                {loading ? 'Saving...' : 'Save Notes'}
                            </button>
                        </div>
                        <textarea
                            className="flex-1 w-full bg-background border border-border rounded-xl p-4 text-text resize-none focus:outline-none focus:border-accent"
                            placeholder="Type your notes here... (Simulated file uploads: just type '[File: name.pdf]')"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                        ></textarea>
                        <div className="mt-2 text-xs text-text-muted">
                            Auto-fetch enabled. Last saved: {new Date().toLocaleTimeString()}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50">
                        <FileText size={48} className="mb-4" />
                        <p>Select a subspace to view notes</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Subspaces;
