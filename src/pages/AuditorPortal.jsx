import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommentsModal from '../components/CommentsModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DocumentViewerModal from '../components/DocumentViewerModal';
import io from 'socket.io-client';

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

    // --- AUTH HELPER ---
    const getAuthHeader = () => {
        return { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    };

    // --- FETCH DATA ---
    const fetchAllAudits = async () => {
        setIsFetching(true);
        try {
            const response = await axios.get('http://localhost:4000/api/audits', getAuthHeader());
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
        const socket = io('http://localhost:4000');

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
            const response = await axios.get(`http://localhost:4000/api/audit/${id}/download`, {
                ...getAuthHeader(),
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
            await axios.put(`http://localhost:4000/api/audit/${id}/status`, { status: newStatus }, getAuthHeader());
            await fetchAllAudits();
        } catch (error) {
            alert("Update failed");
        }
        setIsLoading(false);
    };

    const viewHistory = async (id) => {
        try {
            const response = await axios.get(`http://localhost:4000/api/audit/${id}/history`, getAuthHeader());
            setHistory(response.data);
            setSelectedReportId(id);
        } catch (error) {
            alert("Could not fetch history");
        }
    };

    const filteredAudits = allAudits.filter(audit => {
        const statusMatch = filterStatus === 'ALL' || audit.status === filterStatus;
        const deptMatch = filterDept === 'ALL' || audit.department === filterDept;
        const searchLower = searchQuery.toLowerCase();
        const searchMatch = audit.companyId.toLowerCase().includes(searchLower) ||
            audit.id.toLowerCase().includes(searchLower);

        return statusMatch && deptMatch && searchMatch;
    });

    const total = allAudits.length;
    const approved = allAudits.filter(a => a.status === 'APPROVED').length;
    const rejected = allAudits.filter(a => a.status === 'REJECTED').length;
    const passed_step_1 = allAudits.filter(a => a.status === 'PASSED_STEP_1').length;
    const pending = total - approved - rejected - passed_step_1;

    const deptDataMap = allAudits.reduce((acc, audit) => {
        acc[audit.department] = (acc[audit.department] || 0) + 1;
        return acc;
    }, {});
    const deptChartData = Object.keys(deptDataMap).map(key => ({ name: key, count: deptDataMap[key] }));

    const statusChartData = [
        { name: 'Pending', value: pending, color: '#F59E0B' },
        { name: 'Passed Step 1', value: passed_step_1, color: '#3B82F6' },
        { name: 'Approved', value: approved, color: '#10B981' },
        { name: 'Rejected', value: rejected, color: '#EF4444' }
    ].filter(item => item.value > 0);

    const getStepDetails = (status) => {
        switch (status) {
            case 'PENDING': return { title: 'Document Submitted', org: 'SME (Org1)', icon: '📤', color: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' };
            case 'PASSED_STEP_1': return { title: 'Initial Review Passed', org: 'Auditor A (Org2)', icon: '🔹', color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
            case 'APPROVED': return { title: 'Final Approval', org: 'Auditor B (Org3)', icon: '✅', color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200' };
            case 'REJECTED': return { title: 'Document Rejected', org: 'Auditing Body', icon: '❌', color: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-200' };
            default: return { title: 'Unknown Action', org: 'System', icon: '⚙️', color: 'bg-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">

            {/* 1. TOP NAVIGATION BAR */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl mr-2">👨‍⚖️</span>
                            <h1 className="text-xl font-bold text-gray-800">AuditControl <span className="text-blue-600">Pro</span></h1>
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
                            <StatCard title="Total Reports" value={total} color="bg-blue-600" textColor="text-white" />
                            <StatCard title="Pending Review" value={pending} color="bg-white" textColor="text-orange-600" border="border-l-4 border-orange-500" />
                            <StatCard title="Passed Step 1" value={passed_step_1} color="bg-white" textColor="text-blue-600" border="border-l-4 border-blue-500" />
                            <StatCard title="Approved" value={approved} color="bg-white" textColor="text-green-600" border="border-l-4 border-green-500" />
                            <StatCard title="Rejected" value={rejected} color="bg-white" textColor="text-red-600" border="border-l-4 border-red-500" />
                        </>
                    )}
                </div>

                {/* 3. CHARTS SECTION (NEW) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Department Bar Chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-600 uppercase mb-4">Submission Volume by Department</h3>
                        <div className="h-64">
                            {deptChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                                        <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                        <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Status Donut Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                        <h3 className="text-sm font-bold text-gray-600 uppercase mb-4">Current Pipeline Health</h3>
                        <div className="h-64 flex-grow">
                            {statusChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. FILTER BAR */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Search Company or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                            />
                        </div>

                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                        >
                            <option value="ALL">All Departments</option>
                            <option value="Finance">Finance</option>
                            <option value="Sales">Sales</option>
                            <option value="Inventory">Inventory</option>
                            <option value="HR">HR & Payroll</option>
                            <option value="Tax">Tax</option>
                        </select>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['ALL', 'PENDING', 'PASSED_STEP_1', 'APPROVED', 'REJECTED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === status
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 5. MAIN DATA TABLE */}
                {/* 5. MAIN DATA TABLE */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-700">Audit Queue</h2>
                        <span className="text-xs text-gray-500">
                            Showing {filteredAudits.length} of {allAudits.length} records
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium">Report ID</th>
                                    <th className="px-6 py-3 font-medium">Company</th>
                                    <th className="px-6 py-3 font-medium">Dept</th>
                                    <th className="px-6 py-3 font-medium">Period</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isFetching ? (
                                    // Show 4 dummy rows while loading
                                    [1, 2, 3, 4].map(n => <TableRowSkeleton key={n} />)
                                ) : filteredAudits.length > 0 ? (
                                    // Show Real Rows
                                    filteredAudits.map((audit) => (
                                        <tr key={audit.id} className="hover:bg-blue-50 transition-colors duration-150">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{audit.id}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-800">{audit.companyId}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {audit.department}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-blue-600 font-medium">{audit.auditPeriod}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={audit.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <ActionButton onClick={() => setViewDocumentId(audit.id)} icon="👁️" title="View Document" />
                                                <ActionButton onClick={() => viewHistory(audit.id)} icon="🔗" title="Blockchain Explorer" />
                                                <ActionButton onClick={() => setChatReportId(audit.id)} icon="💬" title="Discuss" />

                                                {/* LOGIC FOR AUDITOR A (ORG 2) */}
                                                {userRole === 'AUDITOR' && audit.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(audit.id, 'PASSED_STEP_1')}
                                                            className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-all"
                                                            title="Pass Initial Review"
                                                        >
                                                            🔹 Pass Step 1
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(audit.id, 'REJECTED')}
                                                            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-all"
                                                            title="Reject"
                                                        >
                                                            ❌
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
                                                            ✅ Finalize
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(audit.id, 'REJECTED')}
                                                            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-all"
                                                            title="Reject Final"
                                                        >
                                                            ❌
                                                        </button>
                                                    </>
                                                )}

                                                {/* SHOW LOCK ICON IF NOT YOUR TURN */}
                                                {((userRole === 'AUDITOR' && audit.status !== 'PENDING') ||
                                                    (userRole === 'GOV_AUDITOR' && audit.status !== 'PASSED_STEP_1')) && (
                                                        <span className="text-gray-300 text-xs cursor-not-allowed" title="Action not available at this stage">🔒 Locked</span>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fadeIn overflow-hidden border border-gray-200">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-gray-800 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span>🔗</span> Ledger Explorer
                                </h3>
                                <p className="text-xs text-gray-400 font-mono mt-1 tracking-wider">ASSET: {selectedReportId}</p>
                            </div>
                            <button onClick={() => setSelectedReportId(null)} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
                        </div>

                        {/* Timeline Body */}
                        <div className="p-8 overflow-y-auto bg-gray-50 flex-grow">
                            <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
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
                                                        <h4 className="font-bold text-gray-800 text-lg leading-tight">{step.title}</h4>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">{step.org}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[11px] font-bold text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
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
                                                            <span>⛓️</span> Transaction Hash
                                                        </span>
                                                        <code className="text-[11px] font-mono bg-white text-gray-700 px-3 py-2 rounded shadow-inner border border-gray-200 break-all">
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
                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-center">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <span>🔒</span> Cryptographically secured by Hyperledger Fabric
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

            {toastMessage && (
                <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideUp z-50 border-l-4 border-blue-500">
                    <span className="text-xl">🔔</span>
                    <div>
                        <h4 className="font-bold text-sm">Live Update</h4>
                        <p className="text-xs text-gray-300">{toastMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, color, textColor, border = '' }) => (
    <div className={`${color} ${border} rounded-xl shadow-sm p-6 flex flex-col items-start transition-transform hover:scale-105`}>
        <h3 className={`text-xs uppercase tracking-wide font-semibold opacity-80 mb-1 ${textColor === 'text-white' ? 'text-blue-100' : 'text-gray-500'}`}>{title}</h3>
        <span className={`text-3xl font-bold ${textColor}`}>{value}</span>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        APPROVED: "bg-green-100 text-green-700 border-green-200",
        PASSED_STEP_1: "bg-blue-100 text-blue-700 border-blue-200",
        REJECTED: "bg-red-100 text-red-700 border-red-200",
        PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200"
    };
    const defaultStyle = "bg-gray-100 text-gray-700 border-gray-200";

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || defaultStyle}`}>
            {status}
        </span>
    );
};

const ActionButton = ({ onClick, icon, title }) => (
    <button
        onClick={onClick}
        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        title={title}
    >
        <span className="text-lg">{icon}</span>
    </button>
);

const TableRowSkeleton = () => (
    <tr className="animate-pulse border-b border-gray-50">
        <td className="px-6 py-5"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
        <td className="px-6 py-5"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
        <td className="px-6 py-5"><div className="h-5 w-16 bg-gray-200 rounded-full"></div></td>
        <td className="px-6 py-5"><div className="h-4 w-12 bg-gray-200 rounded"></div></td>
        <td className="px-6 py-5"><div className="h-6 w-24 bg-gray-200 rounded-full"></div></td>
        <td className="px-6 py-5 text-right flex justify-end gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
        </td>
    </tr>
);

const StatCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col items-start animate-pulse">
        <div className="h-3 w-24 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 w-12 bg-gray-200 rounded"></div>
    </div>
);

export default AuditorPortal;