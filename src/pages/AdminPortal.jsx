import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPortal = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [health, setHealth] = useState(null);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'SME', name: '', companyId: '' });
    const [message, setMessage] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const [usersRes, logsRes, healthRes] = await Promise.all([
                axios.get('http://localhost:4000/api/users', getAuthHeader()),
                axios.get('http://localhost:4000/api/admin/logs', getAuthHeader()),
                axios.get('http://localhost:4000/api/admin/health', getAuthHeader())
            ]);
            setUsers(usersRes.data);
            setLogs(logsRes.data);
            setHealth(healthRes.data);
        } catch (err) {
            console.error("Fetch failed");
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh logs & health every 10 seconds
        const interval = setInterval(fetchData, 10000); 
        return () => clearInterval(interval);
    }, []);

    // --- HANDLERS ---
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await axios.post('http://localhost:4000/api/users', formData, getAuthHeader());
            setMessage('✅ User Created Successfully!');
            setFormData({ username: '', password: '', role: 'SME', name: '', companyId: '' });
            fetchData();
            setTimeout(() => setIsFormOpen(false), 1500);
        } catch (error) {
            setMessage('❌ Error: ' + (error.response?.data?.error || "Failed"));
        }
    };

    const handleDelete = async (username) => {
        if (window.confirm(`Delete user ${username}?`)) {
            try {
                await axios.delete(`http://localhost:4000/api/users/${username}`, getAuthHeader());
                fetchData();
            } catch (error) { alert("Delete failed"); }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
            
            {/* NAVIGATION */}
            <nav className="bg-gray-900 shadow-lg sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl mr-2">🛡️</span>
                            <h1 className="text-xl font-bold text-white tracking-wider">System<span className="text-blue-400">Admin</span></h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* TOP ROW: HEALTH & ACTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Network Health Card */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">🌐 Network Health</h2>
                        {health ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {health.nodes.map((node, i) => (
                                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                        <div className="text-2xl mb-2">{node.status.includes('🟢') ? '🖥️' : '⚠️'}</div>
                                        <div className="text-xs font-bold text-gray-600 uppercase">{node.type}</div>
                                        <div className="text-[10px] font-mono text-gray-400 truncate mt-1" title={node.name}>{node.name}</div>
                                        <div className="text-xs mt-2 font-semibold">{node.status}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div></div>
                        )}
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white rounded-xl shadow border border-gray-200 p-6 flex flex-col justify-center items-center text-center">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">User Management</h2>
                        <p className="text-sm text-gray-500 mb-6">Manage system access and permissions.</p>
                        <button onClick={() => setIsFormOpen(!isFormOpen)} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg shadow-md font-bold transition-all">
                            {isFormOpen ? '✖ Close Form' : '➕ Add New User'}
                        </button>
                    </div>
                </div>

                {/* ADD USER FORM (Collapsible) */}
                {isFormOpen && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Create New Account</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input name="username" value={formData.username} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input name="password" type="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="SME">SME (Client)</option><option value="AUDITOR">Auditor</option><option value="GOV_AUDITOR">Gov. Auditor</option><option value="ADMIN">Administrator</option>
                                </select>
                            </div>
                            {formData.role === 'SME' && (
                                <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <label className="block text-sm font-bold text-blue-800 mb-1">Assign Company ID</label>
                                    <input name="companyId" value={formData.companyId} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. COMP_001" />
                                </div>
                            )}
                            <div className="md:col-span-2 flex items-center justify-end gap-4 mt-2">
                                {message && <span className={`text-sm font-semibold ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</span>}
                                <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded-lg">Create User</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* BOTTOM ROW: USERS & LOGS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* User List Table */}
                    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200"><h2 className="text-lg font-bold text-gray-700">Active Users</h2></div>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white sticky top-0 shadow-sm text-gray-500 text-xs uppercase tracking-wider border-b">
                                        <th className="px-6 py-3 font-medium">Username</th><th className="px-6 py-3 font-medium">Role</th><th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-mono text-sm">{u.username}</td>
                                            <td className="px-6 py-3"><RoleBadge role={u.role} /></td>
                                            <td className="px-6 py-3 text-right">
                                                {u.role !== 'ADMIN' && <button onClick={() => handleDelete(u.username)} className="text-red-500 text-sm hover:underline">Delete</button>}
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
    const styles = { ADMIN: "bg-gray-800 text-white", AUDITOR: "bg-purple-100 text-purple-700", SME: "bg-blue-100 text-blue-700" };
    return <span className={`px-2 py-1 rounded text-xs font-bold ${styles[role] || "bg-gray-100"}`}>{role}</span>;
};

export default AdminPortal;