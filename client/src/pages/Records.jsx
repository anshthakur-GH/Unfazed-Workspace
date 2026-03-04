import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Plus, Save, ChevronLeft, Trash2, Table } from 'lucide-react';
import { format } from 'date-fns';

const Records = () => {
    const [records, setRecords] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [isAdmin] = useState(localStorage.getItem('username') === 'Ansh_Unfazed');

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/records`);
            setRecords(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const createRecord = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            const res = await axios.post(`${API_URL}/api/records`, { title: newTitle });
            setRecords([res.data, ...records]);
            setNewTitle('');
            setIsCreating(false);
            setSelectedRecord(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const [lastSaved, setLastSaved] = useState(null);

    useEffect(() => {
        if (selectedRecord) {
            setEditedTitle(selectedRecord.title);
        }
    }, [selectedRecord]);

    useEffect(() => {
        if (!selectedRecord) return;

        const originalRecord = records.find(r => r._id === selectedRecord._id);
        if (!originalRecord) return;

        // Check if data has changed
        if (JSON.stringify(selectedRecord.data) === JSON.stringify(originalRecord.data)) return;

        const timer = setTimeout(() => {
            updateRecord();
        }, 1000);

        return () => clearTimeout(timer);
    }, [selectedRecord, records]);

    const updateRecord = async () => {
        if (!selectedRecord) return;
        setIsLoading(true);
        try {
            const res = await axios.put(`${API_URL}/api/records/${selectedRecord._id}`, {
                data: selectedRecord.data
            });
            // Update records list with saved data
            setRecords(prev => prev.map(r => r._id === selectedRecord._id ? res.data : r));
            setLastSaved(new Date());
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    };

    const updateTitle = async () => {
        if (!selectedRecord || !editedTitle.trim()) return;
        try {
            const res = await axios.put(`${API_URL}/api/records/${selectedRecord._id}`, {
                title: editedTitle
            });
            setRecords(prev => prev.map(r => r._id === selectedRecord._id ? res.data : r));
            setSelectedRecord(res.data);
            setIsEditingTitle(false);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteRecord = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this record?')) return;

        try {
            await axios.delete(`${API_URL}/api/records/${id}`);
            setRecords(records.filter(r => r._id !== id));
            if (selectedRecord && selectedRecord._id === id) {
                setSelectedRecord(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCellChange = (rowIndex, colIndex, value) => {
        if (!selectedRecord) return;

        const newData = [...selectedRecord.data];
        const newRow = [...newData[rowIndex]];
        newRow[colIndex] = value;
        newData[rowIndex] = newRow;

        setSelectedRecord({ ...selectedRecord, data: newData });
    };

    return (
        <div className="bg-card rounded-xl border border-border h-full flex overflow-hidden">
            {/* Sidebar List */}
            <div className={`${selectedRecord ? 'hidden md:flex' : 'flex'} w-full md:w-64 border-r border-border flex-col bg-background/50`}>
                <div className="p-3 md:p-4 border-b border-border">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-4">Records</h2>
                    {isCreating ? (
                        <form onSubmit={createRecord} className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Record Name"
                                className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-text focus:outline-none focus:border-accent"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onBlur={() => !newTitle && setIsCreating(false)}
                            />
                            <button type="submit" className="bg-accent text-white rounded px-2 py-1 text-xs font-bold">Add</button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center justify-center gap-2 bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20 rounded-lg py-2 transition-all"
                        >
                            <Plus size={18} />
                            <span>New Record</span>
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {records.map(record => (
                        <div
                            key={record._id}
                            onClick={() => setSelectedRecord(record)}
                            className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-border/30 flex justify-between items-center group ${selectedRecord?._id === record._id ? 'bg-accent/5 border-l-4 border-l-accent' : ''
                                }`}
                        >
                            <div className="overflow-hidden">
                                <h3 className={`font-medium truncate text-sm md:text-base ${selectedRecord?._id === record._id ? 'text-accent' : 'text-text'}`}>
                                    {record.title}
                                </h3>
                                <p className="text-[10px] md:text-xs text-text-muted">{format(new Date(record.createdAt), 'MMM d, yyyy')}</p>
                            </div>
                            <button
                                onClick={(e) => deleteRecord(record._id, e)}
                                className={`text-text-muted hover:text-red-500 transition-opacity p-1 ${selectedRecord?._id === record._id || isAdmin ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {records.length === 0 && !isCreating && (
                        <div className="p-8 text-center text-text-muted text-sm opacity-50">
                            No records found. Create one to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area - Table Editor */}
            <div className={`${!selectedRecord ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden bg-background`}>
                {selectedRecord ? (
                    <>
                        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedRecord(null)}
                                    className="md:hidden text-text-muted hover:text-text"
                                >
                                    <ChevronLeft />
                                </button>
                                <div>
                                    {isEditingTitle ? (
                                        <input
                                            type="text"
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            onBlur={updateTitle}
                                            onKeyDown={(e) => e.key === 'Enter' && updateTitle()}
                                            autoFocus
                                            className="text-lg md:text-xl font-bold text-white bg-transparent border-b border-accent focus:outline-none mb-1"
                                        />
                                    ) : (
                                        <h2
                                            className="text-lg md:text-xl font-bold text-white cursor-pointer hover:text-accent transition-colors"
                                            onClick={() => setIsEditingTitle(true)}
                                            title="Click to rename"
                                        >
                                            {selectedRecord.title}
                                        </h2>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-text-muted">10 Columns x 50 Rows</p>
                                        {lastSaved && (
                                            <span className="text-xs text-text-muted border-l border-border pl-2">
                                                Saved {format(lastSaved, 'HH:mm:ss')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={updateRecord}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                            >
                                <Save size={18} />
                                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar bg-background">
                            <div className="min-w-max">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr>
                                            {/* Row Number Header */}
                                            <th className="w-12 bg-card border-b border-r border-border sticky top-0 left-0 z-30 p-3 text-[10px] font-black uppercase text-text-muted">#</th>
                                            {/* Column Headers */}
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <th key={i} className="min-w-[140px] md:min-w-[180px] p-3 bg-card border-b border-r border-border text-xs text-accent font-black sticky top-0 z-20">
                                                    COL {String.fromCharCode(65 + i)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRecord.data.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="group hover:bg-white/[0.02] transition-colors">
                                                {/* Row Number */}
                                                <td className="p-3 bg-card/80 backdrop-blur-sm border-b border-r border-border text-[11px] text-text-muted font-mono text-center sticky left-0 z-20 w-12 group-hover:text-accent group-hover:bg-card">
                                                    {rowIndex + 1}
                                                </td>
                                                {/* Cells */}
                                                {row.map((cell, colIndex) => (
                                                    <td key={`${rowIndex}-${colIndex}`} className="p-0 border-b border-r border-border focus-within:ring-2 focus-within:ring-accent/50 focus-within:z-10 transition-all relative">
                                                        <input
                                                            type="text"
                                                            value={cell || ''}
                                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                            className={`w-full min-h-[40px] md:min-h-[50px] px-3 md:px-4 py-2 md:py-3 bg-transparent text-xs md:text-sm focus:outline-none transition-colors
                                                                ${rowIndex === 0 ? 'font-black text-white bg-accent/10 placeholder:text-accent/30' : 'text-text focus:bg-accent/5'}
                                                            `}
                                                            placeholder={rowIndex === 0 ? `Header ${String.fromCharCode(64 + colIndex + 1)}` : ""}
                                                        />
                                                        {rowIndex === 0 && (
                                                            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Table size={12} className="text-accent/30" />
                                                            </div>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Quick Action: Scroll to start */}
                        <button
                            onClick={() => {
                                const container = document.querySelector('.overflow-auto');
                                if (container) container.scrollTo({ left: 0, behavior: 'smooth' });
                            }}
                            className="fixed bottom-24 right-6 md:hidden bg-accent text-white p-4 rounded-full shadow-2xl z-50 active:scale-95 transition-transform"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-50 space-y-4">
                        <Table size={64} strokeWidth={1} />
                        <p>Select a record to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Records;
