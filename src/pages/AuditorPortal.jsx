import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuditorPortal = () => {
    const [allAudits, setAllAudits] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedReportId, setSelectedReportId] = useState(null);

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
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h1>👨‍⚖️ Auditor Dashboard</h1>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ background: '#f4f4f4', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px' }}>ID</th>
                        <th style={{ padding: '10px' }}>Company</th>
                        <th style={{ padding: '10px' }}>Department</th>
                        <th style={{ padding: '10px' }}>Period</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {allAudits.map((audit) => (
                        <tr key={audit.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px', fontSize: '12px', color: '#555' }}>{audit.id}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{audit.companyId}</td>
                            <td style={{ padding: '10px', color: '#555' }}>
                                <span style={{
                                    background: '#e5e7eb', padding: '4px 8px', borderRadius: '12px', fontSize: '12px'
                                }}>
                                    {audit.department}
                                </span>
                            </td>
                            <td style={{
                                padding: '10px',
                                fontWeight: 'bold',
                                color: audit.status === 'APPROVED' ? 'green' : audit.status === 'REJECTED' ? 'red' : 'orange'
                            }}>
                                {audit.status}
                            </td>

                            <td style={{ padding: '10px' }}>
                                {/* UPDATED DOWNLOAD BUTTON */}
                                <button
                                    onClick={() => downloadReport(audit.id, audit.companyId, audit.auditPeriod)}
                                    style={{ marginRight: '8px', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}
                                    title="Download File"
                                >
                                    📥
                                </button>

                                <button
                                    onClick={() => viewHistory(audit.id)}
                                    style={{ marginRight: '15px', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}
                                    title="View Audit Trail"
                                >
                                    📜
                                </button>

                                <button
                                    onClick={() => updateStatus(audit.id, 'APPROVED')}
                                    disabled={audit.status === 'APPROVED'}
                                    style={{
                                        marginRight: '5px',
                                        cursor: audit.status === 'APPROVED' ? 'not-allowed' : 'pointer',
                                        opacity: audit.status === 'APPROVED' ? 0.3 : 1,
                                        border: 'none', background: 'transparent', fontSize: '18px'
                                    }}
                                    title="Approve"
                                >
                                    ✅
                                </button>

                                <button
                                    onClick={() => updateStatus(audit.id, 'REJECTED')}
                                    disabled={audit.status === 'REJECTED'}
                                    style={{
                                        cursor: audit.status === 'REJECTED' ? 'not-allowed' : 'pointer',
                                        opacity: audit.status === 'REJECTED' ? 0.3 : 1,
                                        border: 'none', background: 'transparent', fontSize: '18px'
                                    }}
                                    title="Reject"
                                >
                                    ❌
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedReportId && (
                <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#1f2937' }}>📜 Audit History</h2>
                                <span style={{ fontSize: '14px', color: '#6b7280' }}>Ref: {selectedReportId}</span>
                            </div>
                            <button
                                onClick={closeHistory}
                                style={{ cursor: 'pointer', border: 'none', background: '#f3f4f6', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Timeline Content */}
                        <div style={{ marginTop: '10px' }}>
                            {history.map((entry, index) => {
                                // 1. Determine Color/Icon based on status
                                const isApproved = entry.record.status === 'APPROVED';
                                const isRejected = entry.record.status === 'REJECTED';
                                const color = isApproved ? '#059669' : isRejected ? '#dc2626' : '#d97706'; // Green, Red, Orange
                                const bg = isApproved ? '#d1fae5' : isRejected ? '#fee2e2' : '#fef3c7'; // Light versions
                                const icon = isApproved ? '✅' : isRejected ? '❌' : '⏳';

                                // 2. Format Date (Handling typical Go/JS timestamp strings)
                                // Note: If your timestamp is purely numeric seconds, use new Date(entry.timestamp * 1000)
                                const dateObj = new Date(entry.timestamp);
                                const dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                                const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                        {/* Left: Time Column */}
                                        <div style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>{dateStr}</div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{timeStr}</div>
                                        </div>

                                        {/* Center: Line & Dot */}
                                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, zIndex: 1 }}></div>
                                            {/* Draw line only if not the last item */}
                                            {index !== history.length - 1 && (
                                                <div style={{ width: '2px', flexGrow: 1, backgroundColor: '#e5e7eb', marginTop: '2px' }}></div>
                                            )}
                                        </div>

                                        {/* Right: Card Content */}
                                        <div style={{ flexGrow: 1, paddingBottom: '10px' }}>
                                            <div style={{
                                                border: `1px solid ${color}`,
                                                backgroundColor: bg,
                                                borderRadius: '8px',
                                                padding: '12px',
                                                position: 'relative'
                                            }}>
                                                <div style={{ fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{icon}</span>
                                                    <span>Status changed to {entry.record.status}</span>
                                                </div>

                                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#4b5563' }}>
                                                    <span style={{ fontWeight: '600' }}>Blockchain TxID: </span>
                                                    <span
                                                        title={entry.txId} // Full ID shows on hover
                                                        style={{
                                                            fontFamily: 'monospace',
                                                            backgroundColor: 'rgba(255,255,255,0.6)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            cursor: 'help'
                                                        }}
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditorPortal;