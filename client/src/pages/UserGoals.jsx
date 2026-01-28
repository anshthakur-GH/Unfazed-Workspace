import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Plus, ChevronDown, ChevronUp, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import TodoList from '../components/TodoList';

const UserGoals = () => {
    const { userName } = useParams();
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedGoalId, setExpandedGoalId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // New Goal State
    const [newGoal, setNewGoal] = useState({
        title: '',
        description: '',
        targetDate: format(new Date(), 'yyyy-MM-dd')
    });

    // Edit Goal State
    const [editingGoal, setEditingGoal] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Decode token safely or get from localstorage if stored
            const storedUser = localStorage.getItem('username');
            setCurrentUser(storedUser);
        }
        fetchGoals();
    }, [userName]);

    const fetchGoals = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/goals`, {
                params: { assignedTo: userName }
            });
            setGoals(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/goals`, {
                ...newGoal,
                assignedTo: userName
            });
            setShowCreateModal(false);
            setNewGoal({
                title: '',
                description: '',
                targetDate: format(new Date(), 'yyyy-MM-dd')
            });
            fetchGoals();
        } catch (err) {
            console.error(err);
            alert("Error creating goal");
        }
    };

    const handleUpdateGoal = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/api/goals/${editingGoal._id}`, editingGoal);
            setEditingGoal(null);
            fetchGoals();
        } catch (err) {
            console.error(err);
            alert("Error updating goal");
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!window.confirm("Are you sure you want to delete this goal?")) return;
        try {
            await axios.delete(`${API_URL}/api/goals/${id}`);
            fetchGoals();
        } catch (err) {
            console.error(err);
            alert("Error deleting goal");
        }
    };

    const toggleExpand = (id) => {
        setExpandedGoalId(expandedGoalId === id ? null : id);
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-0">
                <div>
                    <button
                        onClick={() => navigate('/dashboard/goals')}
                        className="text-text-muted hover:text-text mb-2 text-sm"
                    >
                        ← Back to Team
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-text">
                        {userName}'s Goals
                    </h1>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full md:w-auto bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    New Goal
                </button>
            </div>

            <div className="grid gap-6">
                {goals.map(goal => {
                    const isCreator = currentUser === goal.createdBy;
                    return (
                        <div key={goal._id} className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:border-accent/30">
                            <div
                                className="p-6 cursor-pointer flex items-start justify-between"
                                onClick={() => toggleExpand(goal._id)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-text">{goal.title}</h3>
                                        <span className="text-xs text-text-muted">
                                            Created by <span className="font-bold text-accent">{goal.createdBy}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-text-muted">
                                        <span className="bg-background px-3 py-1 rounded-md border border-border">
                                            Target: {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {isCreator && (
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setEditingGoal(goal)}
                                                className="p-2 text-text-muted hover:text-text hover:bg-background rounded-lg transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGoal(goal._id)}
                                                className="p-2 text-text-muted hover:text-red-500 hover:bg-background rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="p-2 text-text-muted">
                                        {expandedGoalId === goal._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Section (Sub Goals) */}
                            {expandedGoalId === goal._id && (
                                <div className="border-t border-border bg-background/30 p-6">
                                    <h4 className="text-lg font-bold text-text mb-4">Sub Goals</h4>
                                    <div className="h-[400px]">
                                        <TodoList
                                            goalId={goal._id}
                                            title=""
                                            readOnly={!isCreator}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {goals.length === 0 && (
                    <div className="text-center py-20 text-text-muted border-2 border-dashed border-border rounded-xl">
                        <p>No goals found for {userName}.</p>
                        <button onClick={() => setShowCreateModal(true)} className="text-accent hover:underline mt-2">
                            Create the first one
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-card w-full max-w-md rounded-xl border border-border p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <h2 className="text-2xl font-bold text-white mb-6">Create New Goal</h2>
                            <form onSubmit={handleCreateGoal} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Goal Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text focus:border-accent focus:outline-none"
                                        value={newGoal.title}
                                        onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text focus:border-accent focus:outline-none h-24 resize-none"
                                        value={newGoal.description}
                                        onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1">Target Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text focus:border-accent focus:outline-none"
                                            value={newGoal.targetDate}
                                            onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 rounded-lg text-text-muted hover:text-text transition-colors"
                                        disabled={false}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg bg-accent text-white font-bold hover:bg-accent-hover transition-colors"
                                    >
                                        Create Goal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal (Reuse similar structure or create generic modal component in future) */}
            {
                editingGoal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-card w-full max-w-md rounded-xl border border-border p-6 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">Edit Goal</h2>
                            <form onSubmit={handleUpdateGoal} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Goal Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text focus:border-accent focus:outline-none"
                                        value={editingGoal.title}
                                        onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text focus:border-accent focus:outline-none h-24 resize-none"
                                        value={editingGoal.description}
                                        onChange={e => setEditingGoal({ ...editingGoal, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1">Target Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text focus:border-accent focus:outline-none"
                                            value={format(parseISO(editingGoal.targetDate), 'yyyy-MM-dd')}
                                            onChange={e => setEditingGoal({ ...editingGoal, targetDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingGoal(null)}
                                        className="px-4 py-2 rounded-lg text-text-muted hover:text-text transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg bg-accent text-white font-bold hover:bg-accent-hover transition-colors"
                                    >
                                        Update Goal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserGoals;
