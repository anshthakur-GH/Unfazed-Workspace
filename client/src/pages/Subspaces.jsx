import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Plus, FileText, Save, Trash2, GripVertical, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import RichTextEditor from '../components/RichTextEditor';
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

const SortableSubspaceItem = ({ sub, selectedSubspace, setSelectedSubspace, setShowList, deleteSubspace }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: sub._id });

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
            onClick={() => {
                setSelectedSubspace(sub);
                if (window.innerWidth < 768) setShowList(false);
            }}
            className={`p-3 md:p-4 rounded-xl cursor-pointer transition-all border flex items-center gap-3 ${selectedSubspace?._id === sub._id
                ? 'bg-accent/10 border-accent text-accent'
                : 'bg-background hover:bg-border/50 border-transparent text-text-muted'
                } ${isDragging ? 'shadow-2xl border-accent' : ''}`}
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-text-muted hover:text-accent p-1">
                <GripVertical size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center justify-between">
                    <span className="truncate">{sub.title}</span>
                    <div className="flex gap-1">
                        {sub.assignedTo?.map(user => (
                            <span key={user} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded border border-border">
                                {user.charAt(0)}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                    <div className="text-[10px] opacity-50 uppercase tracking-widest font-black">
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
        </div>
    );
};

const Subspaces = () => {
    const [subspaces, setSubspaces] = useState([]);
    const [selectedSubspace, setSelectedSubspace] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    // User Mapping for automation
    const currentUsername = localStorage.getItem('username');
    const USER_MAP = {
        'Ansh_Unfazed': 'Ansh',
        'Ayush_Unfazed': 'Ayush'
    };
    const friendlyName = USER_MAP[currentUsername] || 'Unknown';

    const [isAdmin] = useState(currentUsername === 'Ansh_Unfazed');
    const [showList, setShowList] = useState(true);
    const lastSubspaceIdRef = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchSubspaces();
    }, []);

    useEffect(() => {
        if (selectedSubspace && selectedSubspace._id !== lastSubspaceIdRef.current) {
            setNoteContent(selectedSubspace.content || '');
            setEditedTitle(selectedSubspace.title);
            lastSubspaceIdRef.current = selectedSubspace._id;
        } else if (selectedSubspace && selectedSubspace._id === lastSubspaceIdRef.current && !isEditingTitle) {
            setEditedTitle(selectedSubspace.title);
        }
    }, [selectedSubspace, isEditingTitle]);

    // Ctrl+S Shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                updateContent();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [noteContent, selectedSubspace]);

    // Auto-Save (Debounced)
    useEffect(() => {
        if (!selectedSubspace) return;

        const timer = setTimeout(() => {
            if (selectedSubspace && noteContent !== selectedSubspace.content) {
                updateContent();
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [noteContent]);

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

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = subspaces.findIndex((item) => item._id === active.id);
            const newIndex = subspaces.findIndex((item) => item._id === over.id);

            const newSubspaces = arrayMove(subspaces, oldIndex, newIndex);

            // Calculate new orders
            const reorderedSubspaces = newSubspaces.map((sub, index) => ({
                _id: sub._id,
                order: index
            }));

            setSubspaces(newSubspaces);

            try {
                await axios.put(`${API_URL}/api/subspaces/reorder`, {
                    subspaces: reorderedSubspaces
                });
            } catch (err) {
                console.error("Failed to reorder subspaces:", err);
                fetchSubspaces();
            }
        }
    };

    const createSubspace = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/api/subspaces`, {
                title: newTitle,
                assignedTo: [friendlyName] // Auto-assigned
            });
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
            setSubspaces(subspaces.map(s => s._id === res.data._id ? res.data : s));
            setSelectedSubspace(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const updateTitle = async () => {
        if (!selectedSubspace || !editedTitle.trim()) return;
        try {
            const res = await axios.put(`${API_URL}/api/subspaces/${selectedSubspace._id}`, {
                title: editedTitle
            });
            setSubspaces(subspaces.map(s => s._id === res.data._id ? res.data : s));
            setSelectedSubspace(res.data);
            setIsEditingTitle(false);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteSubspace = async (e, id) => {
        e.stopPropagation();
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

    const downloadAsPdf = () => {
        if (!selectedSubspace) return;

        const title = selectedSubspace.title || 'Subspace';
        const safeFilename = title.replace(/[^a-z0-9_\-\s]/gi, '').trim() || 'subspace';
        const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

        const htmlContent = `
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        font-size: 13px;
                        color: #1a1a2e !important;
                        background-color: #ffffff !important;
                        margin: 0;
                        padding: 0;
                    }
                    * {
                        color: #1a1a2e !important;
                    }
                    h1 {
                        font-size: 22px;
                        font-weight: 700;
                        color: #1a1a2e !important;
                        margin: 0 0 10px 0;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #7c3aed;
                    }
                    .meta {
                        font-size: 10px;
                        color: #888888 !important;
                        margin-bottom: 20px;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        font-weight: 600;
                    }
                    .content {
                        line-height: 1.7;
                        color: #1a1a2e !important;
                    }
                    b, strong { font-weight: 700; }
                    i, em { font-style: italic; }
                    s { text-decoration: line-through; }
                    
                    /* Preserve highlights but fix text within them */
                    span[style*="background-color"] {
                        color: #000000 !important;
                        text-shadow: none !important;
                        box-shadow: none !important;
                    }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="meta">Generated on ${dateStr}</div>
                <div class="content">${noteContent || '<p>No content</p>'}</div>
            </body>
            </html>
        `;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        pdf.html(htmlContent, {
            callback: (doc) => {
                doc.save(`${safeFilename}.pdf`);
            },
            x: 12,
            y: 12,
            width: 186,
            windowWidth: 750,
            autoPaging: 'text',
        });
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 relative">
            {/* List of Subspaces */}
            <div className={`${showList ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 flex-col gap-4 h-full`}>
                <div className="bg-card p-3 md:p-4 rounded-xl border border-border h-full flex flex-col">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-4">Subspaces</h2>
                    <form onSubmit={createSubspace} className="flex flex-col gap-2 mb-4">
                        <div className="flex gap-2">
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
                        </div>
                    </form>
                    <div className="overflow-y-auto custom-scrollbar pr-2 flex-1">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis]}
                        >
                            <SortableContext
                                items={subspaces.map(s => s._id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {subspaces.map(sub => (
                                        <SortableSubspaceItem
                                            key={sub._id}
                                            sub={sub}
                                            selectedSubspace={selectedSubspace}
                                            setSelectedSubspace={setSelectedSubspace}
                                            setShowList={setShowList}
                                            deleteSubspace={deleteSubspace}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={`${!showList ? 'flex' : 'hidden'} md:flex flex-1 bg-card rounded-xl border border-border p-4 md:p-6 flex flex-col h-full`}>
                {selectedSubspace ? (
                    <>
                        <div className="flex justify-between items-center mb-6 gap-3">
                            <div className="flex-1 flex items-center gap-3 overflow-hidden">
                                <button
                                    onClick={() => setShowList(true)}
                                    className="md:hidden p-2 -ml-2 text-accent"
                                >
                                    <Plus className="rotate-45" size={24} />
                                </button>
                                {isEditingTitle ? (
                                    <input
                                        type="text"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        onBlur={updateTitle}
                                        onKeyDown={(e) => e.key === 'Enter' && updateTitle()}
                                        autoFocus
                                        className="text-xl md:text-2xl font-bold text-white bg-transparent border-b border-accent focus:outline-none w-full"
                                    />
                                ) : (
                                    <h2
                                        className="text-lg md:text-2xl font-bold text-white cursor-pointer hover:text-accent transition-colors truncate"
                                        onClick={() => setIsEditingTitle(true)}
                                        title="Click to rename"
                                    >
                                        {selectedSubspace.title}
                                    </h2>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={updateContent}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white px-3 py-2 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap min-w-[100px] md:min-w-[120px]"
                                >
                                    <Save size={18} />
                                    <span className="hidden sm:inline">{loading ? 'Saving...' : 'Save'}</span>
                                </button>
                                <button
                                    onClick={downloadAsPdf}
                                    title="Download as PDF"
                                    className="flex items-center gap-2 bg-background hover:bg-border/60 border border-border text-text-muted hover:text-accent px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                                >
                                    <Download size={18} />
                                    <span className="hidden sm:inline">PDF</span>
                                </button>
                            </div>
                        </div>
                        <RichTextEditor
                            value={noteContent}
                            onChange={setNoteContent}
                            placeholder="Type notes..."
                            className="flex-1 overflow-hidden"
                            minHeight="100%"
                        />
                        <div className="mt-2 text-[10px] text-text-muted flex justify-between uppercase font-black tracking-widest">
                            <span>Auto-fetch enabled</span>
                            <span>{new Date().toLocaleTimeString()}</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50 p-10 text-center">
                        <FileText size={64} className="mb-4" />
                        <p>Select or create a subspace</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Subspaces;
