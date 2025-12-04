import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getToken } from '../services/api';

const BASE_URL = 'http://localhost:8000';

const QRCodeDisplay = ({ className = '' }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchQRCode = async () => {
    const token = getToken();
    console.log('Token:', token ? 'exists' : 'missing');
    console.log('User object:', user);
    
    if (!token || !user?.id) {
      console.log('Missing requirements:', { hasToken: !!token, userId: user?.id });
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching QR code for user ID:', user.id);
      const response = await fetch(`${BASE_URL}/qr/generate/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('QR API Error:', response.status, errorData);
        throw new Error(errorData.detail || 'Failed to generate QR code');
      }

      const data = await response.json();
      console.log('QR Code data received:', data);
      setQrData(data);
    } catch (err) {
      setError(err.message || 'Failed to load QR code');
      console.error('QR Code fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (token && user?.id) {
      fetchQRCode();
    }
  }, [user?.id]);

  const copyQRHash = () => {
    if (qrData?.qr_hash) {
      navigator.clipboard.writeText(qrData.qr_hash);
      // You could add a toast notification here
      alert('QR Hash copied to clipboard!');
    }
  };

  const downloadQRCode = () => {
    if (!qrData?.qr_code) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = qrData.qr_code;
    link.download = `nyord-qr-${user.username || 'user'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Generating QR Code...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <span className="material-symbols-outlined text-red-500 mr-2">error</span>
          <div>
            <h3 className="text-red-800 font-medium">Error Loading QR Code</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
        <button 
          onClick={fetchQRCode}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <p className="text-gray-600">No QR code available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="material-symbols-outlined mr-2 text-blue-600">qr_code</span>
          My QR Code
        </h3>
        <p className="text-sm text-gray-600 mt-1">Share your unique banking QR code</p>
      </div>

      {/* QR Code Display */}
      <div className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code Image */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-100 shadow-sm">
            <img 
              src={qrData.qr_code} 
              alt="User QR Code"
              className="w-48 h-48 object-contain"
            />
          </div>

          {/* User Info */}
          <div className="text-center space-y-1">
            <h4 className="font-semibold text-gray-900">{user.full_name || user.username}</h4>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500">User ID: {qrData.user_id}</p>
          </div>

          {/* QR Hash Display */}
          <div className="w-full max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QR Hash (Unique Identifier)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={qrData.qr_hash}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono text-gray-700"
              />
              <button
                onClick={copyQRHash}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                title="Copy QR Hash"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 w-full max-w-sm">
            <button
              onClick={downloadQRCode}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined mr-2 text-sm">download</span>
              Download
            </button>
            <button
              onClick={fetchQRCode}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined mr-2 text-sm">refresh</span>
              Refresh
            </button>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm">
            <div className="flex items-start">
              <span className="material-symbols-outlined text-blue-500 mr-2 mt-0.5 text-sm">info</span>
              <div className="text-xs text-blue-700">
                <p className="font-medium">About your QR Code:</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>Unique to your account</li>
                  <li>Always generates the same code</li>
                  <li>Safe to share with trusted parties</li>
                  <li>Contains your profile information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;