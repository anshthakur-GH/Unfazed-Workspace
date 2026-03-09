import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('username', res.data.username);
                navigate('/dashboard/leads');
            } else {
                setLoading(false);
                setError('Invalid credentials');
            }
        } catch (err) {
            setLoading(false);
            setError('Invalid credentials');
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-start pt-32 h-screen overflow-hidden" style={{ backgroundColor: '#080508' }}>
            {loading && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                    <p className="mt-4 text-accent font-bold">Authenticating...</p>
                </div>
            )}

            <div className="mb-12 relative z-10">
                <img
                    src="/Logo.png"
                    alt="Unfazed Logo"
                    className="w-48 md:w-64 object-contain filter drop-shadow-[0_0_15px_rgba(255,107,0,0.3)]"
                    style={{ clipPath: 'inset(0 10% 0 10%)' }}
                />
            </div>

            <div
                className="w-full max-w-md p-8 bg-card/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-5xl font-black text-accent tracking-tighter leading-none mb-1">Unfazed</h1>
                    <span className="text-xs uppercase font-black tracking-[0.3em] text-white opacity-40">Workspace</span>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-center text-sm mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-text-muted px-1">Username</label>
                        <input
                            type="text"
                            className="w-full p-4 rounded-2xl bg-background/50 border border-white/5 text-text focus:outline-none focus:border-accent transition-all placeholder-white/20"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-text-muted px-1">Password</label>
                        <input
                            type="password"
                            className="w-full p-4 rounded-2xl bg-background/50 border border-white/5 text-text focus:outline-none focus:border-accent transition-all placeholder-white/20"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-4 bg-accent hover:bg-accent-hover text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-accent/30 active:scale-95 mt-4"
                    >
                        Login
                    </button>
                </form>
            </div>

            <p className="mt-12 text-white/40 font-medium italic relative z-10">
                "Unfazed Workspace for Team Unfazed"
            </p>
        </div>
    );
};

export default Login;
