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
            className={`
                ${isOpen ? 'w-full md:w-64 h-auto md:h-screen' : 'w-full md:w-20 h-auto md:h-screen'} 
                bg-card border-b md:border-b-0 md:border-r border-border flex flex-row md:flex-col justify-between md:justify-start transition-all duration-300 relative z-50
            `}
        >
            <div className={`p-4 flex items-center ${isOpen ? 'justify-between' : 'justify-center'} md:mb-4`}>
                {isOpen && (
                    <div className="flex flex-col px-2 bg-transparent">
                        <h1 className="text-2xl font-bold text-accent whitespace-nowrap overflow-hidden leading-none">Unfazed</h1>
                        <span className="text-[10px] text-white font-normal leading-none opacity-80">Workflow</span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-full hover:bg-accent/10 text-text-muted hover:text-accent transition-colors md:block"
                >
                    {isOpen ? <ChevronLeft size={20} className="hidden md:block" /> : <ChevronRight size={20} className="hidden md:block" />}
                    <span className="md:hidden">
                        {isOpen ? <ChevronLeft size={20} className="rotate-90" /> : <ChevronRight size={20} className="rotate-90" />}
                        {/* Actually on mobile a simple hamburger or verify content is better, keeping simple toggle for now */}
                        {isOpen ? "Close" : "Menu"}
                    </span>
                    {/* Wait, the toggle on mobile usually toggles the menu items visibility. 
                        My current logic toggles 'width', which on mobile I mapped to 'w-full'. 
                        If 'w-20' (collapsed) on mobile, it might look weird if it's top bar.
                        Let's adjust:
                        Mobile Open: w-full h-auto (show nav)
                        Mobile Closed: w-full h-16 (hide nav) - wait, height is better to animate.
                        The provided plan led to flex-row. Let's stick to the prompt's simplicity primarily.
                        
                        Correction: The user wants "vertically and properly in small text".
                        Let's make Sidebar a standard bottom nav or top nav?
                        Or just keep side bar but stack it?
                        "mobile view the things should appear vertically" implies stacking content.
                        
                        Re-reading implementation plan: 
                        "Sidebar: On mobile: w-full h-auto flex-row justify-between items-center."
                     */}
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            <nav className={`
                ${isOpen ? 'flex' : 'hidden md:flex'} 
                flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 px-2 overflow-x-auto md:overflow-visible
            `}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center ${isOpen ? 'px-4 space-x-3' : 'justify-center px-2'} py-3 rounded-lg transition-colors whitespace-nowrap ${isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-border/50 hover:text-text'
                            }`
                        }
                        title={!isOpen ? item.label : ''}
                    >
                        <item.icon size={20} className="min-w-[20px]" />
                        {isOpen && <span className="text-sm">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>
            <div className={`p-4 ${isOpen ? 'block' : 'hidden md:block'}`}>
                <button
                    onClick={handleLogout}
                    className={`flex items-center ${isOpen ? 'px-4 space-x-3' : 'justify-center px-2'} py-3 text-text-muted hover:text-red-500 transition-colors w-full rounded-lg hover:bg-border/50`}
                    title={!isOpen ? 'Logout' : ''}
                >
                    <LogOut size={20} className="min-w-[20px]" />
                    {isOpen && <span className="whitespace-nowrap overflow-hidden text-sm">Logout</span>}
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
