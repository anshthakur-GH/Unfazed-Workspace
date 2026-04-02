import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Target, CheckCircle2, Circle, Trash2, Plus, Edit2, Check, X, Calendar, Flag, Trophy, User } from 'lucide-react';
import { format } from 'date-fns';

const MemberGoalContainer = ({ member, goals, onAdd, onToggle, onDelete, newTask, setNewTask }) => {
    return (
        <div className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col h-[380px] md:h-[450px] hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-500">
                        <User size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-white tracking-tight leading-none mb-1">{member}</h3>
                        <p className="text-[9px] md:text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">Goal List</p>
                    </div>
                </div>
                <div className="bg-background/50 px-3 py-1 rounded-full border border-border">
                    <span className="text-[10px] font-black text-accent uppercase tracking-tighter">
                        {goals.filter(g => g.isCompleted).length} / {goals.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-4">
                {goals.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale pointer-events-none">
                        <Flag size={48} className="mb-4 text-text-muted" />
                        <p className="text-sm font-medium">No goals set yet for this month</p>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <div
                            key={goal._id}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group/item ${
                                goal.isCompleted 
                                ? 'bg-accent/5 border-accent/20 opacity-60' 
                                : 'bg-background/40 border-border hover:border-accent/40'
                            }`}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                    onClick={() => onToggle(goal)}
                                    className={`transition-all duration-300 transform hover:scale-110 ${goal.isCompleted ? 'text-accent' : 'text-text-muted hover:text-accent'}`}
                                >
                                    {goal.isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                </button>
                                <span className={`text-sm font-medium truncate ${goal.isCompleted ? 'line-through text-text-muted' : 'text-white'}`}>
                                    {goal.title}
                                </span>
                            </div>
                            <button
                                onClick={() => onDelete(goal)}
                                className="opacity-0 group-hover/item:opacity-100 text-text-muted hover:text-red-500 transition-all p-1"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <form 
                onSubmit={(e) => {
                    e.preventDefault();
                    onAdd(member);
                }}
                className="relative mt-auto"
            >
                <input
                    type="text"
                    placeholder="Quick set goal..."
                    value={newTask.member === member ? newTask.title : ''}
                    onChange={(e) => setNewTask({ member: member, title: e.target.value })}
                    className="w-full bg-background/60 border border-border rounded-xl md:rounded-2xl px-4 py-3.5 md:px-5 md:py-4 text-xs md:text-sm text-white focus:outline-none focus:border-accent transition-all pr-12 placeholder:text-text-muted/50"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20"
                >
                    <Plus size={20} />
                </button>
            </form>
        </div>
    );
};

const Goals = () => {
    const [globalGoal, setGlobalGoal] = useState(null);
    const [isEditingGlobal, setIsEditingGlobal] = useState(false);
    const [globalGoalText, setGlobalGoalText] = useState('');
    const [memberGoals, setMemberGoals] = useState({});
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState({ member: '', title: '' });
    
    const username = localStorage.getItem('username');
    const isAdmin = username === 'Ansh_Unfazed';
    const members = ['Ansh Thakur', 'Navtej', 'Ansh Saxena', 'Ayush'];
    
    const currentMonth = format(new Date(), 'MMMM');
    const currentYear = format(new Date(), 'yyyy');
    const currentDate = format(new Date(), 'do MMM, yyyy');

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/goals`, {
                params: { month: currentMonth, year: currentYear }
            });
            
            const goals = res.data;
            const global = goals.find(g => g.type === 'global');
            setGlobalGoal(global);
            if (global) setGlobalGoalText(global.title);
            
            const grouped = {};
            members.forEach(m => {
                grouped[m] = goals.filter(g => g.type === 'individual' && g.member === m);
            });
            setMemberGoals(grouped);
            
            setLoading(false);
        } catch (err) {
            console.error('Error fetching goals:', err);
            setLoading(false);
        }
    };

    const handleSaveGlobalGoal = async () => {
        if (!globalGoalText.trim()) return;
        try {
            if (globalGoal) {
                const res = await axios.put(`${API_URL}/api/goals/${globalGoal._id}`, {
                    title: globalGoalText
                });
                setGlobalGoal(res.data);
            } else {
                const res = await axios.post(`${API_URL}/api/goals`, {
                    title: globalGoalText,
                    type: 'global',
                    month: currentMonth,
                    year: currentYear
                });
                setGlobalGoal(res.data);
            }
            setIsEditingGlobal(false);
        } catch (err) {
            console.error('Error saving global goal:', err);
        }
    };

    const handleAddMemberGoal = async (member) => {
        const text = newTask.title.trim();
        if (!text) return;
        
        try {
            const res = await axios.post(`${API_URL}/api/goals`, {
                title: text,
                type: 'individual',
                member: member,
                month: currentMonth,
                year: currentYear
            });
            
            setMemberGoals(prev => ({
                ...prev,
                [member]: [...(prev[member] || []), res.data]
            }));
            setNewTask({ member: '', title: '' });
        } catch (err) {
            console.error('Error adding member goal:', err);
        }
    };

    const handleToggleGoal = async (goal) => {
        try {
            const res = await axios.put(`${API_URL}/api/goals/${goal._id}`, {
                isCompleted: !goal.isCompleted
            });
            
            setMemberGoals(prev => ({
                ...prev,
                [goal.member]: prev[goal.member].map(g => g._id === goal._id ? res.data : g)
            }));
        } catch (err) {
            console.error('Error toggling goal:', err);
        }
    };

    const handleDeleteGoal = async (goal) => {
        try {
            await axios.delete(`${API_URL}/api/goals/${goal._id}`);
            setMemberGoals(prev => ({
                ...prev,
                [goal.member]: prev[goal.member].filter(g => g._id !== goal._id)
            }));
        } catch (err) {
            console.error('Error deleting goal:', err);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-muted font-bold tracking-widest uppercase text-xs">Loading Goals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6 md:gap-8 pb-24 md:pb-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">GOALS</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                            <Calendar size={14} className="text-accent" />
                            <span className="text-xs font-black text-accent uppercase tracking-wider">{currentMonth} {currentYear}</span>
                        </div>
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{currentDate}</span>
                    </div>
                </div>
            </div>

            {/* Global Goal Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-2xl md:rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-card/60 backdrop-blur-2xl border border-border rounded-2xl md:rounded-3xl p-6 md:p-10 overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                        <Target size={300} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-white">
                                <Target size={18} />
                            </div>
                            <span className="text-sm font-black text-accent uppercase tracking-[0.3em]">Current Month Main Goal</span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex-1">
                                {isEditingGlobal && isAdmin ? (
                                    <div className="flex flex-col gap-4">
                                        <textarea
                                            value={globalGoalText}
                                            onChange={(e) => setGlobalGoalText(e.target.value)}
                                            className="w-full bg-background/50 border border-accent/30 rounded-2xl p-6 text-2xl md:text-3xl font-black text-white focus:outline-none focus:border-accent transition-all resize-none min-h-[120px]"
                                            placeholder="What is the main goal for this month?"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveGlobalGoal}
                                                className="px-6 py-3 bg-accent text-white rounded-xl font-bold flex items-center gap-2 hover:bg-accent-hover transition-all active:scale-95"
                                            >
                                                <Check size={18} /> Save Goal
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingGlobal(false);
                                                    setGlobalGoalText(globalGoal?.title || '');
                                                }}
                                                className="px-6 py-3 bg-background border border-border text-text-muted rounded-xl font-bold flex items-center gap-2 hover:text-white transition-all active:scale-95"
                                            >
                                                <X size={18} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <h2 className="text-xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                                        {globalGoal?.title || "No main goal set yet for this month."}
                                    </h2>
                                )}
                            </div>
                            
                            {!isEditingGlobal && isAdmin && (
                                <button
                                    onClick={() => setIsEditingGlobal(true)}
                                    className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:border-accent transition-all duration-300 group/btn shadow-xl"
                                    title="Edit Main Goal"
                                >
                                    <Edit2 size={24} className="group-hover/btn:scale-110 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Member Containers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {members.map((member) => (
                    <MemberGoalContainer 
                        key={member}
                        member={member}
                        goals={memberGoals[member] || []}
                        onAdd={handleAddMemberGoal}
                        onToggle={handleToggleGoal}
                        onDelete={handleDeleteGoal}
                        newTask={newTask}
                        setNewTask={setNewTask}
                    />
                ))}
            </div>
        </div>
    );
};

export default Goals;
