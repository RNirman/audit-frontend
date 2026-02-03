import React, { useState } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const SmePortal = () => {
  const [companyId, setCompanyId] = useState('');
  const [department, setDepartment] = useState('Finance');
  const [period, setPeriod] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>📤 SME Submission Portal</h1>
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px' }}>
        <input style={styles.input} placeholder="Company ID" onChange={e => setCompanyId(e.target.value)} />
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Department:</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="Finance">Finance</option>
            <option value="Sales">Sales</option>
            <option value="Inventory">Inventory / Logistics</option>
            <option value="HR">HR & Payroll</option>
            <option value="Tax">Tax Compliance</option>
          </select>
        </div>
        <input style={styles.input} placeholder="Audit Period" onChange={e => setPeriod(e.target.value)} />
        <input type="file" style={styles.input} onChange={handleFileChange} />
        <button style={styles.button} onClick={handleSubmit}>Submit Report</button>
        {submitStatus && <p>{submitStatus}</p>}
      </div>
    </div>
  );
};

// Reusing your simple styles
const styles = {
  input: { display: 'block', width: '100%', padding: '10px', marginBottom: '10px' },
  button: { padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default SmePortal;