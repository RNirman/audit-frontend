import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const DocumentViewerModal = ({ reportId, onClose }) => {
    const [fileUrl, setFileUrl] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [csvData, setCsvData] = useState({ headers: [], rows: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndRenderFile = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // 1. Fetch the encrypted file data
                const response = await axios.get(`http://localhost:4000/api/audit/${reportId}/download`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                });

                const blob = response.data;
                let detectedType = response.headers['content-type'];

                // 2. ADVANCED MAGIC BYTE DETECTION
                // Read the first 5 bytes to determine true file type (prevents parser crashes)
                const buffer = await blob.slice(0, 5).arrayBuffer();
                const bytes = new Uint8Array(buffer);
                const firstFiveBytes = String.fromCharCode(...bytes);
                
                // Check if it's a binary ZIP/XLSX/DOCX file (Always starts with PK\x03\x04)
                const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04;

                if (firstFiveBytes === '%PDF-') {
                    detectedType = 'application/pdf';
                } else if (isZip) {
                    detectedType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; // XLSX
                } else {
                    // If it's not a PDF or Binary, we assume it's a CSV / Text file
                    detectedType = 'text/csv';
                }

                setFileType(detectedType);

                // 3. HANDLE CSV PARSING
                if (detectedType === 'text/csv') {
                    const text = await blob.text();
                    Papa.parse(text, {
                        header: true, // Automatically uses the first row as column headers
                        skipEmptyLines: true,
                        complete: (results) => {
                            if (results.data && results.data.length > 0) {
                                setCsvData({
                                    headers: Object.keys(results.data[0]),
                                    rows: results.data
                                });
                            }
                        },
                        error: (err) => {
                            console.error("PapaParse Error:", err);
                        }
                    });
                }
                
                // 4. CREATE SECURE URL
                const url = window.URL.createObjectURL(new Blob([blob], { type: detectedType }));
                setFileUrl(url);
                setIsLoading(false);
                
            } catch (err) {
                console.error(err);
                setError("Failed to load document. It may be corrupted or missing.");
                setIsLoading(false);
            }
        };

        fetchAndRenderFile();

        // Cleanup memory when modal closes
        return () => {
            if (fileUrl) {
                window.URL.revokeObjectURL(fileUrl);
            }
        };
    }, [reportId]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
                
                {/* Header */}
                <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                            <h3 className="text-lg font-bold">Secure Document Viewer</h3>
                            <p className="text-xs text-gray-400 font-mono">ASSET ID: {reportId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="bg-green-500 bg-opacity-20 text-green-400 text-xs px-2 py-1 rounded border border-green-500 flex items-center gap-1">
                            <span>🔒</span> End-to-End Encrypted
                        </span>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl transition-colors">&times;</button>
                    </div>
                </div>

                {/* Body / Viewer Area */}
                <div className="flex-grow bg-gray-100 relative flex items-center justify-center overflow-hidden">
                    {isLoading && (
                        <div className="flex flex-col items-center text-gray-500">
                            <svg className="animate-spin h-10 w-10 mb-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="font-medium animate-pulse">Decrypting and loading document...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-500 flex flex-col items-center">
                            <span className="text-5xl mb-2">⚠️</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {!isLoading && !error && fileUrl && (
                        fileType === 'application/pdf' ? (
                            
                            /* --- 1. PDF RENDERER --- */
                            <iframe 
                                src={`${fileUrl}#toolbar=0`} 
                                className="w-full h-full border-none bg-white"
                                title="Document Preview"
                            />

                        ) : fileType === 'text/csv' ? (
                            
                            /* --- 2. CSV TABLE RENDERER --- */
                            <div className="w-full h-full flex flex-col bg-white">
                                <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-20">
                                    <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                        <span>📊</span> Data Preview (Parsed {csvData.rows.length} rows)
                                    </span>
                                    <a 
                                        href={fileUrl} 
                                        download={`Export_${reportId}.csv`}
                                        className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                    >
                                        <span>📥</span> Download Original File
                                    </a>
                                </div>
                                
                                <div className="flex-grow overflow-auto p-0">
                                    {csvData.headers.length > 0 ? (
                                        <table className="min-w-full text-left border-collapse whitespace-nowrap">
                                            <thead className="bg-gray-100 sticky top-0 shadow-sm z-10">
                                                <tr>
                                                    {csvData.headers.map((header, index) => (
                                                        <th key={index} className="px-6 py-3 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {csvData.rows.map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="hover:bg-blue-50 transition-colors">
                                                        {csvData.headers.map((header, colIndex) => (
                                                            <td key={colIndex} className="px-6 py-3 text-sm text-gray-600">
                                                                {row[header]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="flex justify-center items-center h-full text-gray-400">
                                            No valid CSV data found.
                                        </div>
                                    )}
                                </div>
                            </div>

                        ) : (
                            
                            /* --- 3. BINARY FALLBACK (XLSX/DOCX) --- */
                            <div className="flex flex-col items-center text-gray-600 p-8 text-center max-w-md">
                                <span className="text-6xl mb-4">🗃️</span>
                                <h4 className="text-xl font-bold text-gray-800 mb-2">Binary File Format</h4>
                                <p className="text-sm mb-6">
                                    This file format (.xlsx / .docx) cannot be previewed natively in the browser without risking formatting errors. You must download it to view the contents securely.
                                </p>
                                <a 
                                    href={fileUrl} 
                                    download={`Secure_Export_${reportId}`}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <span>📥</span> Download Decrypted File
                                </a>
                            </div>

                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewerModal;