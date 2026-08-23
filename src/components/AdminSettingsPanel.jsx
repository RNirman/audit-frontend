import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useSettings } from '../context/SettingsContext';

const AdminSettingsPanel = () => {
    const [localSettings, setLocalSettings] = useState({
        allowDownloads: true,
        blindAudit: false,
        enableChat: true,
        requireRejectionReason: false,
        showLedger: true
    });
    const [saveStatus, setSaveStatus] = useState(null);
    const { settings, isLoading, refreshSettings } = useSettings();

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    // Handle Toggle Changes
    const handleToggle = async (key) => {
        const updatedSettings = { ...localSettings, [key]: !localSettings[key] };
        setLocalSettings(updatedSettings);
        setSaveStatus('Saving...');

        try {
            await api.put('/settings', updatedSettings);
            await refreshSettings();
            setSaveStatus('Saved successfully');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
            console.error("Failed to save settings", error);
            setSaveStatus('Error saving');
            // Revert on failure
            setLocalSettings(settings);
        }
    };

    if (isLoading) {
        return <div className="p-6 animate-pulse bg-gray-100 rounded-xl h-64">Loading configurations...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-900 text-white flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <span>⚙️</span> Enterprise System Configurations
                </h2>
                {saveStatus && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${saveStatus.includes('Error') ? 'bg-red-500' : 'bg-green-500'}`}>
                        {saveStatus}
                    </span>
                )}
            </div>

            <div className="p-6 divide-y divide-gray-100">
                <ToggleRow 
                    title="Strict View-Only Mode" 
                    description="Disables the download button for Auditors. Forces in-memory document preview only."
                    checked={!localSettings.allowDownloads} // Inverted logic: View Only = !allowDownloads
                    onChange={() => handleToggle('allowDownloads')} 
                />
                <ToggleRow 
                    title="Blind Auditing Mode" 
                    description="Anonymizes SME company names and IDs for Org2 Auditors to prevent bias during initial review."
                    checked={localSettings.blindAudit} 
                    onChange={() => handleToggle('blindAudit')} 
                />
                <ToggleRow 
                    title="Enable Direct Chat" 
                    description="Allows Auditors and SMEs to communicate via the encrypted off-chain comment system."
                    checked={localSettings.enableChat} 
                    onChange={() => handleToggle('enableChat')} 
                />
                <ToggleRow 
                    title="Mandatory Rejection Justification" 
                    description="Forces Auditors to provide a written explanation before a rejection transaction is submitted to the ledger."
                    checked={localSettings.requireRejectionReason} 
                    onChange={() => handleToggle('requireRejectionReason')} 
                />
                <ToggleRow 
                    title="Cryptographic Ledger Visibility" 
                    description="Shows the Blockchain Explorer tracking timeline and TXIDs on the Auditor dashboards."
                    checked={localSettings.showLedger} 
                    onChange={() => handleToggle('showLedger')} 
                />
            </div>
        </div>
    );
};

// Sub-component for the fancy Tailwind Toggle Switch
const ToggleRow = ({ title, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4">
        <div className="pr-4">
            <h4 className="text-sm font-bold text-gray-800">{title}</h4>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <button 
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

export default AdminSettingsPanel;