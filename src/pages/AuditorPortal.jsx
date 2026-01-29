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
                        <th style={{ padding: '10px' }}>Period</th> {/* NEW COLUMN */}
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {allAudits.map((audit) => (
                        <tr key={audit.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px', fontSize: '12px', color: '#555' }}>{audit.id}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{audit.companyId}</td>
                            <td style={{ padding: '10px', color: '#2563eb' }}>{audit.auditPeriod}</td> {/* NEW DATA */}
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
                <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h2>📜 Audit Trail: {selectedReportId}</h2>
                            <button onClick={closeHistory} style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: '20px' }}>✖</button>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            {history.map((entry, index) => (
                                <div key={index} style={{ borderLeft: '3px solid #2563eb', paddingLeft: '15px', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{entry.timestamp}</div>
                                    <div style={{ fontWeight: 'bold' }}>Status: {entry.record.status}</div>
                                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#888' }}>Tx: {entry.txId}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditorPortal;