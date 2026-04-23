import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShieldCheck, UserPlus, Trash2, Activity, Server, Users, AlertTriangle, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPortal = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [health, setHealth] = useState(null);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'SME', name: '', companyId: '' });
    const [isFormOpen, setIsFormOpen] = useState(false);

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const [usersRes, logsRes, healthRes] = await Promise.all([
                api.get('/users'),
                api.get('/admin/logs'),
                api.get('/admin/health')
            ]);
            setUsers(usersRes.data);
            setLogs(logsRes.data);
            setHealth(healthRes.data);
        } catch (err) {
            console.error("Fetch failed");
        }
    };

    useEffect(() => {
        let isMounted = true;
        let timeoutId;

        const pollData = async () => {
            if (!isMounted) return;
            await fetchData();
            if (isMounted) {
                timeoutId = setTimeout(pollData, 10000);
            }
        };

        pollData();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    // --- HANDLERS ---
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            toast.success('User Created Successfully!');
            setFormData({ username: '', password: '', role: 'SME', name: '', companyId: '' });
            fetchData();
            setTimeout(() => setIsFormOpen(false), 1500);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to create user");
        }
    };

    const handleDelete = async (username) => {
        if (window.confirm(`Delete user ${username}?`)) {
            try {
                await api.delete(`/users/${username}`);
                toast.success('User deleted');
                fetchData();
            } catch (error) { toast.error("Delete failed"); }
        }
    };

    return (
        <div className="min-h-screen font-sans pb-12">
            
            {/* NAVIGATION */}
            <nav className="glass-nav border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <ShieldCheck className="text-indigo-400 mr-2" size={28} />
                            <h1 className="text-xl font-bold text-gray-100 tracking-wider">System<span className="text-indigo-400">Admin</span></h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 px-3 py-1 rounded text-sm transition-colors">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* TOP ROW: HEALTH & ACTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Network Health Card */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <h2 className="text-lg font-bold text-gray-200 border-b border-gray-800 pb-2 mb-4 flex items-center gap-2"><Activity className="text-indigo-400" size={20} /> Network Health</h2>
                        {health ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {health.nodes.map((node, i) => (
                                    <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center flex flex-col items-center">
                                        {node.status.includes('🟢') ? <Server size={24} className="text-gray-400 mb-2" /> : <AlertTriangle size={24} className="text-orange-400 mb-2" />}
                                        <div className="text-xs font-bold text-gray-300 uppercase">{node.type}</div>
                                        <div className="text-[10px] font-mono text-gray-500 truncate mt-1" title={node.name}>{node.name}</div>
                                        <div className="text-xs mt-2 font-semibold text-gray-300">{node.status}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-800 rounded w-3/4"></div></div></div>
                        )}
                    </div>

                    {/* Quick Actions Card */}
                    <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
                        <h2 className="text-lg font-bold text-gray-200 mb-2">User Management</h2>
                        <p className="text-sm text-gray-400 mb-6">Manage system access and permissions.</p>
                        <button onClick={() => setIsFormOpen(!isFormOpen)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg shadow-md font-bold transition-all flex items-center justify-center gap-2 border border-indigo-500/50">
                            {isFormOpen ? <><Trash2 size={18} /> Close Form</> : <><UserPlus size={18} /> Add New User</>}
                        </button>
                    </div>
                </div>

                {/* ADD USER FORM (Collapsible) */}
                {isFormOpen && (
                    <div className="glass-card p-6 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-800 pb-2">Create New Account</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-medium text-gray-400 mb-1">Username</label><input name="username" value={formData.username} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-400 mb-1">Password</label><input name="password" type="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label><input name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="SME">SME (Client)</option><option value="AUDITOR">Auditor</option><option value="GOV_AUDITOR">Gov. Auditor</option><option value="ADMIN">Administrator</option>
                                </select>
                            </div>
                            {formData.role === 'SME' && (
                                <div className="md:col-span-2 bg-indigo-500/10 p-4 rounded-lg border border-indigo-500/20">
                                    <label className="block text-sm font-bold text-indigo-400 mb-1">Assign Company ID</label>
                                    <input name="companyId" value={formData.companyId} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-600" placeholder="e.g. COMP_001" />
                                </div>
                            )}
                            <div className="md:col-span-2 flex items-center justify-end gap-4 mt-2">
                                {/* Message removed, handled by toast */}
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg border border-indigo-500/50">Create User</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* BOTTOM ROW: USERS & LOGS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* User List Table */}
                    <div className="glass-card overflow-hidden flex flex-col h-[500px]">
                        <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800"><h2 className="text-lg font-bold text-gray-200">Active Users</h2></div>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-900/80 sticky top-0 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800 backdrop-blur-sm z-10">
                                        <th className="px-6 py-3 font-medium">Username</th><th className="px-6 py-3 font-medium">Role</th><th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {users.map(u => (
                                        <tr key={u._id} className="hover:bg-gray-800/40">
                                            <td className="px-6 py-3 font-mono text-sm text-gray-300">{u.username}</td>
                                            <td className="px-6 py-3"><RoleBadge role={u.role} /></td>
                                            <td className="px-6 py-3 text-right">
                                                {u.role !== 'ADMIN' && <button onClick={() => handleDelete(u.username)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={16} /></button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* System Logger (Terminal Style) */}
                    <div className="bg-gray-900 rounded-xl shadow border border-gray-800 overflow-hidden flex flex-col h-[500px]">
                        <div className="px-6 py-3 bg-black border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-sm font-mono font-bold text-green-400">~/system/event_logs.sh</h2>
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto font-mono text-xs text-gray-300 space-y-2 flex-1">
                            {logs.length === 0 ? <p className="text-gray-600">Waiting for events...</p> : 
                                logs.map((log, i) => (
                                    <div key={i} className="flex gap-3 hover:bg-gray-800 p-1 rounded transition-colors">
                                        <span className="text-gray-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className="text-blue-400 font-bold shrink-0">{log.username}</span>
                                        <span className="text-gray-100 break-words">{log.action}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

const RoleBadge = ({ role }) => {
    const styles = { ADMIN: "bg-gray-800 border border-gray-700 text-gray-100", AUDITOR: "bg-purple-500/20 border border-purple-500/30 text-purple-400", SME: "bg-blue-500/20 border border-blue-500/30 text-blue-400" };
    return <span className={`px-2 py-1 rounded text-xs font-bold ${styles[role] || "bg-gray-800 text-gray-300 border-gray-700"}`}>{role}</span>;
};

export default AdminPortal;