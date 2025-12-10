import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const QRTransactionConfirm = ({ 
  recipient, 
  onConfirm, 
  onCancel, 
  loading = false,
  className = '' 
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const { user } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseFloat(amount) > 999999) {
      newErrors.amount = 'Amount cannot exceed $999,999';
    }

    if (description.length > 100) {
      newErrors.description = 'Description cannot exceed 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onConfirm?.({
        recipient_id: recipient.user_id,
        amount: parseFloat(amount),
        description: description.trim() || undefined,
        transaction_type: 'qr_transfer'
      });
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value);
      if (errors.amount) {
        setErrors({ ...errors, amount: '' });
      }
    }
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    if (errors.description) {
      setErrors({ ...errors, description: '' });
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="material-symbols-outlined mr-2 text-green-600">payment</span>
          Confirm Transaction
        </h3>
        <p className="text-sm text-gray-600 mt-1">Review the details and confirm your payment</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Recipient Information */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <span className="material-symbols-outlined mr-2 text-blue-600 text-sm">person</span>
            Sending to:
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Name:</span>
              <span className="text-sm font-medium text-gray-900">
                {recipient.full_name || recipient.username}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Username:</span>
              <span className="text-sm font-medium text-gray-900">@{recipient.username}</span>
            </div>
            
            {recipient.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium text-gray-900">{recipient.email}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">User ID:</span>
              <span className="text-sm font-mono text-gray-700">#{recipient.user_id}</span>
            </div>
          </div>
        </div>

        {/* Sender Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <span className="material-symbols-outlined mr-2 text-gray-600 text-sm">account_circle</span>
            Sending from:
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Your Name:</span>
              <span className="text-sm font-medium text-gray-900">
                {user?.full_name || user?.username || 'You'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Your Username:</span>
              <span className="text-sm font-medium text-gray-900">@{user?.username}</span>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="material-symbols-outlined mr-1 text-sm align-middle">currency_rupee</span>
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold ${
                errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={loading}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="material-symbols-outlined mr-1 text-sm">error</span>
              {errors.amount}
            </p>
          )}
        </div>



        {/* Warning for same user */}
        {recipient.user_id === user?.id && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-yellow-600 mr-2 text-sm">warning</span>
              <p className="text-yellow-800 text-sm">
                You're trying to send money to yourself. This transaction will be blocked.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || recipient.user_id === user?.id}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2 text-sm">send</span>
                Send ${amount || '0.00'}
              </>
            )}
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-4 bg-gray-50 rounded-lg p-3">
          <div className="flex items-start">
            <span className="material-symbols-outlined text-gray-500 mr-2 mt-0.5 text-sm">security</span>
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Security Note:</p>
              <p>This transaction will be processed securely. Make sure you recognize the recipient before proceeding.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QRTransactionConfirm;