import React, { useState } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const SmePortal = () => {
  const [companyId, setCompanyId] = useState('');
  const [department, setDepartment] = useState('Finance');
  const [period, setPeriod] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const hash = CryptoJS.SHA256(evt.target.result).toString();
        setFileHash(hash);
      };
      reader.readAsBinaryString(file);
    }
  };

  const getAuthHeader = () => {
    return { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
  };

  const handleSubmit = async () => {
    if (!companyId || !period || !fileHash) return alert("Please fill all fields");

    const reportId = `REP_${Date.now()}`;
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    // Create FormData object to send file + text
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reportId', reportId);
    formData.append('companyId', companyId);
    formData.append('department', department);
    formData.append('reportHash', fileHash);
    formData.append('period', period);

    try {
      setSubmitStatus("Submitting...");

      // Note: We don't need to set 'Content-Type', axios does it automatically for FormData
      const response = await axios.post('http://localhost:4000/api/audit', formData, getAuthHeader());

      setSubmitStatus(`Success! Report ID: ${response.data.reportId}`);
    } catch (error) {
      console.error(error);
      setSubmitStatus("Error submitting transaction.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">📤</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SME Submission Portal</h1>
            <p className="text-blue-100 text-sm">Submit Audit Reports Securely</p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            <div className="space-y-6">
              {/* Company ID Input */}
              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-2">
                  Company ID
                </label>
                <input
                  id="companyId"
                  type="text"
                  placeholder="Enter your company ID"
                  onChange={e => setCompanyId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                />
              </div>

              {/* Department Select */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  id="department"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none bg-white"
                >
                  <option value="Finance">Finance</option>
                  <option value="Sales">Sales</option>
                  <option value="Inventory">Inventory / Logistics</option>
                  <option value="HR">HR & Payroll</option>
                  <option value="Tax">Tax Compliance</option>
                </select>
              </div>

              {/* Audit Period Input */}
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                  Audit Period
                </label>
                <input
                  id="period"
                  type="text"
                  placeholder="e.g., Q1 2024"
                  onChange={e => setPeriod(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Report
                </label>
                <div className="relative">
                  <input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file"
                    className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition duration-200 cursor-pointer bg-gray-50 hover:bg-blue-50"
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        {fileName ? (
                          <span className="font-medium text-blue-600">{fileName}</span>
                        ) : (
                          <>
                            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, XLSX, DOCX up to 10MB</p>
                    </div>
                  </label>
                </div>
                {fileHash && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 font-mono break-all">
                      <span className="font-semibold">Hash:</span> {fileHash.substring(0, 40)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {submitStatus && (
                <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
                  submitStatus.includes('Success') 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : submitStatus.includes('Error')
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}>
                  {submitStatus.includes('Success') ? (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : submitStatus.includes('Error') ? (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="animate-spin w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span className="text-sm font-medium">{submitStatus}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Submit Report
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600">
              All submissions are encrypted and stored on the blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmePortal;