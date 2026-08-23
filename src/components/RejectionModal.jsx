import React, { useState } from 'react';

const RejectionModal = ({ onClose, onSubmit }) => {
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        const trimmedReason = reason.trim();
        if (!trimmedReason) {
            return;
        }

        onSubmit(trimmedReason);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-red-400 font-semibold">Mandatory rejection reason</p>
                        <h3 className="text-xl font-bold text-white mt-2">Explain the rejection</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl transition-colors">&times;</button>
                </div>

                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={6}
                    placeholder="Add the justification for rejecting this report..."
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 text-gray-100 p-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/40 outline-none resize-none"
                />

                <div className="mt-5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim()}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectionModal;
