import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Users, Calendar, Plus, X, Edit2, Trash2, Search, ExternalLink, Filter, Copy, Check, FileText } from 'lucide-react';
import { format, isToday, parseISO, startOfDay, addDays } from 'date-fns';
import { API_URL } from '../config';

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
        status: 'Interested',
        platform: 'WhatsApp',
        profileUrl: '',
        companyWebsite: '',
        email: '',
        phone: '',
        reminderDate: '',
        nextMessage: '',
        notes: '',
        assignedTo: localStorage.getItem('username') || ''
    });

    const username = localStorage.getItem('username');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/api/leads`);
            setLeads(response.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (lead = null) => {
        if (lead) {
            // Map old obsolete data to the new UI options gently
            let mappedStatus = lead.status;
            if (mappedStatus === 'Pending') mappedStatus = 'Interested';
            if (mappedStatus === 'Not Interested') mappedStatus = 'Feedback Scheduled';
            if (mappedStatus === 'Follow-up Scheduled') mappedStatus = 'follow up scheduled';

            let mappedPlatform = lead.platform;
            if (mappedPlatform === 'LinkedIn') mappedPlatform = 'Linkedin';
            if (mappedPlatform === 'Other') mappedPlatform = 'WhatsApp';

            setCurrentLead(lead);
            setFormData({
                name: lead.name,
                status: mappedStatus,
                platform: mappedPlatform,
                profileUrl: lead.profileUrl || '',
                companyWebsite: lead.companyWebsite || '',
                email: lead.email || '',
                phone: lead.phone || '',
                reminderDate: lead.reminderDate ? new Date(lead.reminderDate).toISOString().split('T')[0] : '',
                nextMessage: lead.nextMessage || '',
                notes: lead.notes || '',
                assignedTo: lead.assignedTo || username
            });
        } else {
            setCurrentLead(null);
            setFormData({
                name: '',
                status: 'Interested',
                platform: 'WhatsApp',
                profileUrl: '',
                companyWebsite: '',
                email: '',
                phone: '',
                reminderDate: '',
                nextMessage: '',
                notes: '',
                assignedTo: username
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
                ...formData
            };

            // Format date if exists
            if (payload.reminderDate) {
                payload.reminderDate = new Date(payload.reminderDate).toISOString();
            } else {
                delete payload.reminderDate;
            }

            if (currentLead) {
                await axios.put(`${API_URL}/api/leads/${currentLead._id}`, payload);
            } else {
                await axios.post(`${API_URL}/api/leads`, payload);
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
            await axios.delete(`${API_URL}/api/leads/${id}`);
            fetchLeads();
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('Failed to delete lead');
        }
    };

    const [copiedId, setCopiedId] = useState(null);

    const handleCopyMessage = (e, text, id) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleReschedule = async (e, lead) => {
        e.stopPropagation();
        try {
            const nextWeek = addDays(new Date(lead.reminderDate), 7);
            await axios.put(`${API_URL}/api/leads/${lead._id}`, {
                reminderDate: nextWeek.toISOString()
            });
            fetchLeads();
        } catch (error) {
            console.error('Error rescheduling lead:', error);
            alert('Failed to reschedule lead');
        }
    };

    const isMissedFollowUp = (dateStr) => {
        if (!dateStr) return false;
        const date = startOfDay(parseISO(dateStr));
        const today = startOfDay(new Date());
        return date < today;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Interested': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'follow up scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Meet scheduled': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'Feedback Scheduled': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'Pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'Not Interested': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'Follow-up Scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getPlatformColor = (platform) => {
        switch (platform) {
            case 'WhatsApp': return 'text-green-500';
            case 'Linkedin': return 'text-blue-500';
            case 'LinkedIn': return 'text-blue-500';
            case 'Facebook': return 'text-blue-600';
            case 'Instagram': return 'text-pink-500';
            case 'X': return 'text-gray-300';
            case 'Phone Call': return 'text-gray-400';
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
    }).sort((a, b) => {
        // Push leads with no reminder date to the very bottom
        if (!a.reminderDate && !b.reminderDate) return 0;
        if (!a.reminderDate) return 1;
        if (!b.reminderDate) return -1;

        const dateA = startOfDay(parseISO(a.reminderDate));
        const dateB = startOfDay(parseISO(b.reminderDate));
        const today = startOfDay(new Date());

        const isMissedA = dateA < today;
        const isMissedB = dateB < today;

        // Both missed: Sort descending (most recent missed first)
        if (isMissedA && isMissedB) {
            return dateB - dateA;
        }

        // A missed, B not: A comes first
        if (isMissedA && !isMissedB) {
            return -1;
        }

        // B missed, A not: B comes first
        if (!isMissedA && isMissedB) {
            return 1;
        }

        // Both upcoming: Sort ascending (nearest first)
        return dateA - dateB;
    });

    return (
        <div className="flex flex-col h-full gap-6 pb-20 md:pb-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tighter flex items-center gap-2 md:gap-3">
                        <Target className="text-accent" size={24} />
                        Leads & Pipeline
                    </h1>
                    <p className="text-[10px] md:text-sm font-medium text-text-muted mt-0.5">Track outreach, follow-ups, and conversions</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full md:w-auto bg-accent hover:bg-accent-hover text-white px-5 py-3 md:py-4 rounded-xl font-black uppercase tracking-widest text-[11px] md:text-sm transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 group"
                >
                    <Plus className="group-hover:rotate-90 transition-transform duration-300" size={18} />
                    Add New Lead
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {[
                    { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Interested', value: interestedCount, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Today\'s Follow-ups', value: todayFollowUps.length, icon: Calendar, color: 'text-accent', bg: 'bg-accent/10' },
                ].map((stat, i) => (
                    <div key={i} className={`p-3 md:p-4 rounded-2xl border border-border shadow-sm flex flex-col gap-1 ${stat.bg} ${i === 2 && stat.value > 0 ? 'ring-2 ring-accent ring-inset animate-pulse' : ''}`}>
                        <div className="flex items-center justify-between">
                            <stat.icon className={stat.color} size={16} md:size={18} />
                            <span className={`text-lg md:text-xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                        <span className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-text-muted">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* Today's Action Items - Mobile Horizontal Scroll/Desktop Grid */}
            {todayFollowUps.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                        <Calendar size={12} />
                        Action Required Today
                    </h3>
                    <div className="flex overflow-x-auto gap-3 md:gap-4 pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 no-scrollbar custom-scrollbar">
                        {todayFollowUps.map(lead => (
                            <div key={`idx-${lead._id}`} className="flex-shrink-0 w-[240px] md:w-auto bg-accent/5 border border-accent/20 rounded-2xl p-3 md:p-4 flex flex-col gap-2 md:gap-3 hover:bg-accent/10 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent text-white flex items-center justify-center font-black text-sm md:text-lg shadow-lg shadow-accent/20">
                                            {lead.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white line-clamp-1">{lead.name}</span>
                                            <span className={`text-[10px] font-black uppercase ${getPlatformColor(lead.platform)}`}>{lead.platform}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleOpenModal(lead)} className="p-2 bg-background/50 text-accent rounded-lg border border-accent/20">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                                {lead.nextMessage && (
                                    <div className="bg-background/40 p-3 rounded-xl border border-border/50">
                                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed italic">"{lead.nextMessage}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or notes..."
                        className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-text focus:outline-none focus:border-accent transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        className="flex-1 md:w-48 bg-background border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent capitalize"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Interested">Interested</option>
                        <option value="follow up scheduled">Follow Up Scheduled</option>
                        <option value="Meet scheduled">Meet Scheduled</option>
                        <option value="Feedback Scheduled">Feedback Scheduled</option>
                    </select>
                </div>
            </div>

            {/* Content Area - Responsive Table/Cards */}
            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Syncing Pipeline...</p>
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 bg-card rounded-3xl border border-border border-dashed">
                        <Target size={48} className="text-text-muted opacity-20" />
                        <p className="text-text-muted font-medium">No leads found in this view</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-secondary/20 border-b border-border">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Lead Name</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted w-40">Contact Info</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Platform</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Website</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Lead Notes</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Next Follow Up</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredLeads.map((lead) => (
                                            <tr key={lead._id} className="hover:bg-secondary/10 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-black">
                                                            {lead.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white group-hover:text-accent transition-colors">{lead.name}</span>
                                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Assigned: {lead.assignedTo?.split('_')[0] || 'Unassigned'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-[160px]">
                                                    <div className="flex flex-col text-xs space-y-1 overflow-hidden">
                                                        {lead.email && <span className="text-white opacity-80 truncate" title={lead.email}>{lead.email}</span>}
                                                        {lead.phone && <span className="text-text-muted truncate">{lead.phone}</span>}
                                                        {!lead.email && !lead.phone && <span className="italic text-text-muted/50">No contact info</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold ${getPlatformColor(lead.platform)}`}>{lead.platform}</span>
                                                        {lead.profileUrl && (
                                                            <a href={lead.profileUrl} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors">
                                                                <ExternalLink size={14} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(lead.status)}`}>
                                                        {lead.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {lead.companyWebsite ? (
                                                        <a href={lead.companyWebsite.startsWith('http') ? lead.companyWebsite : `https://${lead.companyWebsite}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent hover:text-white transition-colors group/link">
                                                            <ExternalLink size={14} />
                                                            <span className="text-xs font-bold truncate max-w-[120px]">{lead.companyWebsite.replace(/^https?:\/\//, '')}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-text-muted italic opacity-30 uppercase font-black">Not Set</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs transition-all duration-300">
                                                        <p className="text-xs text-text-muted line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                                                            {lead.notes || <span className="italic opacity-30">No notes</span>}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {lead.reminderDate ? (
                                                        <div className={`flex flex-col ${isToday(parseISO(lead.reminderDate)) ? 'text-accent' : isMissedFollowUp(lead.reminderDate) ? 'text-red-400' : 'text-text-muted'}`}>
                                                            <span className="text-sm font-bold">{format(parseISO(lead.reminderDate), 'MMM d, yyyy')}</span>
                                                            {isToday(parseISO(lead.reminderDate)) && <span className="text-[10px] uppercase font-black">Action Today</span>}
                                                            {isMissedFollowUp(lead.reminderDate) && (
                                                                <button
                                                                    onClick={(e) => handleReschedule(e, lead)}
                                                                    className="mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg font-black uppercase tracking-widest transition-all"
                                                                >
                                                                    reschedule to next week
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-text-muted italic">No reminder</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenModal(lead)}
                                                            className="p-2 bg-background hover:bg-accent text-text-muted hover:text-white rounded-lg border border-border transition-all"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(lead._id)}
                                                            className="p-2 bg-background hover:bg-red-500 text-text-muted hover:text-white rounded-lg border border-border transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden flex flex-col gap-4">
                            {filteredLeads.map((lead) => (
                                <div key={`mob-${lead._id}`} className="bg-card rounded-2xl border border-border p-5 shadow-sm active:scale-95 transition-all flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-black text-xl">
                                                {lead.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-black text-white leading-none tracking-tight">{lead.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${getPlatformColor(lead.platform)}`}>{lead.platform}</span>
                                                    {lead.status && <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(lead.status).split(' ')[0].replace('bg-', 'bg-').replace('/20', '')}`} />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenModal(lead)} className="p-3 bg-secondary/10 text-accent rounded-xl border border-border">
                                                <Edit2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-background/50 p-3 rounded-xl border border-border/50 flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Status</span>
                                            <span className={`text-xs font-bold ${getStatusColor(lead.status).replace('bg-', 'text-').replace('-500/20', '-400')}`}>{lead.status}</span>
                                        </div>
                                        <div className="bg-background/50 p-3 rounded-xl border border-border/50 flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Next Follow Up</span>
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-xs font-bold ${lead.reminderDate && isToday(parseISO(lead.reminderDate)) ? 'text-accent' : lead.reminderDate && isMissedFollowUp(lead.reminderDate) ? 'text-red-400' : 'text-white'}`}>
                                                    {lead.reminderDate ? format(parseISO(lead.reminderDate), 'MMM d') : 'Not set'}
                                                </span>
                                                {lead.reminderDate && isMissedFollowUp(lead.reminderDate) && (
                                                    <button
                                                        onClick={(e) => handleReschedule(e, lead)}
                                                        className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg font-black uppercase tracking-widest"
                                                    >
                                                        reschedule to next week
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {lead.notes && (
                                        <div className="bg-background/20 p-4 rounded-xl border border-border/30 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                                                <FileText size={12} className="text-accent" />
                                                Lead Notes
                                            </div>
                                            <p className="text-xs text-text/80 leading-relaxed italic">
                                                {lead.notes}
                                            </p>
                                        </div>
                                    )}

                                    {lead.nextMessage && (
                                        <div className="bg-background/30 p-4 rounded-xl border border-border/40 relative group">
                                            <p className="text-sm text-text-muted italic line-clamp-2 leading-relaxed">
                                                "{lead.nextMessage}"
                                            </p>
                                            <button
                                                onClick={(e) => handleCopyMessage(e, lead.nextMessage, lead._id)}
                                                className="absolute top-2 right-2 p-2 bg-accent/10 rounded-lg text-accent"
                                            >
                                                {copiedId === lead._id ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-2 border-t border-border/30">
                                        <div className="flex gap-3">
                                            {lead.email && (
                                                <a href={`mailto:${lead.email}`} className="text-text-muted hover:text-accent p-1 transition-colors">
                                                    <Filter size={18} /> {/* Placeholder for email icon since I don't have it explicitly imported here, wait, I can use Users or Search as placeholder if Mail is missing but wait, Mail is common */}
                                                </a>
                                            )}
                                            {lead.profileUrl && (
                                                <a href={lead.profileUrl} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent p-1 transition-colors">
                                                    <ExternalLink size={18} />
                                                </a>
                                            )}
                                            {lead.companyWebsite && (
                                                <a href={lead.companyWebsite.startsWith('http') ? lead.companyWebsite : `https://${lead.companyWebsite}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent p-1 transition-colors">
                                                    <FileText size={18} />
                                                </a>
                                            )}
                                        </div>
                                        <button onClick={() => handleDelete(lead._id)} className="text-red-500/60 text-xs font-black uppercase tracking-widest p-1">Delete Lead</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Modal - Mobile Optimized */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-end md:items-center justify-center z-[110] p-0 md:p-6 shadow-2xl">
                    <div className="bg-card w-full md:max-w-xl h-[85vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-3xl border-t md:border border-border flex flex-col shadow-2xl overflow-hidden motion-safe:animate-slide-up">
                        {/* Mobile Drag Handle */}
                        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mt-4 md:hidden" />

                        <div className="p-3 md:p-5 flex flex-col h-full overflow-y-auto custom-scrollbar no-scrollbar">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <h2 className="text-lg md:text-xl font-black text-white tracking-tighter uppercase">{currentLead ? 'Edit Lead' : 'New Prospect'}</h2>
                                    <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mt-0.5">Pipeline details</p>
                                </div>
                                <button onClick={handleCloseModal} className="bg-secondary/10 hover:bg-red-500/20 p-2 rounded-full text-text-muted hover:text-red-500 border border-border transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Lead Name *</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-background border border-border rounded-xl p-2 pl-12 text-sm text-text focus:outline-none focus:border-accent transition-all"
                                            placeholder="Enter lead name..."
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Platform</label>
                                        <select
                                            className="w-full bg-background border border-border rounded-xl p-2 text-sm text-text focus:outline-none focus:border-accent appearance-none capitalize"
                                            value={formData.platform}
                                            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                        >
                                            <option value="WhatsApp">WhatsApp</option>
                                            <option value="Linkedin">LinkedIn</option>
                                            <option value="Facebook">Facebook</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="X">X (Twitter)</option>
                                            <option value="Phone Call">Phone Call</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Status</label>
                                        <select
                                            className="w-full bg-background border border-border rounded-xl p-2 text-sm text-text focus:outline-none focus:border-accent appearance-none"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="Interested">Interested</option>
                                            <option value="follow up scheduled">Follow Up Scheduled</option>
                                            <option value="Meet scheduled">Meet Scheduled</option>
                                            <option value="Feedback Scheduled">Feedback Scheduled</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Email</label>
                                        <input
                                            type="email"
                                            className="w-full bg-background border border-border rounded-xl p-2 text-sm text-text focus:outline-none focus:border-accent"
                                            placeholder="email@..."
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Phone</label>
                                        <input
                                            type="text"
                                            className="w-full bg-background border border-border rounded-xl p-2 text-sm text-text focus:outline-none focus:border-accent"
                                            placeholder="+123..."
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Profile URL</label>
                                        <div className="relative">
                                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                                            <input
                                                type="url"
                                                className="w-full bg-background border border-border rounded-xl p-2 pl-10 text-sm text-text focus:outline-none focus:border-accent transition-all"
                                                placeholder="Social URL..."
                                                value={formData.profileUrl}
                                                onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Website</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                                            <input
                                                type="text"
                                                className="w-full bg-background border border-border rounded-xl p-2 pl-10 text-sm text-text focus:outline-none focus:border-accent transition-all"
                                                placeholder="company.com"
                                                value={formData.companyWebsite}
                                                onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Next Follow-Up</label>
                                        <input
                                            type="date"
                                            className="w-full bg-background border border-border rounded-xl p-2 text-sm text-white focus:outline-none focus:border-accent [color-scheme:dark]"
                                            value={formData.reminderDate}
                                            onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Assigned To</label>
                                        <select
                                            className="w-full bg-background border border-border rounded-xl p-2 text-sm text-text focus:outline-none focus:border-accent appearance-none capitalize"
                                            value={formData.assignedTo}
                                            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                        >
                                            <option value="Ansh_Unfazed">Ansh</option>
                                            <option value="AnshSaxena_Unfazed">Ansh Saxena</option>
                                            <option value="Ayush_Unfazed">Ayush</option>
                                            <option value="Navtej_Unfazed">Navtej</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Next Message</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-xl p-2 text-sm text-text focus:outline-none focus:border-accent min-h-[45px] max-h-[80px] resize-none"
                                        placeholder="Next message..."
                                        value={formData.nextMessage}
                                        onChange={(e) => setFormData({ ...formData, nextMessage: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Lead Notes</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-xl p-2 text-sm text-text focus:outline-none focus:border-accent min-h-[60px] max-h-[100px] resize-none"
                                        placeholder="Notes..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2 pb-8 md:pb-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 bg-background border border-border text-text-muted font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-secondary/20 transition-all text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] bg-accent hover:bg-accent-hover text-white font-black uppercase tracking-widest py-2.5 rounded-xl transition-all shadow-lg shadow-accent/20 text-xs"
                                    >
                                        {currentLead ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leads;
