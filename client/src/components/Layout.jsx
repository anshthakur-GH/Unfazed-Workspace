import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Briefcase, LogOut, Table, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard/subspaces', icon: LayoutDashboard, label: 'Subspaces' },
        { path: '/dashboard/todos', icon: CheckSquare, label: 'To-Do List' },
        { path: '/dashboard/agency', icon: Briefcase, label: 'Agency Work' },
        { path: '/dashboard/records', icon: Table, label: 'Records' },
    ];

    return (
        <aside
            className={`${isOpen ? 'w-64' : 'w-20'} bg-card border-r border-border h-screen flex flex-col transition-all duration-300 relative`}
        >
            <div className={`p-4 flex items-center ${isOpen ? 'justify-between' : 'justify-center'} mb-4`}>
                {isOpen && (
                    <div className="flex flex-col px-2 bg-transparent">
                        <h1 className="text-2xl font-bold text-accent whitespace-nowrap overflow-hidden leading-none">Unfazed</h1>
                        <span className="text-[10px] text-white font-normal leading-none opacity-80">Workflow</span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-full hover:bg-accent/10 text-text-muted hover:text-accent transition-colors"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            <nav className="flex-1 space-y-2 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center ${isOpen ? 'px-4 space-x-3' : 'justify-center px-2'} py-3 rounded-lg transition-colors ${isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-border/50 hover:text-text'
                            }`
                        }
                        title={!isOpen ? item.label : ''}
                    >
                        <item.icon size={20} className="min-w-[20px]" />
                        {isOpen && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4">
                <button
                    onClick={handleLogout}
                    className={`flex items-center ${isOpen ? 'px-4 space-x-3' : 'justify-center px-2'} py-3 text-text-muted hover:text-red-500 transition-colors w-full rounded-lg hover:bg-border/50`}
                    title={!isOpen ? 'Logout' : ''}
                >
                    <LogOut size={20} className="min-w-[20px]" />
                    {isOpen && <span className="whitespace-nowrap overflow-hidden">Logout</span>}
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
        <div className="flex h-screen bg-background text-text overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <main className="flex-1 overflow-auto p-8 custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
