import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User } from 'lucide-react';

const Goals = () => {
    const navigate = useNavigate();
    const users = [
        { name: 'Ansh Thakur', id: 'ansh-thakur' },
        { name: 'Navtej', id: 'navtej' },
        { name: 'Ansh Saxena', id: 'ansh-saxena' },
        { name: 'Ayush', id: 'ayush' }
    ];

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
            <div className="mb-10">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-400 mb-2">
                    Team Goals
                </h1>
                <p className="text-text-muted text-lg">
                    Select a team member to view their goals and progress.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {users.map((user) => (
                    <div
                        key={user.id}
                        onClick={() => navigate(`/dashboard/goals/${user.name}`)}
                        className="group bg-card border border-border hover:border-accent/50 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg hover:shadow-accent/5 flex flex-col items-center justify-center gap-4 aspect-square"
                    >
                        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <User size={40} className="text-accent" />
                        </div>
                        <h3 className="text-xl font-bold text-text group-hover:text-accent transition-colors">
                            {user.name}
                        </h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Goals;
