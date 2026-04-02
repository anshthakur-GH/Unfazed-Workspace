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
                navigate('/dashboard/goals');
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
        <div className="relative flex flex-col items-center justify-center min-h-screen py-10" style={{ backgroundColor: '#080508' }}>
            {loading && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                    <p className="mt-4 text-accent font-bold">Authenticating...</p>
                </div>
            )}

            <div className="mb-8 relative z-10 w-20 h-20 md:w-24 md:h-24 overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl">
                <img
                    src="/Logo GIF.gif"
                    alt="Unfazed Logo"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[125%] h-[125%] max-w-none object-cover filter drop-shadow-[0_0_15px_rgba(255,107,0,0.3)]"
                />
            </div>

            <div
                className="w-[90%] max-w-[400px] p-8 bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-6">
                    <h1 className="text-4xl font-black text-accent tracking-tighter leading-none mb-1">Unfazed</h1>
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white opacity-40">Workspace</span>
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

            <div className="max-w-[700px] mt-12 px-8 text-center animate-slide-up relative z-10">
                <p className="text-xs md:text-sm leading-relaxed text-white/40 font-sans tracking-wide">
                    <span className="text-accent font-black uppercase tracking-[0.2em] mr-2 text-[10px]"></span>
                    <span className="text-accent font-semibold">Unfazed AI</span> becomes a global leader in AI powered business automation by <span className="text-accent font-bold">2028</span> by building the AI operational layer that enables companies to run continuously through autonomous workflows. While more than <span className="text-accent font-bold">10K</span> autonomous workflows run through <span className="text-accent font-semibold">Unfazed AI</span>.
                </p>
            </div>

            <p className="mt-12 text-white/20 text-[10px] uppercase tracking-[0.3em] font-black relative z-10">
                "Unfazed Workspace for Team Unfazed."
            </p>
        </div>
    );
};

export default Login;
