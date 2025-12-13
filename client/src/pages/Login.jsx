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
                navigate('/dashboard/subspaces');
            }
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-full max-w-md p-8 bg-card rounded-xl border border-border shadow-lg">
                <h2 className="text-3xl font-bold text-accent mb-6 text-center">Unfazed Workspace</h2>
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
