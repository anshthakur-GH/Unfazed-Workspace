import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckSquare, Target, Briefcase, LayoutDashboard, Calendar, Table } from 'lucide-react';

const BottomNav = () => {
    const navItems = [
        { path: '/dashboard/todos', icon: CheckSquare, label: 'Tasks' },
        { path: '/dashboard/leads', icon: Target, label: 'Leads' },
        { path: '/dashboard/agency', icon: Briefcase, label: 'Agency' },
        { path: '/dashboard/daily-works', icon: Calendar, label: 'Daily' },
        { path: '/dashboard/subspaces', icon: LayoutDashboard, label: 'Space' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50 flex justify-around items-center h-16 px-2 safe-area-pb">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${isActive ? 'text-accent' : 'text-text-muted hover:text-text'
                        }`
                    }
                >
                    <item.icon size={20} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
