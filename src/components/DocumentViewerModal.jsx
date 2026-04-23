import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Lock, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';

const DocumentViewerModal = ({ reportId, onClose }) => {
    const [fileUrl, setFileUrl] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndRenderFile = async () => {
            try {
                const response = await api.get(`/audit/${reportId}/download`, {
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
            <div className="glass-card w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
                
                {/* Header */}
                <div className="px-6 py-4 bg-gray-900 border-b border-gray-800 text-white flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="text-indigo-400" size={28} />
                        <div>
                            <h3 className="text-lg font-bold text-gray-100">Secure Document Viewer</h3>
                            <p className="text-xs text-gray-500 font-mono">FILE: {reportId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/30 flex items-center gap-1">
                            <Lock size={12} className="inline" /> End-to-End Encrypted
                        </span>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-2xl transition-colors">&times;</button>
                    </div>
                </div>

                {/* Body / Viewer Area */}
                <div className="flex-grow bg-gray-950 relative flex items-center justify-center border-t border-gray-800">
                    {isLoading && (
                        <div className="flex flex-col items-center text-gray-400">
                            <svg className="animate-spin h-10 w-10 mb-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="font-medium animate-pulse">Decrypting and loading document...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 flex flex-col items-center bg-red-500/10 border border-red-500/30 p-8 rounded-xl glass-card">
                            <AlertTriangle size={48} className="text-red-400 mb-4" />
                            <p className="font-medium text-red-200">{error}</p>
                        </div>
                    )}

                    {!isLoading && !error && fileUrl && (
                        fileType === 'application/pdf' ? (
                            // Natively display PDFs inside an iframe
                            <div className="w-full h-full bg-white relative">
                                <iframe 
                                    src={`${fileUrl}#toolbar=0`} // #toolbar=0 hides the download/print buttons in some browsers
                                    className="w-full h-full border-none absolute inset-0"
                                    title="Document Preview"
                                />
                            </div>
                        ) : (
                            // Fallback for Excel/Word files which browsers cannot natively render
                            <div className="flex flex-col items-center text-gray-400 p-8 text-center max-w-md glass-card rounded-xl border border-gray-800 shadow-2xl">
                                <FileSpreadsheet size={64} className="text-indigo-400 mb-4 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                <h4 className="text-xl font-bold text-gray-200 mb-2">Spreadsheet / Document File</h4>
                                <p className="text-sm mb-6 text-gray-400">
                                    This file format cannot be previewed natively in the browser. You must download it to view the contents securely.
                                </p>
                                <a 
                                    href={fileUrl} 
                                    download={`Secure_Export_${reportId}`}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors flex items-center gap-2 border border-indigo-500/50"
                                >
                                    <Download size={18} /> Download Decrypted File
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