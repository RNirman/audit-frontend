import React, { useEffect, useState } from 'react';
import { Check, Settings } from 'lucide-react';
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
        return <div className="glass-card p-6 animate-pulse h-64 text-gray-400">Loading configurations...</div>;
    }

    return (
        <div className="glass-card overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                    <Settings className="text-indigo-400" size={20} /> Enterprise System Configurations
                </h2>
                {saveStatus && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${saveStatus.includes('Error') ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                        {saveStatus}
                    </span>
                )}
            </div>

            <div className="px-6 divide-y divide-gray-800">
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
    <div className="flex items-center justify-between gap-6 py-5">
        <div className="pr-4">
            <h4 className="text-sm font-bold text-gray-200">{title}</h4>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
        <button 
            type="button"
            onClick={onChange}
            aria-pressed={checked}
            aria-label={`${title}: ${checked ? 'enabled' : 'disabled'}`}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border border-gray-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 focus:ring-offset-gray-900 ${checked ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-800'}`}
        >
            <span className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-gray-100 shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}>
                {checked && <Check size={12} className="text-indigo-700" strokeWidth={3} />}
            </span>
        </button>
    </div>
);

export default AdminSettingsPanel;