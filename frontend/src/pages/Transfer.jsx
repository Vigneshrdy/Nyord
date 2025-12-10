import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { accountsAPI, transactionsAPI, cardsAPI } from '../services/api';

const Transfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [transferData, setTransferData] = useState({
    transferType: 'external', // 'external' (to other users) or 'internal' (between own accounts)
    sourceType: 'account', // 'account' or 'card'
    sourceAccount: '',
    sourceCard: '',
    destAccount: '', // For internal transfers
    recipientUser: null,
    recipientAccount: null,
    amount: '',
    cardPin: '', // Required for card transfers
  });

  const [recipientAccounts, setRecipientAccounts] = useState([]);

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAccounts();
    fetchCards();
  }, []);

  // If navigated with recipient in location.state or query param, prefill recipient
  useEffect(() => {
    const preselected = location?.state?.recipientUser;
    const params = new URLSearchParams(location.search);
    const recipientQuery = params.get('recipient');

    if (preselected) {
      // If recipient user object provided via state, select it
      selectRecipient(preselected);
    } else if (recipientQuery) {
      // Search users by username query and select first match
      (async () => {
        try {
          setSearchLoading(true);
          const results = await transactionsAPI.searchUsers(recipientQuery);
          if (results && results.length > 0) {
            await selectRecipient(results[0]);
          }
        } catch (e) {
          console.error('Auto-select recipient failed', e);
        } finally {
          setSearchLoading(false);
        }
      })();
    }
  }, [location.search, location.state]);

  const fetchAccounts = async () => {
    try {
      const data = await accountsAPI.getAccounts();
      console.log('Fetched accounts:', data);
      setAccounts(data || []);
      // Auto-select first approved account as default source to improve UX
      const approved = (data || []).filter(acc => acc.status === 'approved');
      if (approved.length > 0) {
        setTransferData(prev => ({ ...prev, sourceAccount: String(approved[0].id) }));
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchCards = async () => {
    try {
      const data = await cardsAPI.getMyCards();
      console.log('Fetched cards:', data);
      // Only show active cards for transfers
      setCards(data?.filter(card => card.status === 'ACTIVE') || []);
      // Don't auto-select to force user to choose
    } catch (e) {
      console.error('Failed to fetch accounts', e);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await transactionsAPI.searchUsers(query);
      setSearchResults(results || []);
      setShowDropdown(true);
    } catch (e) {
      console.error('Failed to search users', e);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const selectRecipient = async (user) => {
    setSearchQuery(user.username);
    setShowDropdown(false);
    
    // Fetch recipient's accounts
    try {
      const userAccounts = await accountsAPI.getUserAccounts(user.id);
      if (userAccounts && userAccounts.length > 0) {
        setRecipientAccounts(userAccounts);
        setTransferData(prev => ({
          ...prev,
          recipientUser: user,
          recipientAccount: String(userAccounts[0].id)
        }));
      } else {
        showMessage('error', 'Recipient has no accounts');
      }
    } catch (e) {
      console.error('Failed to fetch recipient accounts', e);
      showMessage('error', 'Failed to load recipient account details');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    const amount = parseFloat(transferData.amount);
    if (isNaN(amount) || amount <= 0) {
      showMessage('error', 'Please enter a valid amount');
      return;
    }

    if (!transferData.recipientAccount) {
      showMessage('error', 'Please select a recipient');
      return;
    }

    // Validate source selection
    if (transferData.sourceType === 'account' && !transferData.sourceAccount) {
      showMessage('error', 'Please select a source account');
      return;
    }

    if (transferData.sourceType === 'card') {
      if (!transferData.sourceCard) {
        showMessage('error', 'Please select a source card');
        return;
      }
      if (!transferData.cardPin || transferData.cardPin.length !== 4) {
        showMessage('error', 'Please enter a valid 4-digit PIN');
        return;
      }
    }

    setLoading(true);

    try {
      if (transferData.sourceType === 'card') {
        // Card to account transfer
        await cardsAPI.transferFromCard(parseInt(transferData.sourceCard), {
          dest_account: parseInt(transferData.recipientAccount),
          amount: amount,
          pin: transferData.cardPin,
        });
        showMessage('success', 'Card transfer completed successfully!');
      } else {
        // Account to account transfer
        await transactionsAPI.createTransaction({
          src_account: parseInt(transferData.sourceAccount),
          dest_account: parseInt(transferData.recipientAccount),
          amount: amount,
        });
        showMessage('success', 'Transfer initiated successfully!');
      }
      
      // Reset form
      setTransferData({
        sourceType: 'account',
        sourceAccount: accounts[0]?.id || '',
        sourceCard: '',
        recipientUser: null,
        recipientAccount: null,
        amount: '',
        cardPin: '',
      });
      setSearchQuery('');
      
      // Refresh data
      setTimeout(() => {
        fetchAccounts();
        if (transferData.sourceType === 'card') {
          fetchCards();
        }
      }, 2000);
    } catch (e) {
      console.error('Transfer failed', e);
      showMessage('error', e.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === parseInt(transferData.sourceAccount));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <span className="material-symbols-outlined mr-2">arrow_back</span>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Transfer Money</h1>
          <p className="text-gray-600 dark:text-gray-400">Send money to other users securely</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-400'
          }`}>
            <div className="flex items-center">
              <span className="material-symbols-outlined mr-2">
                {message.type === 'success' ? 'check_circle' : 'error'}
              </span>
              {message.text}
            </div>
          </div>
        )}

        {/* Transfer Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleTransfer} className="space-y-6">
            {/* Transfer Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transfer Type
              </label>
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="external"
                    checked={transferData.transferType === 'external'}
                    onChange={(e) => setTransferData({ 
                      ...transferData, 
                      transferType: e.target.value, 
                      recipientUser: null, 
                      recipientAccount: null, 
                      destAccount: '' 
                    })}
                    className="mr-2"
                  />
                  To Other Users
                </label>
                {/* <label className="flex items-center">
                  <input
                    type="radio"
                    value="internal"
                    checked={transferData.transferType === 'internal'}
                    onChange={(e) => setTransferData({ 
                      ...transferData, 
                      transferType: e.target.value, 
                      recipientUser: null, 
                      recipientAccount: null, 
                      destAccount: '' 
                    })}
                    className="mr-2"
                  />
                  Between My Accounts
                </label> */}
              </div>
            </div>

            {/* Source Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transfer From
              </label>
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="account"
                    checked={transferData.sourceType === 'account'}
                    onChange={(e) => setTransferData({ ...transferData, sourceType: e.target.value, sourceCard: '', cardPin: '' })}
                    className="mr-2"
                  />
                  Bank Account
                </label>
                {/* <label className="flex items-center">
                  <input
                    type="radio"
                    value="card"
                    checked={transferData.sourceType === 'card'}
                    onChange={(e) => setTransferData({ ...transferData, sourceType: e.target.value, sourceAccount: '' })}
                    className="mr-2"
                  />
                  Credit Card
                </label> */}
              </div>
            </div>

            {/* Source Account/Card Selection */}
            {transferData.sourceType === 'account' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Account
                </label>
                <select
                  value={transferData.sourceAccount}
                  onChange={(e) => setTransferData({ ...transferData, sourceAccount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select an account</option>
                {accounts.filter(acc => acc.status === 'approved').map(acc => (
                  <option key={acc.id} value={String(acc.id)}>
                    {acc.account_type === 'savings' ? 'Savings' : 'Current'} - {acc.account_number} - Balance: ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Available Balance: ${selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Credit Card
                </label>
                <select
                  value={transferData.sourceCard}
                  onChange={(e) => setTransferData({ ...transferData, sourceCard: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a card</option>
                  {cards.map(card => (
                    <option key={card.id} value={String(card.id)}>
                      {card.card_type} - {card.card_number} - Available Credit: ${card.available_credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
                {transferData.sourceCard && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card PIN
                    </label>
                    <input
                      type="password"
                      maxLength="4"
                      value={transferData.cardPin}
                      onChange={(e) => setTransferData({ ...transferData, cardPin: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 4-digit PIN"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* Destination Selection - Internal vs External */}
            {transferData.transferType === 'internal' ? (
              /* Internal Transfer - Destination Account */
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Account
                </label>
                <select
                  value={transferData.destAccount}
                  onChange={(e) => setTransferData({ ...transferData, destAccount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select destination account</option>
                  {accounts.filter(acc => acc.id.toString() !== transferData.sourceAccount).map(acc => (
                    <option key={acc.id} value={String(acc.id)}>
                      {acc.account_type === 'savings' ? 'Savings' : 'Current'} - {acc.account_number} - Balance: ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* External Transfer - Recipient Search */
              <>
                {/* Recipient Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recipient Username
                  </label>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowDropdown(true)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type username to search..."
                required
              />
              
              {/* Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectRecipient(user)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">{user.username}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.full_name || 'No name'} • {user.email}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchLoading && (
                <div className="absolute right-4 top-12 text-gray-400">
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                </div>
              )}

              {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && !searchLoading && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              )}
            </div>

                {/* Selected Recipient Info */}
                {transferData.recipientUser && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                        {transferData.recipientUser.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {transferData.recipientUser.username}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {transferData.recipientUser.full_name || 'No name'} • {transferData.recipientUser.email}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Recipient's Accounts Dropdown (allow user to pick which of recipient's accounts to send to) */}
                {transferData.recipientUser && recipientAccounts.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recipient Account
                    </label>
                    <select
                      value={String(transferData.recipientAccount || '')}
                      onChange={(e) => setTransferData({ ...transferData, recipientAccount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select recipient account</option>
                      {recipientAccounts.map(acc => (
                        <option key={acc.id} value={String(acc.id)}>
                          {acc.account_type === 'savings' ? 'Savings' : 'Current'} - {acc.account_number} - Balance: ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !transferData.recipientAccount}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Transfer Money'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Transfers Info */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transfer Information</h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start">
              <span className="material-symbols-outlined text-blue-600 mr-3 mt-0.5">info</span>
              <p>Transfers are processed instantly between user accounts</p>
            </div>
            <div className="flex items-start">
              <span className="material-symbols-outlined text-blue-600 mr-3 mt-0.5">security</span>
              <p>All transactions are secured and encrypted</p>
            </div>
            <div className="flex items-start">
              <span className="material-symbols-outlined text-blue-600 mr-3 mt-0.5">schedule</span>
              <p>Transaction history is available in your account statements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
