import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Briefcase, LogOut, Table, ChevronLeft, ChevronRight, Calendar, FileText, Target, Menu, X } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, closeSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-close sidebar on mobile when route changes
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        };
        // Close on navigation (mobile only check handled in Layout or here implicitly)
        // Actually best done by checking if we are on mobile. 
        // We will just call closeSidebar() which should handle closing.
        // But to be safe, let's just use the click handler on NavLinks.
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
        { path: '/dashboard/subspaces', icon: LayoutDashboard, label: 'Subspaces' },
        { path: '/dashboard/todos', icon: CheckSquare, label: 'To-Do List' },
        { path: '/dashboard/daily-works', icon: Calendar, label: 'Daily Works' },
        { path: '/dashboard/agency', icon: Briefcase, label: 'Agency Work' },
        { path: '/dashboard/records', icon: Table, label: 'Records' },
        { path: '/dashboard/goals', icon: Target, label: 'Goals' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`
                    fixed inset-y-0 left-0 z-50
                    bg-card border-r border-border flex flex-col justify-start transition-all duration-300
                    ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
                    md:relative md:h-screen
                `}
            >
                <div className={`p-4 flex items-center justify-between md:mb-4 ${!isOpen ? 'md:justify-center' : ''}`}>
                    <div className={`flex flex-col px-2 bg-transparent ${!isOpen ? 'md:hidden' : ''}`}>
                        <h1 className="text-2xl font-bold text-accent whitespace-nowrap overflow-hidden leading-none">Unfazed</h1>
                        <span className="text-[10px] text-white font-normal leading-none opacity-80">Workspace</span>
                    </div>

                    {/* Mobile: Close Button */}
                    <button
                        onClick={toggleSidebar}
                        className="md:hidden p-1 text-text-muted hover:text-white"
                    >
                        <X size={24} />
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
                    flex flex-col space-y-2 px-2
                    overflow-y-auto flex-1 custom-scrollbar
                `}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (window.innerWidth < 768) closeSidebar();
                            }}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-border/50 hover:text-text'
                                } ${!isOpen && 'md:justify-center md:px-2'}`
                            }
                            title={!isOpen ? item.label : ''}
                        >
                            <item.icon size={20} className="min-w-[20px]" />
                            <span className={`text-sm ${!isOpen ? 'md:hidden' : 'block'}`}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Logout */}
                <div className="p-4 border-t border-border mt-auto">
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
        </>
    );
};

const Layout = () => {
    // Default to true (open) on desktop, false (closed) on mobile
    // We can initialize based on window width, or just default to true and let CSS handle the 'md:hidden' if needed,
    // but since we switched to 'fixed' on mobile with transform, we need state to match.
    // Let's rely on a resilient default.
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-background text-text overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-30">
                <div className="flex flex-col text-left">
                    <h1 className="text-xl font-bold text-accent leading-none">Unfazed</h1>
                    <span className="text-[10px] text-white/70 leading-none">Workspace</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-text-muted hover:text-white"
                >
                    <Menu size={24} />
                </button>
            </header>

            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeSidebar={closeSidebar} />

            <main className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar relative w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
