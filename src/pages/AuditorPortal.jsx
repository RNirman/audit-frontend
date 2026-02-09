import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuditorPortal = () => {
    const [allAudits, setAllAudits] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedReportId, setSelectedReportId] = useState(null);

    const total = allAudits.length;
    const approved = allAudits.filter(a => a.status === 'APPROVED').length;
    const rejected = allAudits.filter(a => a.status === 'REJECTED').length;
    const pending = total - approved - rejected;

    const getAuthHeader = () => {
        return { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    };

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

    // UPDATED: Now accepts CompanyID and Period to create a better filename
    const downloadReport = async (id, companyId, period) => {
        try {
            const response = await axios.get(`http://localhost:4000/api/audit/${id}/download`, {
                ...getAuthHeader(),
                responseType: 'blob'
            });

            // Create a clean filename (e.g. "SME_Alpha_Dec-2025.xlsx")
            const cleanPeriod = period.replace(/[^a-zA-Z0-9]/g, '_'); // Remove special chars
            const fileName = `${companyId}_${cleanPeriod}.xlsx`;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); // Browser will use this name
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            alert("Download Failed: File might not exist on server.");
        }
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

    const closeHistory = () => {
        setHistory([]);
        setSelectedReportId(null);
    };

    const updateStatus = async (id, newStatus) => {
        await axios.put(`http://localhost:4000/api/audit/${id}/status`, { status: newStatus }, getAuthHeader());
        fetchAllAudits();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                {/* Card 1: Total */}
                <div style={{ flex: 1, padding: '20px', background: '#3b82f6', color: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>TOTAL REPORTS</h3>
                    <p style={{ margin: '10px 0 0', fontSize: '32px', fontWeight: 'bold' }}>{total}</p>
                </div>

                {/* Card 2: Pending */}
                <div style={{ flex: 1, padding: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>⏳ PENDING REVIEW</h3>
                    <p style={{ margin: '10px 0 0', fontSize: '32px', fontWeight: 'bold', color: '#d97706' }}>{pending}</p>
                </div>

                {/* Card 3: Approved */}
                <div style={{ flex: 1, padding: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>✅ APPROVED</h3>
                    <p style={{ margin: '10px 0 0', fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>{approved}</p>
                </div>

                {/* Card 4: Rejected */}
                <div style={{ flex: 1, padding: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>❌ REJECTED</h3>
                    <p style={{ margin: '10px 0 0', fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>{rejected}</p>
                </div>
            </div>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-3xl">👨‍⚖️</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Auditor Dashboard</h1>
                                <p className="text-blue-100 text-sm mt-1">Review and manage audit submissions</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Period</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {allAudits.map((audit) => (
                                    <tr key={audit.id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-6 py-4 text-xs text-gray-600 font-mono">{audit.id}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-900">{audit.companyId}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {audit.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{audit.auditPeriod}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${audit.status === 'APPROVED'
                                                ? 'bg-green-100 text-green-800'
                                                : audit.status === 'REJECTED'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {audit.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* Download Button */}
                                                <button
                                                    onClick={() => downloadReport(audit.id, audit.companyId, audit.auditPeriod)}
                                                    className="p-2 hover:bg-blue-50 border border-gray-300 rounded-lg transition duration-200 hover:border-blue-400 group"
                                                    title="Download File"
                                                >
                                                    <span className="text-lg group-hover:scale-110 inline-block transition-transform">📥</span>
                                                </button>

                                                {/* History Button */}
                                                <button
                                                    onClick={() => viewHistory(audit.id)}
                                                    className="p-2 hover:bg-purple-50 border border-gray-300 rounded-lg transition duration-200 hover:border-purple-400 group"
                                                    title="View Audit Trail"
                                                >
                                                    <span className="text-lg group-hover:scale-110 inline-block transition-transform">📜</span>
                                                </button>

                                                {/* Approve Button */}
                                                <button
                                                    onClick={() => updateStatus(audit.id, 'APPROVED')}
                                                    disabled={audit.status === 'APPROVED'}
                                                    className={`p-2 border rounded-lg transition duration-200 ${audit.status === 'APPROVED'
                                                        ? 'opacity-30 cursor-not-allowed border-gray-300'
                                                        : 'hover:bg-green-50 border-gray-300 hover:border-green-400 cursor-pointer group'
                                                        }`}
                                                    title="Approve"
                                                >
                                                    <span className={`text-lg ${audit.status !== 'APPROVED' ? 'group-hover:scale-110' : ''} inline-block transition-transform`}>✅</span>
                                                </button>

                                                {/* Reject Button */}
                                                <button
                                                    onClick={() => updateStatus(audit.id, 'REJECTED')}
                                                    disabled={audit.status === 'REJECTED'}
                                                    className={`p-2 border rounded-lg transition duration-200 ${audit.status === 'REJECTED'
                                                        ? 'opacity-30 cursor-not-allowed border-gray-300'
                                                        : 'hover:bg-red-50 border-gray-300 hover:border-red-400 cursor-pointer group'
                                                        }`}
                                                    title="Reject"
                                                >
                                                    <span className={`text-lg ${audit.status !== 'REJECTED' ? 'group-hover:scale-110' : ''} inline-block transition-transform`}>❌</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {allAudits.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-gray-500 text-lg">No audits available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* History Modal */}
            {selectedReportId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <span>📜</span>
                                    <span>Audit History</span>
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">Reference: {selectedReportId}</p>
                            </div>
                            <button
                                onClick={closeHistory}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition duration-200 text-white text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="overflow-y-auto px-8 py-6 flex-1">
                            {history.map((entry, index) => {
                                // 1. Determine Color/Icon based on status
                                const isApproved = entry.record.status === 'APPROVED';
                                const isRejected = entry.record.status === 'REJECTED';
                                const color = isApproved ? '#059669' : isRejected ? '#dc2626' : '#d97706';
                                const bg = isApproved ? '#d1fae5' : isRejected ? '#fee2e2' : '#fef3c7';
                                const icon = isApproved ? '✅' : isRejected ? '❌' : '⏳';

                                // 2. Format Date
                                const dateObj = new Date(entry.timestamp);
                                const dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                                const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={index} className="flex gap-4 mb-6">
                                        {/* Left: Time Column */}
                                        <div className="w-24 text-right flex-shrink-0 pt-1">
                                            <div className="text-sm font-semibold text-gray-700">{dateStr}</div>
                                            <div className="text-xs text-gray-500">{timeStr}</div>
                                        </div>

                                        {/* Center: Timeline */}
                                        <div className="relative flex flex-col items-center">
                                            <div
                                                className="w-3 h-3 rounded-full z-10 flex-shrink-0"
                                                style={{ backgroundColor: color }}
                                            ></div>
                                            {index !== history.length - 1 && (
                                                <div className="w-0.5 bg-gray-300 flex-grow mt-1"></div>
                                            )}
                                        </div>

                                        {/* Right: Content Card */}
                                        <div className="flex-grow pb-2">
                                            <div
                                                className="rounded-xl p-4 border-2"
                                                style={{
                                                    borderColor: color,
                                                    backgroundColor: bg
                                                }}
                                            >
                                                <div className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                                    <span className="text-xl">{icon}</span>
                                                    <span>Status changed to {entry.record.status}</span>
                                                </div>

                                                <div className="text-xs text-gray-700">
                                                    <span className="font-semibold">Blockchain TxID: </span>
                                                    <span
                                                        title={entry.txId}
                                                        className="font-mono bg-white bg-opacity-60 px-2 py-1 rounded cursor-help inline-block"
                                                    >
                                                        {entry.txId.substring(0, 12)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600">
                                All changes are immutably recorded on the blockchain
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditorPortal;