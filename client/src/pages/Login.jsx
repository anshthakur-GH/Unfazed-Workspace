import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('username', res.data.username);
                navigate('/dashboard/leads');
            }
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="flex flex-col items-center justify-start pt-32 h-screen" style={{ backgroundColor: '#080508' }}>
            <div className="mb-8">
                <img
                    src="/Logo GIF.gif"
                    alt="Unfazed Logo"
                    className="w-48 md:w-64 object-contain"
                    style={{ clipPath: 'inset(0 10% 0 10%)' }}
                />
            </div>
            <div className="w-full max-w-md p-8 bg-card rounded-xl border border-border shadow-lg">
                <div className="flex flex-col items-center mb-6">
                    <h1 className="text-4xl font-bold text-accent leading-none">Unfazed</h1>
                    <span className="text-sm text-white font-normal leading-none opacity-80">Workspace</span>
                </div>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-text-muted mb-1">Username</label>
                        <input
                            type="text"
                            className="w-full p-3 rounded-lg bg-background border border-border text-text focus:outline-none focus:border-accent"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-text-muted mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full p-3 rounded-lg bg-background border border-border text-text focus:outline-none focus:border-accent"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-lg transition-colors"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
