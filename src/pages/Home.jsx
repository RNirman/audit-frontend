import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login, token, role } = useContext(AuthContext);

    // Auto-redirect if already logged in
    useEffect(() => {
        if (token && role) {
            if (role === 'SME') navigate('/sme');
            else if (role === 'AUDITOR' || role === 'GOV_AUDITOR') navigate('/auditor');
            else if (role === 'ADMIN') navigate('/admin');
        }
    }, [token, role, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await api.post('/login', { username, password });

            // 1. Save Session Data via Context
            login(res.data);

            // 2. Redirect based on Role
            // Small delay to show the loading animation (UX best practice)
            setTimeout(() => {
                if (res.data.role === 'SME') {
                    navigate('/sme');
                } else if (res.data.role === 'AUDITOR') {
                    navigate('/auditor');
                } else if (res.data.role === 'ADMIN') {
                    navigate('/admin');
                } else if (res.data.role === 'GOV_AUDITOR') {
                    navigate('/auditor');
                }
            }, 500);

        } catch (err) {
            toast.error('Invalid credentials. Please check your username/password.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

            {/* 1. LOGO & BRANDING */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
                <div className="flex justify-center mb-4 animate-bounce-slow">
                    <ShieldCheck size={56} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-100 tracking-tight drop-shadow-md">
                    AuditControl <span className="text-indigo-400">Pro</span>
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                    Secure Blockchain Auditing & Compliance
                </p>
            </div>

            {/* 2. LOGIN CARD */}
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="glass-card py-8 px-4 sm:rounded-xl sm:px-10 border border-gray-700/50 shadow-2xl shadow-black/50">
                    
                    <form className="space-y-6" onSubmit={handleLogin}>
                        
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                                Username
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                    placeholder="Enter your ID"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white 
                                    ${isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500'}
                                    transition-all duration-200
                                `}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Authenticating...
                                    </span>
                                ) : "Sign in to Dashboard"}
                            </button>
                        </div>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-800" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-900/50 backdrop-blur-md text-gray-500 rounded-full">
                                    Protected System
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 text-center text-xs text-gray-400">
                            &copy; 2026 AuditControl Inc. All rights reserved. <br/>
                            Hyperledger Fabric v2.5 Powered
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Home;