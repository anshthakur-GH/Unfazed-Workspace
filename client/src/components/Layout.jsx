import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Briefcase, LogOut, Table, ChevronLeft, ChevronRight, Calendar, FileText, Menu, X, Target, Bell } from 'lucide-react';
import axios from 'axios';
import { isToday, parseISO } from 'date-fns';
import { API_URL } from '../config';
import BottomNav from './BottomNav';

const Sidebar = ({ isOpen, toggleSidebar, closeSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [todayFollowUpsCount, setTodayFollowUpsCount] = useState(0);

    useEffect(() => {
        const fetchFollowups = async () => {
            const username = localStorage.getItem('username');
            if (!username) return;
            try {
                const response = await axios.get(`${API_URL}/api/leads`);
                const todayFollowUps = response.data.filter(l => {
                    if (!l.reminderDate) return false;
                    return isToday(parseISO(l.reminderDate));
                });
                setTodayFollowUpsCount(todayFollowUps.length);
            } catch (error) {
                console.error('Error fetching leads for notifications:', error);
            }
        };

        fetchFollowups();
    }, [location.pathname]);


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/');
    };

    const username = localStorage.getItem('username');
    const allowedInvoiceUsers = ['Ansh_Unfazed', 'Ayush_Unfazed', 'AnshSaxena_Unfazed'];
    const canViewInvoices = allowedInvoiceUsers.includes(username);

    const navItems = [
        ...(canViewInvoices ? [{ path: '/dashboard/invoices', icon: FileText, label: 'Invoices' }] : []),
        { path: '/dashboard/todos', icon: CheckSquare, label: 'To/Do list' },
        { path: '/dashboard/leads', icon: Target, label: 'Potential Leads / Follow Up' },
        { path: '/dashboard/agency', icon: Briefcase, label: 'Project Progress' },
        { path: '/dashboard/subspaces', icon: LayoutDashboard, label: 'Subspaces' },
        { path: '/dashboard/records', icon: Table, label: 'Records - sheet' },
        { path: '/dashboard/goals', icon: Target, label: 'Goals' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-md transition-all duration-300"
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`
                    fixed inset-y-0 left-0 z-[70]
                    bg-card border-r border-border flex flex-col justify-start transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                    ${isOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0 md:w-20'}
                    md:relative md:h-screen
                `}
            >
                <div className={`p-6 flex items-center justify-between md:mb-4 ${!isOpen ? 'md:justify-center' : ''}`}>
                    <div className={`flex flex-col px-2 bg-transparent ${!isOpen ? 'md:hidden' : ''}`}>
                        <h1 className="text-2xl font-black text-accent tracking-tighter whitespace-nowrap overflow-hidden leading-none">UNFAZED</h1>
                        <span className="text-[10px] text-white font-bold tracking-[0.2em] uppercase leading-none opacity-50 mt-1">Workspace</span>
                    </div>

                    {/* Mobile: Close Button */}
                    <button
                        onClick={closeSidebar}
                        className="md:hidden p-2 bg-background/50 rounded-full text-text-muted hover:text-white border border-border"
                    >
                        <X size={20} />
                    </button>

                    {/* Desktop: Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className="hidden md:block p-2 rounded-full hover:bg-accent/10 text-text-muted hover:text-accent transition-colors"
                    >
                        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                <nav className="flex flex-col space-y-1 px-3 overflow-y-auto flex-1 custom-scrollbar py-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-accent text-white shadow-lg shadow-accent/20 translate-x-1'
                                    : 'text-text-muted hover:bg-white/5 hover:text-white'
                                } ${!isOpen && 'md:justify-center md:px-2 md:translate-x-0'}`
                            }
                            title={!isOpen ? item.label : ''}
                        >
                            <item.icon size={20} className={`min-w-[20px] transition-transform duration-300 group-hover:scale-110`} />
                            <span className={`text-sm font-medium ${!isOpen ? 'md:hidden' : 'block'}`}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-border mt-auto">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center space-x-3 px-4 py-3 text-text-muted hover:text-red-500 transition-all rounded-xl hover:bg-red-500/5 ${!isOpen && 'md:justify-center md:px-2'}`}
                    >
                        <LogOut size={20} className="min-w-[20px]" />
                        <span className={`${!isOpen ? 'md:hidden' : 'block'} text-sm font-medium`}>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Reset scroll position on route change
    useEffect(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTo(0, 0);
    }, [location.pathname]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-background text-text overflow-hidden selection:bg-accent/30">
            {/* Mobile Header - More Compact */}
            <header className="md:hidden flex items-center justify-between px-6 h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-[40]">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-accent leading-none tracking-tighter">UNFAZED</h1>
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Workspace</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/leads')}
                        className="p-1.5 text-text-muted relative"
                    >
                        <Bell size={20} />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-card"></span>
                    </button>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 text-text-muted hover:text-white rounded-lg bg-background/50 border border-border transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </header>


            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeSidebar={closeSidebar} />

            <main className="flex-1 overflow-auto px-4 py-6 md:p-8 custom-scrollbar relative w-full pb-24 md:pb-8">
                <div className="max-w-7xl mx-auto h-full">
                    <Outlet />
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default Layout;

