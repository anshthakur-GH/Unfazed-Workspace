import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Briefcase, LogOut, Table } from 'lucide-react';

const Sidebar = () => {
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
        <aside className="w-64 bg-card border-r border-border h-screen flex flex-col p-4">
            <h1 className="text-2xl font-bold text-accent mb-8 px-2">Unfazed</h1>
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-border/50 hover:text-text'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 text-text-muted hover:text-red-500 transition-colors mt-auto"
            >
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </aside>
    );
};

const Layout = () => {
    return (
        <div className="flex h-screen bg-background text-text overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto p-8 custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
