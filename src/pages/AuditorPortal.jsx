import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuditorPortal = () => {
    const [allAudits, setAllAudits] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- NEW: FILTER STATE ---
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterDept, setFilterDept] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // --- AUTH HELPER ---
    const getAuthHeader = () => {
        return { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    };

    // --- FETCH DATA ---
    const fetchAllAudits = async () => {
        try {
            const response = await axios.get('http://localhost:4000/api/audits', getAuthHeader());
            setAllAudits(response.data);
        } catch (error) {
            console.error("Error fetching audits", error);
        }
    };

    useEffect(() => {
        fetchAllAudits();
    }, []);

    // --- ACTIONS ---
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
            await fetchAllAudits(); // Refresh data
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

    // --- FILTERING LOGIC ---
    const filteredAudits = allAudits.filter(audit => {
        // 1. Check Status
        const statusMatch = filterStatus === 'ALL' || audit.status === filterStatus;
        // 2. Check Department
        const deptMatch = filterDept === 'ALL' || audit.department === filterDept;
        // 3. Check Search (Company ID or Report ID)
        const searchLower = searchQuery.toLowerCase();
        const searchMatch = audit.companyId.toLowerCase().includes(searchLower) || 
                            audit.id.toLowerCase().includes(searchLower);

        return statusMatch && deptMatch && searchMatch;
    });

    // --- CALCULATE STATS ---
    const total = allAudits.length;
    const approved = allAudits.filter(a => a.status === 'APPROVED').length;
    const rejected = allAudits.filter(a => a.status === 'REJECTED').length;
    const pending = total - approved - rejected;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            
            {/* 1. TOP NAVIGATION BAR */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl mr-2">👨‍⚖️</span>
                            <h1 className="text-xl font-bold text-gray-800">AuditControl <span className="text-blue-600">Pro</span></h1>
                        </div>
                        <div className="flex items-center">
                            <button 
                                onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* 2. STATS DASHBOARD */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Reports" value={total} color="bg-blue-600" textColor="text-white" />
                    <StatCard title="Pending Review" value={pending} color="bg-white" textColor="text-orange-600" border="border-l-4 border-orange-500" />
                    <StatCard title="Approved" value={approved} color="bg-white" textColor="text-green-600" border="border-l-4 border-green-500" />
                    <StatCard title="Rejected" value={rejected} color="bg-white" textColor="text-red-600" border="border-l-4 border-red-500" />
                </div>

                {/* 3. FILTER BAR (NEW) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-4 w-full md:w-auto">
                        {/* Search Input */}
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

                        {/* Department Filter */}
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

                    {/* Status Filter Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    filterStatus === status 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. MAIN DATA TABLE */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
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
                                {filteredAudits.map((audit) => (
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
                                            <ActionButton 
                                                onClick={() => downloadReport(audit.id, audit.companyId, audit.auditPeriod)} 
                                                icon="📥" title="Download" 
                                            />
                                            <ActionButton 
                                                onClick={() => viewHistory(audit.id)} 
                                                icon="📜" title="History" 
                                            />
                                            {/* Action Buttons */}
                                            {isLoading ? (
                                                <span className="text-xs text-gray-400">...</span>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => updateStatus(audit.id, 'APPROVED')} 
                                                        disabled={audit.status === 'APPROVED'}
                                                        className={`p-2 rounded-full transition-all ${audit.status === 'APPROVED' ? 'opacity-20 cursor-not-allowed' : 'hover:bg-green-100 text-green-600'}`}
                                                        title="Approve"
                                                    >
                                                        ✅
                                                    </button>
                                                    <button 
                                                        onClick={() => updateStatus(audit.id, 'REJECTED')} 
                                                        disabled={audit.status === 'REJECTED'}
                                                        className={`p-2 rounded-full transition-all ${audit.status === 'REJECTED' ? 'opacity-20 cursor-not-allowed' : 'hover:bg-red-100 text-red-600'}`}
                                                        title="Reject"
                                                    >
                                                        ❌
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAudits.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                No records match your filters.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* 5. HISTORY MODAL (Popup) */}
            {selectedReportId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-fadeIn">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Audit Timeline</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1">{selectedReportId}</p>
                            </div>
                            <button onClick={() => setSelectedReportId(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <div className="space-y-6">
                                {history.map((entry, index) => {
                                    const date = new Date(entry.timestamp);
                                    const isApproved = entry.record.status === 'APPROVED';
                                    const isRejected = entry.record.status === 'REJECTED';
                                    const colorClass = isApproved ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-orange-400';

                                    return (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${colorClass} ring-4 ring-white`}></div>
                                                {index !== history.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-1"></div>}
                                            </div>
                                            <div className="pb-6">
                                                <p className="text-xs text-gray-400 mb-1">
                                                    {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                                                </p>
                                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                    <p className="text-sm font-semibold text-gray-800">Status: {entry.record.status}</p>
                                                    <div className="mt-1 flex items-center gap-1">
                                                        <span className="text-[10px] uppercase text-gray-400 font-bold">TXID:</span>
                                                        <span className="text-[10px] font-mono bg-white px-1 py-0.5 rounded border text-gray-500 truncate w-32" title={entry.txId}>
                                                            {entry.txId.substring(0, 15)}...
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
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

export default AuditorPortal;