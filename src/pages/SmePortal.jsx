import React, { useState, useEffect, memo, useCallback } from 'react';
import api from '../api/axios';
import CryptoJS from 'crypto-js';
import CommentsModal from '../components/CommentsModal';
import { Building, Upload, FileText, MessageSquare, Lock, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';

const SmePortal = () => {
    const [department, setDepartment] = useState('Finance');
    const [period, setPeriod] = useState('');
    const [fileHash, setFileHash] = useState('');
    const [submitStatus, setSubmitStatus] = useState(null);
    const [fileName, setFileName] = useState('');
    const [myAudits, setMyAudits] = useState([]);
    const [companyId] = useState(localStorage.getItem('companyId') || '');
    const [userName] = useState(localStorage.getItem('name') || 'User');
    const [uploadFile, setUploadFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- HANDLERS ---
    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setFileName(file.name);
            setUploadFile(file);
            const reader = new FileReader();
            reader.onload = (evt) => {
                const arrayBuffer = evt.target.result;
                const wordBuffer = CryptoJS.lib.WordArray.create(arrayBuffer);
                const hash = CryptoJS.SHA256(wordBuffer).toString();
                setFileHash(hash);
            };
            reader.readAsArrayBuffer(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });
    const [chatReportId, setChatReportId] = useState(null);

    const getWeekPeriod = () => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const pastDaysOfYear = (now - startOfYear) / 86400000;
        
        const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const year = now.getFullYear();

        return `Week ${weekNumber}, ${year}`;
    };

    useEffect(() => {
        setPeriod(getWeekPeriod());
    }, []);

    const handleSubmit = async () => {
        if (!companyId || !period || !fileHash || !uploadFile) return toast.error("Please fill all fields and select a file");

        setIsSubmitting(true);
        const reportId = `REP_${Date.now()}`;

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('reportId', reportId);
        formData.append('companyId', companyId);
        formData.append('department', department);
        formData.append('reportHash', fileHash);
        formData.append('period', period);

        try {
            setSubmitStatus("Submitting to Blockchain...");
            const response = await api.post('/audit', formData);
            toast.success(`Report ID: ${response.data.id} submitted!`);
            setSubmitStatus(`Success`);
            setFileName('');
            setFileHash('');
            setUploadFile(null);
            fetchMyAudits();
        } catch (error) {
            console.error(error);
            toast.error("Error submitting transaction.");
            setSubmitStatus(null);
        }
        setIsSubmitting(false);
    };

    const handleResubmit = async (auditId, e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Calculate new hash
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const arrayBuffer = evt.target.result;
            const wordBuffer = CryptoJS.lib.WordArray.create(arrayBuffer);
            const newHash = CryptoJS.SHA256(wordBuffer).toString();

            // 2. Prepare Form Data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('reportHash', newHash);

            try {
                // 3. Send to backend
                await api.put(`/audit/${auditId}/resubmit`, formData);
                toast.success("Report Resubmitted Successfully!");
                fetchMyAudits(); // Refresh table
            } catch (err) {
                toast.error("Error resubmitting report.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const fetchMyAudits = async () => {
        try {
            const res = await api.get('/audits');
            setMyAudits(res.data);
        } catch (err) {
            console.error("Error fetching audits");
        }
    };

    useEffect(() => {
        fetchMyAudits();
    }, []);

    return (
        <div className="min-h-screen font-sans">

            {/* 1. TOP NAVIGATION */}
            <nav className="glass-nav">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Building className="text-indigo-400" size={28} />
                            <div>
                                <h1 className="text-lg font-bold text-gray-100 leading-tight">SME Portal</h1>
                                <p className="text-xs text-indigo-400 font-medium">{companyId || 'Company ID Not Assigned'}</p>
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
                        <div className="glass-card overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-indigo-800 border-b border-indigo-700/50">
                                <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                                    <Upload size={18} className="text-indigo-400" /> Submit Report
                                </h2>
                                <p className="text-blue-100 text-xs mt-1">Upload financial records for audit</p>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Company ID (Locked) */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Company ID</label>
                                    <div className="relative">
                                        <input
                                            value={companyId}
                                            readOnly
                                            className="w-full bg-gray-800/50 text-gray-400 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none cursor-not-allowed font-mono"
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-500 flex items-center"><Lock size={12} className="mr-1" /> Locked</span>
                                    </div>
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Department</label>
                                    <select
                                        value={department}
                                        onChange={e => setDepartment(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
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
                                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Audit Period</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Week 20, 2026"
                                        value={period}
                                        onChange={e => setPeriod(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-gray-500"
                                    />
                                </div>

                                {/* File Upload Area */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Evidence File</label>
                                    <div {...getRootProps()} className={`relative border-2 border-dashed rounded-lg p-6 transition-colors text-center cursor-pointer group ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:bg-gray-800/50'}`}>
                                        <input {...getInputProps()} />
                                        <div className="flex flex-col items-center">
                                            <FileText className={`w-10 h-10 mb-2 transition-transform ${isDragActive ? 'text-indigo-400 scale-110' : 'text-gray-500 group-hover:scale-110 group-hover:text-indigo-300'}`} />
                                            <span className="text-sm font-medium text-gray-300">
                                                {fileName || (isDragActive ? "Drop file here" : "Click or Drag file here")}
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">supports .xlsx, .pdf, .docx</span>
                                        </div>
                                    </div>
                                    {/* Hash Preview */}
                                    {fileHash && (
                                        <div className="mt-2 bg-indigo-500/10 p-2 rounded border border-indigo-500/20 flex items-start gap-2">
                                            <span className="text-xs font-bold text-indigo-400 mt-0.5">SHA256:</span>
                                            <code className="text-[10px] text-indigo-200 break-all leading-tight">{fileHash}</code>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !companyId}
                                    className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition-all flex justify-center items-center gap-2
                                        ${isSubmitting ? 'bg-gray-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20 active:scale-95'}
                                    `}
                                >
                                    {isSubmitting ? 'Processing...' : 'Submit Securely'}
                                </button>

                                {/* Feedback Message */}
                                {submitStatus && (
                                    <div className={`text-sm p-3 rounded-lg border ${submitStatus.includes('Success') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                        {submitStatus}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. HISTORY TABLE (Right Side) */}
                    <div className="lg:col-span-2">
                        <div className="glass-card overflow-hidden h-full flex flex-col">
                            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                                <h2 className="text-lg font-bold text-gray-200">Submission History</h2>
                                <span className="bg-gray-800 text-gray-400 border border-gray-700 text-xs px-2 py-1 rounded-full">{myAudits.length} Records</span>
                            </div>

                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/80 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-3 font-medium">Report ID</th>
                                            <th className="px-6 py-3 font-medium">Period</th>
                                            <th className="px-6 py-3 font-medium">Dept</th>
                                            <th className="px-6 py-3 font-medium">Date</th>
                                            <th className="px-6 py-3 font-medium text-right">Status</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {myAudits.map((audit) => (
                                            <tr key={audit.id} className="hover:bg-gray-800/40 transition-colors">
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{audit.id}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-200">{audit.auditPeriod}</td>
                                                <td className="px-6 py-4 text-sm text-gray-400">{audit.department}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(audit.submissionDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right flex flex-col items-end gap-2">
                                                    <StatusBadge status={audit.status} />
                                                    {audit.status === 'REJECTED' && (
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                id={`resubmit-${audit.id}`}
                                                                className="hidden"
                                                                onChange={(e) => handleResubmit(audit.id, e)}
                                                            />
                                                            <label
                                                                htmlFor={`resubmit-${audit.id}`}
                                                                className="text-xs bg-gray-800 text-white px-3 py-1 rounded cursor-pointer hover:bg-black transition-colors"
                                                            >
                                                                Fix & Resubmit
                                                            </label>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <ActionButton
                                                        onClick={() => setChatReportId(audit.id)}
                                                        icon={<MessageSquare size={16} />} title="Discuss"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {myAudits.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                        <FolderOpen size={40} className="mb-2 opacity-30" />
                                        <p>No submission history found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            {chatReportId && (
                <CommentsModal
                    reportId={chatReportId}
                    onClose={() => setChatReportId(null)}
                    currentUserRole="SME"
                />
            )}
        </div>
    );
};

// --- SUB-COMPONENT ---
const StatusBadge = memo(({ status }) => {
    const styles = {
        APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
        REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
        PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-800 text-gray-300 border-gray-700"}`}>
            {status}
        </span>
    );
});

const ActionButton = memo(({ onClick, icon, title }) => (
    <button
        onClick={onClick}
        className="p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100 rounded-lg transition-colors flex items-center justify-center"
        title={title}
    >
        {icon}
    </button>
));

export default SmePortal;