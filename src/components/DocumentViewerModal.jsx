import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DocumentViewerModal = ({ reportId, onClose }) => {
    const [fileUrl, setFileUrl] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndRenderFile = async () => {
            try {
                const token = localStorage.getItem('token');
                
                const response = await axios.get(`http://localhost:4000/api/audit/${reportId}/download`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                });

                const blob = response.data;
                let detectedType = response.headers['content-type'];

                const firstFiveBytes = await blob.slice(0, 5).text();
                if (firstFiveBytes === '%PDF-') {
                    detectedType = 'application/pdf';
                }

                setFileType(detectedType);

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

        return () => {
            if (fileUrl) {
                window.URL.revokeObjectURL(fileUrl);
            }
        };
    }, [reportId]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
                
                {/* Header */}
                <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                            <h3 className="text-lg font-bold">Secure Document Viewer</h3>
                            <p className="text-xs text-gray-400 font-mono">FILE: {reportId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="bg-green-500 bg-opacity-20 text-green-400 text-xs px-2 py-1 rounded border border-green-500 flex items-center gap-1">
                            <span>🔒</span> End-to-End Encrypted
                        </span>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors">&times;</button>
                    </div>
                </div>

                {/* Body / Viewer Area */}
                <div className="flex-grow bg-gray-100 relative flex items-center justify-center">
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
                            // Natively display PDFs inside an iframe
                            <iframe 
                                src={`${fileUrl}#toolbar=0`} // #toolbar=0 hides the download/print buttons in some browsers
                                className="w-full h-full border-none"
                                title="Document Preview"
                            />
                        ) : (
                            // Fallback for Excel/Word files which browsers cannot natively render
                            <div className="flex flex-col items-center text-gray-600 p-8 text-center max-w-md">
                                <span className="text-6xl mb-4">📊</span>
                                <h4 className="text-xl font-bold text-gray-800 mb-2">Spreadsheet / Document File</h4>
                                <p className="text-sm mb-6">
                                    This file format cannot be previewed natively in the browser. You must download it to view the contents securely.
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