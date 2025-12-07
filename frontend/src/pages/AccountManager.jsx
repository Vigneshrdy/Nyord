import { useState, useEffect } from 'react';
import CreateAccount from '../components/CreateAccount';
import { accountsAPI, transactionsAPI } from '../services/api';

const AccountManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: ''
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.getAccounts();
      setAccounts(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', text: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', text: 'Pending' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const approvedAccounts = accounts.filter(acc => acc.status === 'approved');
  const pendingAccounts = accounts.filter(acc => acc.status === 'pending');
  const rejectedAccounts = accounts.filter(acc => acc.status === 'rejected');

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferLoading(true);
    setError('');
    setTransferSuccess('');

    try {
      // Use the transactions API for account-to-account transfers (same as Transfer page)
      await transactionsAPI.createTransaction({
        src_account: parseInt(transferData.from_account_id),
        dest_account: parseInt(transferData.to_account_id),
        amount: parseFloat(transferData.amount)
      });

      setTransferSuccess(`Transfer initiated successfully!`);
      setTransferData({
        from_account_id: '',
        to_account_id: '',
        amount: ''
      });

      // Refresh accounts to show updated balances
      fetchAccounts();

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferSuccess('');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Account Manager</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your bank accounts and transfers</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCreateAccount(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Create Account
            </button>
            {approvedAccounts.length > 1 && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">swap_horiz</span>
                Transfer
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Approved Accounts */}
        {approvedAccounts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              Active Accounts
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {approvedAccounts.map((account) => (
                <div key={account.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {account.account_number}
                      </div>
                    </div>
                    {getStatusBadge(account.status)}
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {formatCurrency(account.balance)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created: {formatDate(account.created_at)}
                  </div>
                  {account.approval_date && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Approved: {formatDate(account.approval_date)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Accounts */}
        {pendingAccounts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">pending</span>
              Pending Approval
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingAccounts.map((account) => (
                <div key={account.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-l-4 border-yellow-400">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {account.account_number}
                      </div>
                    </div>
                    {getStatusBadge(account.status)}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                    Awaiting admin approval
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Requested: {formatDate(account.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Accounts */}
        {rejectedAccounts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">cancel</span>
              Rejected Requests
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rejectedAccounts.map((account) => (
                <div key={account.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-l-4 border-red-400">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {account.account_number}
                      </div>
                    </div>
                    {getStatusBadge(account.status)}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                    {account.rejection_reason || 'Request rejected'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Rejected: {formatDate(account.approval_date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {accounts.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">account_balance</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Accounts Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first bank account to get started</p>
            <button
              onClick={() => setShowCreateAccount(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Account
            </button>
          </div>
        )}

        {/* Create Account Modal */}
        {showCreateAccount && (
          <CreateAccount
            onAccountCreated={fetchAccounts}
            onClose={() => setShowCreateAccount(false)}
          />
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transfer Between Accounts</h2>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferSuccess('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {transferSuccess && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-700 dark:text-green-400 text-sm">{transferSuccess}</p>
                </div>
              )}

              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Account
                  </label>
                  <select
                    value={transferData.from_account_id}
                    onChange={(e) => setTransferData(prev => ({ ...prev, from_account_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select source account</option>
                    {approvedAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_number} - {account.account_type} - {formatCurrency(account.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Account
                  </label>
                  <select
                    value={transferData.to_account_id}
                    onChange={(e) => setTransferData(prev => ({ ...prev, to_account_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select destination account</option>
                    {approvedAccounts.filter(acc => acc.id.toString() !== transferData.from_account_id).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_number} - {account.account_type} - {formatCurrency(account.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transferData.amount}
                    onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>



                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferSuccess('');
                      setError('');
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transferLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {transferLoading ? 'Processing...' : 'Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManager;