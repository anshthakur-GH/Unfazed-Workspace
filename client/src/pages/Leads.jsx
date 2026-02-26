import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Users, Calendar, Plus, X, Edit2, Trash2, Search, ExternalLink, Filter } from 'lucide-react';
import { format, isToday, parseISO, startOfDay } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLead, setCurrentLead] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        status: 'Pending',
        platform: 'LinkedIn',
        profileUrl: '',
        reminderDate: '',
        notes: ''
    });

    const username = localStorage.getItem('username');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/leads`, {
                params: { assignedTo: username } // Fetch only leads for this user
            });
            setLeads(response.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (lead = null) => {
        if (lead) {
            setCurrentLead(lead);
            setFormData({
                name: lead.name,
                status: lead.status,
                platform: lead.platform,
                profileUrl: lead.profileUrl || '',
                reminderDate: lead.reminderDate ? new Date(lead.reminderDate).toISOString().split('T')[0] : '',
                notes: lead.notes || ''
            });
        } else {
            setCurrentLead(null);
            setFormData({
                name: '',
                status: 'Pending',
                platform: 'LinkedIn',
                profileUrl: '',
                reminderDate: '',
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentLead(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                assignedTo: username
            };

            // Format date if exists
            if (payload.reminderDate) {
                payload.reminderDate = new Date(payload.reminderDate).toISOString();
            } else {
                delete payload.reminderDate;
            }

            if (currentLead) {
                await axios.put(`${API_URL}/leads/${currentLead._id}`, payload);
            } else {
                await axios.post(`${API_URL}/leads`, payload);
            }
            fetchLeads();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving lead:', error);
            alert('Failed to save lead');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) return;
        try {
            await axios.delete(`${API_URL}/leads/${id}`);
            fetchLeads();
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('Failed to delete lead');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Interested': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Not Interested': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'Follow-up Scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'; // Pending
        }
    };

    const getPlatformColor = (platform) => {
        switch (platform) {
            case 'LinkedIn': return 'text-blue-500';
            case 'Instagram': return 'text-pink-500';
            case 'Facebook': return 'text-blue-600';
            default: return 'text-gray-400';
        }
    };

    // Derived statistics
    const interestedCount = leads.filter(l => l.status === 'Interested').length;

    // Calculate today's followups safely considering timezone differences
    const todayFollowUps = leads.filter(l => {
        if (!l.reminderDate) return false;
        // isToday from date-fns checks if the given date matches the local system's current date
        return isToday(parseISO(l.reminderDate));
    });

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lead.notes && lead.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-accent mb-2 flex items-center gap-2">
                        <Target className="text-accent" />
                        Leads / Follow-Ups
                    </h1>
                    <p className="text-text-muted">Manage your outreach and follow-up schedule</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Add Lead</span>
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg text-accent">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Total Leads</p>
                        <p className="text-2xl font-bold text-white">{leads.length}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Interested</p>
                        <p className="text-2xl font-bold text-emerald-400">{interestedCount}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent opacity-0 transition-opacity ${todayFollowUps.length > 0 ? 'opacity-100 group-hover:opacity-80' : ''}`} />
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500 relative z-10">
                        <Calendar size={24} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-text-muted text-sm">Follow-ups Today</p>
                        <p className={`text-2xl font-bold ${todayFollowUps.length > 0 ? 'text-accent' : 'text-white'}`}>
                            {todayFollowUps.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Today's Action Items Panel (Only show if there are follow-ups today) */}
            {todayFollowUps.length > 0 && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 sm:p-6 mb-6">
                    <h2 className="text-lg font-semibold text-accent flex items-center gap-2 mb-4">
                        <Calendar size={20} />
                        Action Required Today
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todayFollowUps.map(lead => (
                            <div key={`today-${lead._id}`} className="bg-card border border-border rounded-lg p-4 flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-2 h-full bg-accent"></div>
                                <div className="flex justify-between items-start mb-2 pr-4">
                                    <h3 className="font-semibold text-white truncate">{lead.name}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(lead)} className="text-text-muted hover:text-accent transition-colors"><Edit2 size={16} /></button>
                                    </div>
                                </div>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded w-max border mb-2 ${getStatusColor(lead.status)}`}>
                                    {lead.status}
                                </span>
                                {lead.profileUrl && (
                                    <a href={lead.profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-accent hover:underline mt-auto pt-2">
                                        <ExternalLink size={14} /> View Profile
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Table / List Area */}
            <div className="bg-card rounded-xl border border-border flex flex-col h-[calc(100vh-28rem)] min-h-[400px]">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search leads by name or notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-border text-white text-sm rounded-lg focus:ring-accent focus:border-accent block pl-10 p-2.5 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="text-text-muted w-5 h-5" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-background border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 transition-colors"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Interested">Interested</option>
                            <option value="Follow-up Scheduled">Follow-up Scheduled</option>
                            <option value="Not Interested">Not Interested</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted p-6 text-center">
                            <Target size={48} className="mb-4 opacity-20" />
                            <p className="text-lg mb-1">No leads found</p>
                            <p className="text-sm opacity-60">Add a new lead or adjust your search filters.</p>
                        </div>
                    ) : (
                        <div className="min-w-[800px]">
                            <table className="w-full text-sm text-left text-text-muted">
                                <thead className="text-xs text-text uppercase bg-background border-b border-border sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Name</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium">Platform</th>
                                        <th className="px-6 py-4 font-medium">Next Follow-Up</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead) => (
                                        <tr key={lead._id} className="bg-card border-b border-border hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                                                        {lead.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{lead.name}</div>
                                                        <div className="text-xs text-text-muted max-w-[200px] truncate">{lead.notes}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border gap-1 inline-flex items-center ${getStatusColor(lead.status)}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${getPlatformColor(lead.platform)}`}>{lead.platform}</span>
                                                    {lead.profileUrl && (
                                                        <a href={lead.profileUrl} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" title="View Profile">
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {lead.reminderDate ? (
                                                    <div className="flex flex-col">
                                                        <span className={`font-medium ${isToday(parseISO(lead.reminderDate)) ? 'text-accent' : 'text-white'}`}>
                                                            {format(parseISO(lead.reminderDate), 'MMM d, yyyy')}
                                                        </span>
                                                        {isToday(parseISO(lead.reminderDate)) && <span className="text-xs text-accent">Today</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-text-muted/50 italic">Not set</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(lead)} className="text-text-muted hover:text-white transition-colors">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(lead._id)} className="text-text-muted hover:text-red-500 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                {/* Fallback for mobile where hover doesn't work well */}
                                                <div className="flex justify-end gap-3 lg:hidden">
                                                    <button onClick={() => handleOpenModal(lead)} className="text-text-muted hover:text-white transition-colors">
                                                        <Edit2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-border">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {currentLead ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
                                {currentLead ? 'Edit Lead' : 'Add New Lead'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-text-muted hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Lead Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-background border border-border text-white rounded-lg focus:ring-accent focus:border-accent p-2.5"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1">Status *</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-background border border-border text-white rounded-lg focus:ring-accent focus:border-accent p-2.5"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Interested">Interested</option>
                                            <option value="Follow-up Scheduled">Follow-up Scheduled</option>
                                            <option value="Not Interested">Not Interested</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1">Platform *</label>
                                        <select
                                            value={formData.platform}
                                            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                            className="w-full bg-background border border-border text-white rounded-lg focus:ring-accent focus:border-accent p-2.5"
                                        >
                                            <option value="LinkedIn">LinkedIn</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="Facebook">Facebook</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Profile URL</label>
                                    <input
                                        type="url"
                                        value={formData.profileUrl}
                                        onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })}
                                        className="w-full bg-background border border-border text-white rounded-lg focus:ring-accent focus:border-accent p-2.5"
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Follow-Up Reminder Date</label>
                                    <input
                                        type="date"
                                        value={formData.reminderDate}
                                        onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                                        className="w-full bg-background border border-border text-white rounded-lg focus:ring-accent focus:border-accent p-2.5 [color-scheme:dark]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-background border border-border text-white rounded-lg focus:ring-accent focus:border-accent p-2.5 min-h-[100px] resize-y"
                                        placeholder="Add any relevant details about the conversation..."
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-border flex justify-end gap-3 bg-card mt-auto rounded-b-xl">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-text-muted hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors font-medium"
                            >
                                {currentLead ? 'Update Lead' : 'Save Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leads;
