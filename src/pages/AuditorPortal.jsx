import React, { useState, useEffect, useMemo, memo } from 'react';
import api from '../api/axios';
import CommentsModal from '../components/CommentsModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DocumentViewerModal from '../components/DocumentViewerModal';
import io from 'socket.io-client';
import { ShieldCheck, Search, Eye, Link as LinkIcon, MessageSquare, Check, X, Lock, Server, Upload, ArrowRight, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const AuditorPortal = () => {
    const [allAudits, setAllAudits] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [chatReportId, setChatReportId] = useState(null);
    const [userName] = useState((localStorage.getItem('role') === 'AUDITOR' ? ('Auditor') : ('Gov. Auditor')) || 'Auditor');
    const [viewDocumentId, setViewDocumentId] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterDept, setFilterDept] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const userRole = localStorage.getItem('role');

    // --- FETCH DATA ---
    const fetchAllAudits = async () => {
        setIsFetching(true);
        try {
            const response = await api.get('/audits');
            setAllAudits(response.data);
        } catch (error) {
            console.error("Error fetching audits", error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchAllAudits();
    }, []);

    useEffect(() => {
        // Connect to the backend socket server
        const socket = io(import.meta.env.VITE_SOCKET_URL);

        // Listen for the 'audit_updated' event
        socket.on('audit_updated', (data) => {
            console.log("WebSocket Update Received:", data.message);

            // 1. Instantly fetch the newest data
            fetchAllAudits();

            // 2. Show a cool notification popup
            setToastMessage(data.message);

            // 3. Hide the notification after 4 seconds
            setTimeout(() => {
                setToastMessage(null);
            }, 4000);
        });

        // Cleanup connection when user leaves the page
        return () => socket.disconnect();
    }, []);

    const downloadReport = async (id, companyId, period) => {
        try {
            const response = await api.get(`/audit/${id}/download`, {
                responseType: 'blob'
            });
            const cleanPeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `${companyId}_${cleanPeriod}.xlsx`;
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            alert("Download Failed: File might not exist.");
        }
    };

    const updateStatus = async (id, newStatus) => {
        setIsLoading(true);
        try {
            await api.put(`/audit/${id}/status`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            await fetchAllAudits();
        } catch (error) {
            toast.error("Update failed");
        }
        setIsLoading(false);
    };

    const viewHistory = async (id) => {
        try {
            const response = await api.get(`/audit/${id}/history`);
            setHistory(response.data);
            setSelectedReportId(id);
        } catch (error) {
            toast.error("Could not fetch history");
        }
    };

    const filteredAudits = useMemo(() => {
        return allAudits.filter(audit => {
            const statusMatch = filterStatus === 'ALL' || audit.status === filterStatus;
            const deptMatch = filterDept === 'ALL' || audit.department === filterDept;
            const searchLower = searchQuery.toLowerCase();
            const searchMatch = audit.companyId.toLowerCase().includes(searchLower) ||
                audit.id.toLowerCase().includes(searchLower);

            return statusMatch && deptMatch && searchMatch;
        });
    }, [allAudits, filterStatus, filterDept, searchQuery]);

    const { total, approved, rejected, passed_step_1, pending } = useMemo(() => {
        const total = allAudits.length;
        const approved = allAudits.filter(a => a.status === 'APPROVED').length;
        const rejected = allAudits.filter(a => a.status === 'REJECTED').length;
        const passed_step_1 = allAudits.filter(a => a.status === 'PASSED_STEP_1').length;
        const pending = total - approved - rejected - passed_step_1;
        return { total, approved, rejected, passed_step_1, pending };
    }, [allAudits]);

    const deptChartData = useMemo(() => {
        const deptDataMap = allAudits.reduce((acc, audit) => {
            acc[audit.department] = (acc[audit.department] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(deptDataMap).map(key => ({ name: key, count: deptDataMap[key] }));
    }, [allAudits]);

    const statusChartData = useMemo(() => {
        return [
            { name: 'Pending', value: pending, color: '#F59E0B' },
            { name: 'Passed Step 1', value: passed_step_1, color: '#3B82F6' },
            { name: 'Approved', value: approved, color: '#10B981' },
            { name: 'Rejected', value: rejected, color: '#EF4444' }
        ].filter(item => item.value > 0);
    }, [pending, passed_step_1, approved, rejected]);

    const getStepDetails = (status) => {
        switch (status) {
            case 'PENDING': return { title: 'Document Submitted', org: 'SME (Org1)', icon: <Upload size={16} className="text-yellow-400" />, color: 'bg-yellow-500/20', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
            case 'PASSED_STEP_1': return { title: 'Initial Review Passed', org: 'Auditor A (Org2)', icon: <ArrowRight size={16} className="text-blue-400" />, color: 'bg-blue-500/20', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
            case 'APPROVED': return { title: 'Final Approval', org: 'Auditor B (Org3)', icon: <Check size={16} className="text-green-400" />, color: 'bg-green-500/20', bg: 'bg-green-500/10', border: 'border-green-500/20' };
            case 'REJECTED': return { title: 'Document Rejected', org: 'Auditing Body', icon: <X size={16} className="text-red-400" />, color: 'bg-red-500/20', bg: 'bg-red-500/10', border: 'border-red-500/20' };
            default: return { title: 'Unknown Action', org: 'System', icon: <Settings size={16} className="text-gray-400" />, color: 'bg-gray-500/20', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
        }
    };

    return (
        <div className="min-h-screen font-sans pb-12">

            {/* 1. TOP NAVIGATION BAR */}
            <nav className="glass-nav">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <ShieldCheck className="text-indigo-400 mr-2" size={28} />
                            <h1 className="text-xl font-bold text-gray-100">AuditControl <span className="text-indigo-400">Pro</span></h1>
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

                {/* 2. STATS DASHBOARD */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    {isFetching ? (
                        <>
                            {/* Show 5 dummy cards while loading */}
                            {[1, 2, 3, 4, 5].map(n => <StatCardSkeleton key={n} />)}
                        </>
                    ) : (
                        <>
                            {/* Show Real Data */}
                            <StatCard title="Total Reports" value={total} color="bg-indigo-600/20" textColor="text-indigo-400" border="border border-indigo-500/30" />
                            <StatCard title="Pending Review" value={pending} color="glass-card" textColor="text-orange-400" border="border-l-4 border-orange-500/50" />
                            <StatCard title="Passed Step 1" value={passed_step_1} color="glass-card" textColor="text-blue-400" border="border-l-4 border-blue-500/50" />
                            <StatCard title="Approved" value={approved} color="glass-card" textColor="text-green-400" border="border-l-4 border-green-500/50" />
                            <StatCard title="Rejected" value={rejected} color="glass-card" textColor="text-red-400" border="border-l-4 border-red-500/50" />
                        </>
                    )}
                </div>

                {/* 3. CHARTS SECTION (NEW) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Department Bar Chart */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <h3 className="text-sm font-bold text-gray-300 uppercase mb-4">Submission Volume by Department</h3>
                        <div className="h-64 min-h-[250px]">
                            {deptChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={250}>
                                    <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                                        <RechartsTooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }} itemStyle={{ color: '#e5e7eb' }} />
                                        <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Status Donut Chart */}
                    <div className="glass-card p-6 flex flex-col">
                        <h3 className="text-sm font-bold text-gray-300 uppercase mb-4">Current Pipeline Health</h3>
                        <div className="h-64 min-h-[250px] flex-grow">
                            {statusChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={250}>
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={0}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }} itemStyle={{ color: '#e5e7eb' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. FILTER BAR */}
                <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Company or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 placeholder-gray-500"
                            />
                        </div>

                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="px-4 py-2 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="ALL">All Departments</option>
                            <option value="Finance">Finance</option>
                            <option value="Sales">Sales</option>
                            <option value="Inventory">Inventory</option>
                            <option value="HR">HR & Payroll</option>
                            <option value="Tax">Tax</option>
                        </select>
                    </div>

                    <div className="flex bg-gray-900/50 border border-gray-800 p-1 rounded-lg">
                        {['ALL', 'PENDING', 'PASSED_STEP_1', 'APPROVED', 'REJECTED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === status
                                    ? 'bg-gray-800 text-gray-100 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 5. MAIN DATA TABLE */}
                {/* 5. MAIN DATA TABLE */}
                <div className="glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-200">Audit Queue</h2>
                        <span className="text-xs text-gray-500">
                            Showing {filteredAudits.length} of {allAudits.length} records
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/80 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium">Report ID</th>
                                    <th className="px-6 py-3 font-medium">Company</th>
                                    <th className="px-6 py-3 font-medium">Dept</th>
                                    <th className="px-6 py-3 font-medium">Period</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {isFetching ? (
                                    // Show 4 dummy rows while loading
                                    [1, 2, 3, 4].map(n => <TableRowSkeleton key={n} />)
                                ) : filteredAudits.length > 0 ? (
                                    // Show Real Rows
                                    filteredAudits.map((audit) => (
                                        <tr key={audit.id} className="hover:bg-gray-800/40 transition-colors duration-150">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{audit.id}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-200">{audit.companyId}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                                                    {audit.department}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-blue-600 font-medium">{audit.auditPeriod}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={audit.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <ActionButton onClick={() => setViewDocumentId(audit.id)} icon={<Eye size={16} />} title="View Document" />
                                                <ActionButton onClick={() => viewHistory(audit.id)} icon={<LinkIcon size={16} />} title="Blockchain Explorer" />
                                                <ActionButton onClick={() => setChatReportId(audit.id)} icon={<MessageSquare size={16} />} title="Discuss" />

                                                {/* LOGIC FOR AUDITOR A (ORG 2) */}
                                                {userRole === 'AUDITOR' && audit.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(audit.id, 'PASSED_STEP_1')}
                                                            className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-all"
                                                            title="Pass Initial Review"
                                                        >
                                                            <ArrowRight size={14} className="mr-1 inline" /> Pass Step 1
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(audit.id, 'REJECTED')}
                                                            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-all inline-flex items-center justify-center"
                                                            title="Reject"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                )}

                                                {/* LOGIC FOR AUDITOR B (ORG 3) */}
                                                {userRole === 'GOV_AUDITOR' && audit.status === 'PASSED_STEP_1' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(audit.id, 'APPROVED')}
                                                            className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-all"
                                                            title="Finalize & Approve"
                                                        >
                                                            <Check size={14} className="mr-1 inline" /> Finalize
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(audit.id, 'REJECTED')}
                                                            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-all inline-flex items-center justify-center"
                                                            title="Reject Final"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                )}

                                                {/* SHOW LOCK ICON IF NOT YOUR TURN */}
                                                {((userRole === 'AUDITOR' && audit.status !== 'PENDING') ||
                                                    (userRole === 'GOV_AUDITOR' && audit.status !== 'PASSED_STEP_1')) && (
                                                        <span className="text-gray-300 text-xs cursor-not-allowed inline-flex items-center justify-center" title="Action not available at this stage"><Lock size={12} className="mr-1 inline" /> Locked</span>
                                                    )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    // Show Empty State only if done fetching and no results
                                    <tr>
                                        <td colSpan="6" className="text-center py-10 text-gray-400">
                                            No records match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* 6. VISUAL BLOCKCHAIN EXPLORER MODAL */}
            {selectedReportId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-2xl max-h-[85vh] flex flex-col animate-fadeIn overflow-hidden">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-gray-800 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <LinkIcon size={20} className="text-blue-400" /> Ledger Explorer
                                </h3>
                                <p className="text-xs text-gray-400 font-mono mt-1 tracking-wider">ASSET: {selectedReportId}</p>
                            </div>
                            <button onClick={() => setSelectedReportId(null)} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
                        </div>

                        {/* Timeline Body */}
                        <div className="p-8 overflow-y-auto bg-gray-900/50 flex-grow">
                            <div className="relative border-l-2 border-gray-800 ml-4 space-y-8">
                                {history.map((entry, index) => {
                                    const date = new Date(entry.timestamp);
                                    const step = getStepDetails(entry.record.status);
                                    const isLast = index === history.length - 1;

                                    return (
                                        <div key={index} className="relative pl-8">
                                            {/* Node / Icon */}
                                            <span className={`absolute -left-[17px] top-1 flex items-center justify-center w-8 h-8 rounded-full ring-4 ring-gray-50 ${step.color} text-white text-xs shadow-md z-10`}>
                                                {step.icon}
                                            </span>

                                            {/* Connecting Line (Hide for last item) */}
                                            {!isLast && <div className="absolute left-[-1px] top-8 w-0.5 h-full bg-gray-200 -z-10"></div>}

                                            {/* Content Card */}
                                            <div className={`p-5 rounded-xl border ${step.border} ${step.bg} shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-gray-100 text-lg leading-tight">{step.title}</h4>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">{step.org}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[11px] font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-700">
                                                            {date.toLocaleDateString()}
                                                        </span>
                                                        <span className="block text-[10px] text-gray-400 mt-1">
                                                            {date.toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Cryptographic Proof Section */}
                                                <div className="mt-4 pt-3 border-t border-gray-300 border-opacity-40">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1">
                                                            <Server size={12} className="text-gray-400" /> Transaction Hash
                                                        </span>
                                                        <code className="text-[11px] font-mono bg-gray-950 text-indigo-300 px-3 py-2 rounded shadow-inner border border-gray-800 break-all">
                                                            {entry.txId}
                                                        </code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900 flex justify-center">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Lock size={12} className="text-green-500" /> Cryptographically secured by Hyperledger Fabric
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {chatReportId && (
                <CommentsModal
                    reportId={chatReportId}
                    onClose={() => setChatReportId(null)}
                    currentUserRole={userRole}
                />
            )}

            {viewDocumentId && (
                <DocumentViewerModal
                    reportId={viewDocumentId}
                    onClose={() => setViewDocumentId(null)}
                />
            )}


        </div>
    );
};

// --- SUB-COMPONENTS ---

const StatCard = memo(({ title, value, color, textColor, border = '' }) => (
    <div className={`${color} ${border} rounded-xl shadow-sm p-6 flex flex-col items-start transition-transform hover:scale-105`}>
        <h3 className={`text-xs uppercase tracking-wide font-semibold opacity-80 mb-1 ${textColor === 'text-white' ? 'text-blue-100' : 'text-gray-500'}`}>{title}</h3>
        <span className={`text-3xl font-bold ${textColor}`}>{value}</span>
    </div>
));

const StatusBadge = memo(({ status }) => {
    const styles = {
        APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
        PASSED_STEP_1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
        PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    };
    const defaultStyle = "bg-gray-800 text-gray-300 border-gray-700";

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || defaultStyle}`}>
            {status}
        </span>
    );
});

const ActionButton = memo(({ onClick, icon, title }) => (
    <button
        onClick={onClick}
        className="p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100 rounded-lg transition-colors"
        title={title}
    >
        <span className="text-lg">{icon}</span>
    </button>
));

const TableRowSkeleton = memo(() => (
    <tr className="animate-pulse border-b border-gray-800">
        <td className="px-6 py-5"><div className="h-4 w-24 bg-gray-800 rounded"></div></td>
        <td className="px-6 py-5"><div className="h-4 w-32 bg-gray-800 rounded"></div></td>
        <td className="px-6 py-5"><div className="h-5 w-16 bg-gray-800 rounded-full"></div></td>
        <td className="px-6 py-5"><div className="h-4 w-12 bg-gray-800 rounded"></div></td>
        <td className="px-6 py-5"><div className="h-6 w-24 bg-gray-800 rounded-full"></div></td>
        <td className="px-6 py-5 text-right flex justify-end gap-2">
            <div className="h-8 w-8 bg-gray-800 rounded-lg"></div>
            <div className="h-8 w-8 bg-gray-800 rounded-lg"></div>
            <div className="h-8 w-24 bg-gray-800 rounded-full"></div>
        </td>
    </tr>
));

const StatCardSkeleton = memo(() => (
    <div className="glass-card p-6 flex flex-col items-start animate-pulse">
        <div className="h-3 w-24 bg-gray-800 rounded mb-4"></div>
        <div className="h-8 w-12 bg-gray-800 rounded"></div>
    </div>
));

export default AuditorPortal;