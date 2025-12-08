import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getToken } from '../services/api';

const BASE_URL = 'http://localhost:8000';

const AccountQRCodes = ({ className = '' }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const { user } = useAuth();

  const fetchAccountQRCodes = async () => {
    const token = getToken();
    
    if (!token || !user?.id) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${BASE_URL}/accounts/qr-codes/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate QR codes');
      }

      const data = await response.json();
      setQrData(data);
      // Select first account by default
      if (data.accounts && data.accounts.length > 0) {
        setSelectedAccount(data.accounts[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load QR codes');
      console.error('QR Code fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (token && user?.id) {
      fetchAccountQRCodes();
    }
  }, [user?.id]);

  const downloadQRCode = (account) => {
    if (!account?.qr_code) return;
    
    const link = document.createElement('a');
    link.href = account.qr_code;
    link.download = `nyord-qr-${account.account_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareQRCode = async (account) => {
    if (!account?.qr_code) return;
    
    // Convert base64 to blob
    const base64Data = account.qr_code.split(',')[1];
    const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
    const file = new File([blob], `nyord-qr-${account.account_number}.png`, { type: 'image/png' });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Nyord Bank - ${account.account_type} Account`,
          text: `Send money to ${qrData.full_name || qrData.username}`,
          files: [file]
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy account number
      navigator.clipboard.writeText(account.account_number);
      alert('Account number copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">Generating QR Codes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <span className="material-symbols-outlined text-red-500 mr-2">error</span>
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-medium">Error Loading QR Codes</h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
        <button 
          onClick={fetchAccountQRCodes}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!qrData || !qrData.accounts || qrData.accounts.length === 0) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 mr-3 text-3xl">account_balance</span>
          <div>
            <h3 className="text-yellow-800 dark:text-yellow-400 font-medium">No Accounts Found</h3>
            <p className="text-yellow-700 dark:text-yellow-500 text-sm mt-1">
              Create and get approval for an account to receive payments via QR code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Account Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {qrData.accounts.map((account) => (
            <button
              key={account.account_id}
              onClick={() => setSelectedAccount(account)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedAccount?.account_id === account.account_id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{account.account_type}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{account.account_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    ${account.balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Account QR Display */}
      {selectedAccount && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col items-center">
            {/* Account Info */}
            <div className="w-full mb-4 text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {selectedAccount.account_type} Account
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {qrData.full_name || qrData.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                {selectedAccount.account_number}
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <img 
                src={selectedAccount.qr_code} 
                alt={`QR Code for ${selectedAccount.account_type} account`}
                className="w-64 h-64 object-contain"
              />
            </div>

            {/* Instructions */}
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
              Scan this QR code to send money directly to this account. Each account has its own unique QR code.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full max-w-md">
              <button
                onClick={() => downloadQRCode(selectedAccount)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-xl">download</span>
                Download
              </button>
              <button
                onClick={() => shareQRCode(selectedAccount)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-xl">share</span>
                Share
              </button>
            </div>

            {/* Balance Display */}
            <div className="mt-4 w-full max-w-md bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Balance</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${selectedAccount.balance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-3 mt-0.5">info</span>
          <div>
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
              Multiple Account QR Codes
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-500">
              Like UPI, each of your approved accounts has its own QR code. Share the specific QR code 
              for the account where you want to receive payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountQRCodes;
