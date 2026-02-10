import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const SmePortal = () => {
    const [department, setDepartment] = useState('Finance');
    const [period, setPeriod] = useState('');
    const [fileHash, setFileHash] = useState('');
    const [submitStatus, setSubmitStatus] = useState(null);
    const [fileName, setFileName] = useState('');
    const [myAudits, setMyAudits] = useState([]);
    const [companyId] = useState(localStorage.getItem('companyId') || '');
    const [userName] = useState(localStorage.getItem('name') || 'SME User');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- AUTH HELPER ---
    const getAuthHeader = () => {
        return { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    };

    // --- HANDLERS ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (evt) => {
                const hash = CryptoJS.SHA256(evt.target.result).toString();
                setFileHash(hash);
            };
            reader.readAsBinaryString(file);
        }
    };

    const handleSubmit = async () => {
        if (!companyId || !period || !fileHash) return alert("Please fill all fields");

        setIsSubmitting(true);
        const reportId = `REP_${Date.now()}`;
        const fileInput = document.querySelector('input[type="file"]');
        const file = fileInput.files[0];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('reportId', reportId);
        formData.append('companyId', companyId);
        formData.append('department', department);
        formData.append('reportHash', fileHash);
        formData.append('period', period);

        try {
            setSubmitStatus("Submitting to Blockchain...");
            const response = await axios.post('http://localhost:4000/api/audit', formData, getAuthHeader());
            setSubmitStatus(`✅ Success! Report ID: ${response.data.reportId}`);
            setPeriod('');
            setFileName('');
            setFileHash('');
            fetchMyAudits(); // Refresh table
        } catch (error) {
            console.error(error);
            setSubmitStatus("❌ Error submitting transaction.");
        }
        setIsSubmitting(false);
    };

    const fetchMyAudits = async () => {
        try {
            const res = await axios.get('http://localhost:4000/api/audits', getAuthHeader());
            setMyAudits(res.data);
        } catch (err) {
            console.error("Error fetching audits");
        }
    };

    useEffect(() => {
        fetchMyAudits();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            
            {/* 1. TOP NAVIGATION */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🏢</span>
                            <div>
                                <h1 className="text-lg font-bold text-gray-800 leading-tight">SME Portal</h1>
                                <p className="text-xs text-blue-600 font-medium">{companyId || 'Company ID Not Assigned'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 hidden md:inline">Welcome, {userName}</span>
                            <button 
                                onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* 2. SUBMISSION FORM CARD (Left Side) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>📤</span> Submit Report
                                </h2>
                                <p className="text-blue-100 text-xs mt-1">Upload financial records for audit</p>
                            </div>
                            
                            <div className="p-6 space-y-5">
                                {/* Company ID (Locked) */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Company ID</label>
                                    <div className="relative">
                                        <input 
                                            value={companyId} 
                                            readOnly 
                                            className="w-full bg-gray-100 text-gray-600 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none cursor-not-allowed font-mono"
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">🔒 Locked</span>
                                    </div>
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Department</label>
                                    <select 
                                        value={department} 
                                        onChange={e => setDepartment(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                    >
                                        <option value="Finance">Finance</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Inventory">Inventory / Logistics</option>
                                        <option value="HR">HR & Payroll</option>
                                        <option value="Tax">Tax Compliance</option>
                                    </select>
                                </div>

                                {/* Period */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Audit Period</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Jan-2026" 
                                        value={period}
                                        onChange={e => setPeriod(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>

                                {/* File Upload Area */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Evidence File</label>
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer group">
                                        <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📄</span>
                                            <span className="text-sm font-medium text-gray-600">
                                                {fileName || "Click or Drag file here"}
                                            </span>
                                            <span className="text-xs text-gray-400 mt-1">supports .xlsx, .pdf, .docx</span>
                                        </div>
                                    </div>
                                    {/* Hash Preview */}
                                    {fileHash && (
                                        <div className="mt-2 bg-blue-50 p-2 rounded border border-blue-100 flex items-start gap-2">
                                            <span className="text-xs font-bold text-blue-600 mt-0.5">SHA256:</span>
                                            <code className="text-[10px] text-blue-800 break-all leading-tight">{fileHash}</code>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !companyId}
                                    className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition-all flex justify-center items-center gap-2
                                        ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black hover:shadow-xl active:scale-95'}
                                    `}
                                >
                                    {isSubmitting ? 'Processing...' : 'Submit Securely'}
                                </button>

                                {/* Feedback Message */}
                                {submitStatus && (
                                    <div className={`text-sm p-3 rounded-lg border ${submitStatus.includes('Success') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                        {submitStatus}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. HISTORY TABLE (Right Side) */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-lg font-bold text-gray-700">Submission History</h2>
                                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{myAudits.length} Records</span>
                            </div>

                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-3 font-medium">Report ID</th>
                                            <th className="px-6 py-3 font-medium">Period</th>
                                            <th className="px-6 py-3 font-medium">Dept</th>
                                            <th className="px-6 py-3 font-medium">Date</th>
                                            <th className="px-6 py-3 font-medium text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {myAudits.map((audit) => (
                                            <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{audit.id}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{audit.auditPeriod}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{audit.department}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(audit.submissionDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <StatusBadge status={audit.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {myAudits.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                        <span className="text-4xl mb-2 opacity-30">📁</span>
                                        <p>No submission history found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

// --- SUB-COMPONENT ---
const StatusBadge = ({ status }) => {
    const styles = {
        APPROVED: "bg-green-100 text-green-700 border-green-200",
        REJECTED: "bg-red-100 text-red-700 border-red-200",
        PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200"
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-100 text-gray-600"}`}>
            {status}
        </span>
    );
};

export default SmePortal;