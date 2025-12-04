import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import QRTransactionConfirm from '../components/QRTransactionConfirm';
import { apiRequest } from '../services/api';

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [step, setStep] = useState('loading'); // 'loading', 'confirm', 'success', 'error'

  // Extract URL parameters
  const recipientId = searchParams.get('to');
  const hash = searchParams.get('hash');
  const username = searchParams.get('username');
  const name = searchParams.get('name');

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const currentUrl = window.location.href;
      navigate(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!recipientId || !hash) {
      setError('Invalid payment link');
      setStep('error');
      return;
    }

    validateAndLoadRecipient();
  }, [recipientId, hash, isAuthenticated]);

  const validateAndLoadRecipient = async () => {
    try {
      setLoading(true);
      
      // Validate the hash and get recipient details
      const response = await apiRequest(`/qr/verify/${recipientId}?qr_hash=${hash}`);
      
      if (response.valid && response.user_info) {
        // Check if trying to pay self
        if (response.user_info.id === user?.id) {
          setError('You cannot send money to yourself');
          setStep('error');
          return;
        }

        setRecipient({
          user_id: response.user_info.id,
          username: response.user_info.username,
          full_name: response.user_info.full_name,
          email: response.user_info.email
        });
        setStep('confirm');
      } else {
        setError('Invalid or expired payment link');
        setStep('error');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate payment link');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionConfirm = async (transactionData) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest('/transactions/qr-transfer', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      setTransaction(response);
      setStep('success');
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToTransactions = () => {
    navigate('/statements');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Payment Request</h1>
          <p className="text-gray-600 mt-2">
            {name || username ? `Pay ${name || username}` : 'Complete your payment'}
          </p>
        </div>

        {/* Loading State */}
        {step === 'loading' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating payment request...</p>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-red-500 mr-3">error</span>
                <h3 className="text-lg font-semibold text-red-800">Payment Error</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation State */}
        {step === 'confirm' && recipient && (
          <div>
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-blue-600 mr-2">qr_code</span>
                <div>
                  <p className="text-blue-800 font-medium">QR Code Payment</p>
                  <p className="text-blue-600 text-sm">You scanned a payment QR code</p>
                </div>
              </div>
            </div>

            <QRTransactionConfirm
              recipient={recipient}
              onConfirm={handleTransactionConfirm}
              onCancel={goToDashboard}
              loading={loading}
            />
          </div>
        )}

        {/* Success State */}
        {step === 'success' && transaction && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl text-green-600">check_circle</span>
                </div>
                <h3 className="text-xl font-semibold text-green-800">Payment Successful!</h3>
                <p className="text-sm text-green-600 mt-1">Your transaction has been processed</p>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-gray-900">${transaction.amount}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Sent to {recipient.full_name || recipient.username}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transaction ID:</span>
                    <span className="text-sm font-mono text-gray-900">#{transaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium text-green-600">{transaction.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm text-gray-900">QR Payment</span>
                  </div>
                  {transaction.description && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Description:</span>
                      <span className="text-sm text-gray-900">{transaction.description}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={goToDashboard}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={goToTransactions}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Transactions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;