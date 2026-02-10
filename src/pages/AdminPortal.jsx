import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPortal = () => {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        username: '', password: '', role: 'SME', name: '', companyId: ''
    });
    const [message, setMessage] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false); // To toggle the "Add User" form

    // --- AUTH HELPER ---
    const getAuthHeader = () => {
        return { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    };

    // --- FETCH USERS ---
    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:4000/api/users', getAuthHeader());
            setUsers(res.data);
        } catch (err) {
            console.error("Fetch users failed");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- HANDLERS ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await axios.post('http://localhost:4000/api/users', formData, getAuthHeader());
            setMessage('✅ User Created Successfully!');
            setFormData({ username: '', password: '', role: 'SME', name: '', companyId: '' });
            fetchUsers(); // Refresh list
            setTimeout(() => setIsFormOpen(false), 1500); // Close form after success
        } catch (error) {
            setMessage('❌ Error: ' + (error.response?.data?.error || "Failed"));
        }
    };

    const handleDelete = async (username) => {
        if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
            try {
                await axios.delete(`http://localhost:4000/api/users/${username}`, getAuthHeader());
                fetchUsers();
            } catch (error) {
                alert("Delete failed");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            
            {/* 1. TOP NAVIGATION */}
            <nav className="bg-gray-900 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl mr-2">🛡️</span>
                            <h1 className="text-xl font-bold text-white tracking-wider">System<span className="text-blue-400">Admin</span></h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-400 text-sm hidden md:inline">Logged in as Administrator</span>
                            <button 
                                onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* 2. HEADER & ACTIONS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                        <p className="text-gray-500 text-sm">Manage access for SMEs, Auditors, and Administrators.</p>
                    </div>
                    <button 
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <span>{isFormOpen ? '✖ Close Form' : '➕ Add New User'}</span>
                    </button>
                </div>

                {/* 3. ADD USER FORM (Collapsible) */}
                {isFormOpen && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Create New Account</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input name="username" value={formData.username} onChange={handleChange} required 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. sales_dept" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input name="password" type="password" value={formData.password} onChange={handleChange} required 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input name="name" value={formData.name} onChange={handleChange} required 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="SME">SME (Client)</option>
                                    <option value="AUDITOR">Auditor</option>
                                    <option value="ADMIN">Administrator</option>
                                </select>
                            </div>

                            {/* Conditional Company ID */}
                            {formData.role === 'SME' && (
                                <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <label className="block text-sm font-bold text-blue-800 mb-1">Assign Company ID</label>
                                    <input name="companyId" value={formData.companyId} onChange={handleChange} required 
                                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. COMP_001" />
                                    <p className="text-xs text-blue-600 mt-1">⚠️ This ID will be locked to the user's account for security.</p>
                                </div>
                            )}

                            <div className="md:col-span-2 flex items-center justify-end gap-4 mt-2">
                                {message && <span className={`text-sm font-semibold ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</span>}
                                <button type="submit" className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg transition-colors">
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 4. USER LIST TABLE */}
                <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-3 font-medium">Username</th>
                                <th className="px-6 py-3 font-medium">Full Name</th>
                                <th className="px-6 py-3 font-medium">Role</th>
                                <th className="px-6 py-3 font-medium">Company ID</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{u.username}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                                    <td className="px-6 py-4">
                                        <RoleBadge role={u.role} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{u.companyId || <span className="text-gray-300">-</span>}</td>
                                    <td className="px-6 py-4 text-right">
                                        {u.role !== 'ADMIN' && (
                                            <button 
                                                onClick={() => handleDelete(u.username)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && <div className="p-8 text-center text-gray-400">No users found.</div>}
                </div>
            </main>
        </div>
    );
};

// --- SUB-COMPONENT: ROLE BADGE ---
const RoleBadge = ({ role }) => {
    const styles = {
        ADMIN: "bg-gray-800 text-white",
        AUDITOR: "bg-purple-100 text-purple-700 border border-purple-200",
        SME: "bg-blue-100 text-blue-700 border border-blue-200"
    };
    return (
        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${styles[role] || "bg-gray-100 text-gray-600"}`}>
            {role}
        </span>
    );
};

export default AdminPortal;