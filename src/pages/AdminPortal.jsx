import React, { useState } from 'react';
import axios from 'axios';

const AdminPortal = () => {
    const [formData, setFormData] = useState({
        username: '', password: '', role: 'SME', name: '', companyId: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:4000/api/users', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('✅ User Created Successfully!');
            setFormData({ username: '', password: '', role: 'SME', name: '', companyId: '' }); // Reset form
        } catch (error) {
            setMessage('❌ Error: ' + (error.response?.data?.error || "Failed"));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-4xl">🛡️</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Admin User Management</h1>
                        <p className="text-blue-100 text-sm">Add new SMEs or Auditors to the system</p>
                    </div>

                    {/* Form Section */}
                    <div className="px-8 py-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username Input */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter username"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                                />
                            </div>

                            {/* Full Name Input */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                                />
                            </div>

                            {/* Role Select */}
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none bg-white"
                                >
                                    <option value="SME">SME (Client)</option>
                                    <option value="AUDITOR">Auditor</option>
                                    <option value="ADMIN">Administrator</option>
                                </select>
                            </div>

                            {/* Company ID - Only show if creating an SME */}
                            {formData.role === 'SME' && (
                                <div className="animate-fadeIn">
                                    <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-2">
                                        Company ID
                                    </label>
                                    <input
                                        id="companyId"
                                        name="companyId"
                                        type="text"
                                        value={formData.companyId}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. SME_02"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                        Unique identifier for the company
                                    </p>
                                </div>
                            )}

                            {/* Success/Error Message */}
                            {message && (
                                <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
                                    message.includes('✅') 
                                        ? 'bg-green-50 border border-green-200 text-green-700' 
                                        : 'bg-red-50 border border-red-200 text-red-700'
                                }`}>
                                    {message.includes('✅') ? (
                                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span className="text-sm font-medium">{message}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                            >
                                Create User
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <p>All user credentials are securely encrypted</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPortal;