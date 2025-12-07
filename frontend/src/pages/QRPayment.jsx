import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import QRScanner from '../components/QRScanner';
import QRUploader from '../components/QRUploader';
import QRTransactionConfirm from '../components/QRTransactionConfirm';
import { transactionsAPI } from '../services/api';

const QRPayment = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'upload'
  const [step, setStep] = useState('input'); // 'input', 'confirm', 'success'
  const [scannedData, setScannedData] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleQRScan = async (qrData) => {
    console.log('QR Data scanned:', qrData);
    setError('');
    setLoading(true);

    try {
      // Decode the QR code data through backend
      const response = await transactionsAPI.decodeQR(qrData);

      if (response.valid && response.can_transact) {
        setRecipient(response.recipient);
        setScannedData(qrData);
        setStep('confirm');
      } else if (!response.can_transact) {
        setError('Cannot send money to yourself');
      } else {
        setError('Invalid QR code or recipient not found');
      }
    } catch (err) {
      console.error('QR decode error:', err);
      // Better error handling - extract actual error message
      let errorMessage = 'Failed to process QR code';
      
      if (err.detail) {
        errorMessage = err.detail;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQRError = (errorMsg) => {
    setError(errorMsg);
  };

  const handleTransactionConfirm = async (transactionData) => {
    setLoading(true);
    setError('');

    try {
      const response = await transactionsAPI.processQRPayment(transactionData);

      setTransaction(response);
      setStep('success');
    } catch (err) {
      console.error('Transaction error:', err);
      // Better error handling - extract actual error message
      let errorMessage = 'Transaction failed';
      
      if (err.detail) {
        errorMessage = err.detail;
      } else if (err.message && err.message !== '[object Object]') {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('input');
      setRecipient(null);
      setScannedData(null);
    } else if (step === 'success') {
      resetFlow();
    }
  };

  const resetFlow = () => {
    setStep('input');
    setRecipient(null);
    setScannedData(null);
    setTransaction(null);
    setError('');
    setActiveTab('scan');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToTransactions = () => {
    navigate('/transactions');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">QR Payment</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Send money by scanning or uploading a QR code</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step === 'input' ? 'border-blue-600 bg-blue-600 text-white' :
                step === 'confirm' || step === 'success' ? 'border-green-500 bg-green-500 text-white' :
                'border-gray-300 text-gray-500'
              }`}>
                {step === 'input' ? '1' : <span className="material-symbols-outlined text-sm">check</span>}
              </div>
              <span className="text-sm font-medium">Scan QR</span>
              
              <div className={`w-12 h-0.5 ${step === 'confirm' || step === 'success' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step === 'confirm' ? 'border-blue-600 bg-blue-600 text-white' :
                step === 'success' ? 'border-green-500 bg-green-500 text-white' :
                'border-gray-300 text-gray-500'
              }`}>
                {step === 'confirm' ? '2' : step === 'success' ? <span className="material-symbols-outlined text-sm">check</span> : '2'}
              </div>
              <span className="text-sm font-medium">Confirm</span>
              
              <div className={`w-12 h-0.5 ${step === 'success' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step === 'success' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-500'
              }`}>
                {step === 'success' ? <span className="material-symbols-outlined text-sm">check</span> : '3'}
              </div>
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-red-500 mr-3">error</span>
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError('')}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step Content */}
        {step === 'input' && (
          <div className="space-y-6">
            {/* Tab Selection */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('scan')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'scan'
                        ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined mr-2 text-sm align-middle">qr_code_scanner</span>
                    Scan QR Code
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'upload'
                        ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined mr-2 text-sm align-middle">upload</span>
                    Upload QR Image
                  </button>
                </div>
              </div>
            </div>

            {/* QR Scanner/Uploader */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                {activeTab === 'scan' && (
                  <QRScanner
                    onScan={handleQRScan}
                    onError={handleQRError}
                    isActive={activeTab === 'scan'}
                  />
                )}
                
                {activeTab === 'upload' && (
                  <QRUploader
                    onScan={handleQRScan}
                    onError={handleQRError}
                  />
                )}
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-blue-600">help</span>
                  How to Use QR Payment
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Get QR Code</h4>
                      <p className="text-sm text-gray-600 mt-1">Ask the recipient to show their QR code from their profile</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Scan or Upload</h4>
                      <p className="text-sm text-gray-600 mt-1">Use your camera to scan or upload an image of the QR code</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Enter Amount</h4>
                      <p className="text-sm text-gray-600 mt-1">Confirm recipient details and enter the amount to send</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Complete Payment</h4>
                      <p className="text-sm text-gray-600 mt-1">Review and confirm the transaction</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-yellow-600 mr-2 mt-0.5 text-sm">security</span>
                    <div className="text-xs text-yellow-800">
                      <p className="font-medium">Security Tip:</p>
                      <p>Always verify the recipient's identity before making a payment. QR codes should only be obtained from trusted sources.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && recipient && (
          <div className="max-w-2xl mx-auto">
            <QRTransactionConfirm
              recipient={recipient}
              onConfirm={handleTransactionConfirm}
              onCancel={handleBack}
              loading={loading}
            />
          </div>
        )}

        {step === 'success' && transaction && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Success Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-2xl text-green-600">check_circle</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Payment Successful!</h3>
                  <p className="text-sm text-gray-600 mt-1">Your transaction has been processed successfully</p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">${transaction.amount}</p>
                    <p className="text-sm text-gray-600 mt-1">Sent to {recipient.full_name || recipient.username}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
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
                        <span className="text-sm text-gray-900">QR Transfer</span>
                      </div>
                      {transaction.description && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Description:</span>
                          <span className="text-sm text-gray-900">{transaction.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={goToDashboard}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={goToTransactions}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View All Transactions
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={resetFlow}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Make Another Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRPayment;