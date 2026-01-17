import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Briefcase, LogOut, Table, ChevronLeft, ChevronRight, Calendar, FileText } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard/invoices', icon: FileText, label: 'Invoices' },
        { path: '/dashboard/subspaces', icon: LayoutDashboard, label: 'Subspaces' },
        { path: '/dashboard/todos', icon: CheckSquare, label: 'To-Do List' },
        { path: '/dashboard/daily-works', icon: Calendar, label: 'Daily Works' },
        { path: '/dashboard/agency', icon: Briefcase, label: 'Agency Work' },
        { path: '/dashboard/records', icon: Table, label: 'Records' },
    ];

    return (

        <aside
            className={`
                ${isOpen ? 'w-full md:w-64 h-auto md:h-screen' : 'w-full md:w-20 h-auto md:h-screen'} 
                bg-card border-b md:border-b-0 md:border-r border-border flex flex-col justify-start transition-all duration-300 relative z-50
            `}
        >
            <div className={`p-4 flex items-center justify-between md:mb-4 ${!isOpen ? 'md:justify-center' : ''}`}>
                <div className={`flex flex-col px-2 bg-transparent ${!isOpen ? 'md:hidden' : ''}`}>
                    <h1 className="text-2xl font-bold text-accent whitespace-nowrap overflow-hidden leading-none">Unfazed</h1>
                    <span className="text-[10px] text-white font-normal leading-none opacity-80">Workspace</span>
                </div>

                {/* Mobile: Logout Button Top Right */}
                <button
                    onClick={handleLogout}
                    className="md:hidden flex items-center space-x-2 text-text-muted hover:text-red-500 transition-colors"
                    title="Logout"
                >
                    <span className="text-xs">Logout</span>
                    <LogOut size={16} />
                </button>

                {/* Desktop: Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="hidden md:block p-2 rounded-full hover:bg-accent/10 text-text-muted hover:text-accent transition-colors"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            <nav className={`
                flex
                flex-row md:flex-col 
                md:space-y-2
                space-x-4 md:space-x-0
                px-4 pb-4 md:px-2 md:pb-0
                overflow-x-auto md:overflow-visible
                no-scrollbar
            `}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-2 md:space-x-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition-colors whitespace-nowrap ${isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-border/50 hover:text-text'
                            } ${!isOpen && 'md:justify-center md:px-2'}`
                        }
                        title={!isOpen ? item.label : ''}
                    >
                        <item.icon size={16} className="md:w-5 md:h-5" />
                        <span className={`text-xs md:text-sm ${!isOpen ? 'md:hidden' : 'block'}`}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Desktop: Bottom Logout */}
            <div className={`
                hidden md:block
                p-4 border-t border-border md:border-t-0
            `}>
                <button
                    onClick={handleLogout}
                    className={`flex items-center space-x-3 px-4 py-3 text-text-muted hover:text-red-500 transition-colors w-full rounded-lg hover:bg-border/50 ${!isOpen && 'md:justify-center md:px-2'}`}
                    title={!isOpen ? 'Logout' : ''}
                >
                    <LogOut size={20} className="min-w-[20px]" />
                    <span className={`${!isOpen ? 'md:hidden' : 'block'} whitespace-nowrap overflow-hidden text-sm`}>Logout</span>
                </button>
            </div>
        </aside>
    );
};

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-background text-text overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <main className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
