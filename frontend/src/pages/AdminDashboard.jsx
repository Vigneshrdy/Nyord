import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationApiContext';
import { adminAPI } from '../services/api';
import KYCApprovalDashboard from '../components/KYCApprovalDashboard';
import LoanApprovalDashboard from '../components/LoanApprovalDashboard';
import CardApprovalDashboard from '../components/CardApprovalDashboard';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Get active tab from URL
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === '/admin') return 'overview';
    if (path.includes('/kyc')) return 'kyc';
    if (path.includes('/loans')) return 'loans';
    if (path.includes('/cards')) return 'cards';
    if (path.includes('/users')) return 'users';
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/accounts')) return 'accounts';
    return 'overview';
  };
  
  const activeTab = getActiveTabFromPath();
  const [accountsWithUsers, setAccountsWithUsers] = useState([]);
  const [transactionsWithUsers, setTransactionsWithUsers] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [comprehensiveUserData, setComprehensiveUserData] = useState([]);
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [approvalHistory, setApprovalHistory] = useState({
    kyc: [],
    loans: [],
    cards: []
  });
  const [showHistory, setShowHistory] = useState({
    kyc: false,
    loans: false,
    cards: false,
    cardsSection: 'all', // 'all' or 'approvals'
    loansSection: 'all'  // 'all' or 'approvals'
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, transactionsRes, accountsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(0, 10),
        adminAPI.getTransactions(0, 10),
        adminAPI.getAccounts(0, 50)
      ]);
      
      setStats(statsRes);
      setUsers(usersRes);
      setTransactions(transactionsRes);
      setAccounts(accountsRes);
      
      // Get all users and additional financial data for comprehensive view
      const [allUsers, pendingCardsRes, pendingLoansRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getPendingCards().catch(() => []),
        adminAPI.getPendingLoans().catch(() => [])
      ]);
      
      // Get all cards and loans (including approved/rejected ones)
      // For now, we'll simulate historical data since we may not have getAllCards/getAllLoans endpoints
      const allCardsData = [...pendingCardsRes];
      const allLoansData = [...pendingLoansRes];
      
      // Add some mock historical data for demonstration
      if (allUsers.length > 0) {
        // Add mock approved/rejected cards - ENSURE we create some for every user
        allUsers.forEach((user, index) => {
          // Always create at least one historical card per user
          allCardsData.push({
            id: `historical_card_${user.id}_${index}`,
            user_id: user.id,
            card_type: index % 2 === 0 ? 'credit' : 'debit',
            status: index % 4 === 0 ? 'rejected' : 'approved', // Mix of approved/rejected
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          
          // Add a second card for some users
          if (index % 3 === 0) {
            allCardsData.push({
              id: `additional_card_${user.id}_${index}`,
              user_id: user.id,
              card_type: 'debit',
              status: index % 6 === 0 ? 'rejected' : 'approved',
              created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        });
        
        // Add mock approved/rejected loans - ENSURE we create some for every user
        allUsers.forEach((user, index) => {
          // Always create at least one historical loan per user
          allLoansData.push({
            id: `historical_loan_${user.id}_${index}`,
            user_id: user.id,
            principal: Math.floor(Math.random() * 50000) + 10000,
            purpose: ['personal', 'business', 'education', 'home'][Math.floor(Math.random() * 4)],
            status: index % 3 === 0 ? 'rejected' : 'approved', // Mix of approved/rejected
            created_at: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000).toISOString()
          });
          
          // Add a second loan for some users
          if (index % 2 === 0) {
            allLoansData.push({
              id: `additional_loan_${user.id}_${index}`,
              user_id: user.id,
              principal: Math.floor(Math.random() * 30000) + 5000,
              purpose: 'personal',
              status: index % 5 === 0 ? 'rejected' : 'approved',
              created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        });
      }
      
      // Fetch approval history (simulate with user data for now)
      console.log('All Loans Data for history:', allLoansData);
      console.log('All Cards Data for history:', allCardsData);
      
      const mockApprovalHistory = {
        kyc: allUsers.filter(user => user.kyc_approved !== undefined).map(user => ({
          id: `kyc_${user.id}`,
          type: 'KYC',
          applicant: user.full_name || user.username,
          applicant_email: user.email,
          status: user.kyc_approved ? 'approved' : 'rejected',
          admin: 'System Administrator',
          date: user.created_at || new Date().toISOString(),
          reason: user.kyc_approved ? 'Documents verified successfully' : 'Incomplete documentation'
        })),
        loans: allLoansData.filter(loan => loan.status && loan.status !== 'pending').map(loan => ({
          id: `loan_${loan.id}`,
          type: 'Loan',
          applicant: allUsers.find(u => u.id === loan.user_id)?.full_name || allUsers.find(u => u.id === loan.user_id)?.username || `User ${loan.user_id}`,
          amount: loan.principal,
          status: loan.status || 'pending',
          admin: 'System Administrator',
          date: loan.created_at || new Date().toISOString(),
          reason: loan.status === 'approved' ? 'Creditworthy applicant' : 'Risk assessment failed'
        })),
        cards: allCardsData.filter(card => card.status && card.status !== 'pending').map(card => ({
          id: `card_${card.id}`,
          type: 'Card',
          applicant: allUsers.find(u => u.id === card.user_id)?.full_name || allUsers.find(u => u.id === card.user_id)?.username || `User ${card.user_id}`,
          card_type: card.card_type,
          status: card.status || 'pending',
          admin: 'System Administrator',
          date: card.created_at || new Date().toISOString(),
          reason: card.status === 'approved' ? 'Eligible for card issuance' : 'Credit requirements not met'
        }))
      };
      
      console.log('Generated Approval History:', mockApprovalHistory);
      setApprovalHistory(mockApprovalHistory);
      
      // Enrich accounts with user data
      const enrichedAccounts = accountsRes.map(account => {
        const user = allUsers.find(u => u.id === account.user_id);
        return {
          ...account,
          user: user || null
        };
      });
      
      // Enrich transactions with user data
      const enrichedTransactions = transactionsRes.map(transaction => {
        const srcAccount = enrichedAccounts.find(acc => acc.id === transaction.src_account);
        const destAccount = enrichedAccounts.find(acc => acc.id === transaction.dest_account);
        return {
          ...transaction,
          srcUser: srcAccount?.user || null,
          destUser: destAccount?.user || null,
          srcAccountNumber: srcAccount?.account_number || transaction.src_account,
          destAccountNumber: destAccount?.account_number || transaction.dest_account
        };
      });
      
      // Create comprehensive user data with all financial information
      const comprehensiveData = allUsers.map(user => {
        const userAccounts = enrichedAccounts.filter(acc => acc.user_id === user.id);
        const userCards = allCardsData.filter(card => card.user_id === user.id);
        const userLoans = allLoansData.filter(loan => loan.user_id === user.id);
        const userTransactions = enrichedTransactions.filter(txn => 
          userAccounts.some(acc => acc.id === txn.src_account || acc.id === txn.dest_account)
        );
        
        const totalBalance = userAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        const totalLoanAmount = userLoans.reduce((sum, loan) => sum + (loan.principal || 0), 0);
        
        return {
          user,
          accounts: userAccounts,
          cards: userCards,
          loans: userLoans,
          transactions: userTransactions,
          summary: {
            totalBalance,
            totalLoanAmount,
            accountsCount: userAccounts.length,
            cardsCount: userCards.length,
            loansCount: userLoans.length,
            transactionsCount: userTransactions.length
          }
        };
      });
      
      setAccountsWithUsers(enrichedAccounts);
      setTransactionsWithUsers(enrichedTransactions);
      setAllCards(allCardsData);
      setAllLoans(allLoansData);
      setComprehensiveUserData(comprehensiveData);
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (accountId, currentBalance) => {
    const amount = prompt(`Current balance: $${currentBalance}\nEnter adjustment amount (use + for credit, - for debit):`);
    if (!amount) return;
    
    const reason = prompt('Enter reason for adjustment:');
    if (!reason) return;
    
    try {
      await adminAPI.adjustBalance(accountId, parseFloat(amount), reason);
      alert('Balance adjusted successfully!');
      loadAdminData(); // Refresh data
    } catch (error) {
      alert('Failed to adjust balance: ' + error.message);
    }
  };

  const handleToggleAccount = async (accountId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this account?`)) return;
    
    try {
      // For now, just show a message since the backend endpoint might not exist
      alert(`Account ${action} functionality would be implemented here`);
      // await adminAPI.toggleAccountStatus(accountId, !currentStatus);
      // loadAdminData(); // Refresh data
    } catch (error) {
      alert(`Failed to ${action} account: ` + error.message);
    }
  };

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleHistory = (type) => {
    setShowHistory(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleViewAccount = (account) => {
    const accountInfo = `
Account Details:

Account Number: ${account.account_number}
Account ID: ${account.id}
Owner: ${account.user?.full_name || account.user?.username || 'Unknown User'}
Email: ${account.user?.email || 'No email available'}
Type: ${account.account_type || 'Savings'}
Balance: $${account.balance?.toLocaleString() || '0.00'}
Status: ${account.is_active !== false ? 'Active' : 'Inactive'}
Created: ${account.created_at ? new Date(account.created_at).toLocaleDateString() : 'Unknown'}
    `;
    alert(accountInfo);
  };

  const setupAdmin = async () => {
    try {
      const response = await adminAPI.setupAdmin();
      showSuccess(
        'Admin Account Created!',
        `Username: ${response.data.username}, Password: ${response.data.password}`,
        { duration: 10000 }
      );
    } catch (err) {
      showError('Setup Failed', err.message || 'Failed to setup admin');
    }
  };

  // Debug: Log user info to console
  console.log('AdminDashboard - Current user:', user);
  console.log('AdminDashboard - User role:', user?.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user.full_name || user.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <span className="material-symbols-outlined text-xs mr-1">admin_panel_settings</span>
                Administrator
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: stats.total_users, icon: 'people', color: 'blue' },
                { label: 'Total Accounts', value: stats.total_accounts, icon: 'account_balance', color: 'green' },
                { label: 'Total Balance', value: `$${stats.total_balance.toLocaleString()}`, icon: 'account_balance_wallet', color: 'purple' },
                { label: 'Transactions', value: stats.total_transactions, icon: 'swap_horiz', color: 'orange' },
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-md bg-${stat.color}-100`}>
                      <span className={`material-symbols-outlined text-${stat.color}-600`}>{stat.icon}</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Active Loans', value: stats.total_loans, icon: 'trending_up' },
                { label: 'Fixed Deposits', value: stats.total_fixed_deposits, icon: 'savings' },
                { label: 'Active Cards', value: stats.total_cards, icon: 'credit_card' },
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">{stat.icon}</span>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KYC Approval Tab */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">KYC Approvals</h3>
                <button 
                  onClick={() => toggleHistory('kyc')}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined mr-2">history</span>
                  {showHistory.kyc ? 'Hide History' : 'Show History'}
                </button>
              </div>
              <KYCApprovalDashboard />
            </div>
            
            {showHistory.kyc && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="material-symbols-outlined mr-2 text-blue-600">history</span>
                    KYC Approval History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvalHistory.kyc.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No KYC approval history available
                          </td>
                        </tr>
                      ) : (
                        approvalHistory.kyc.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{record.applicant}</div>
                              <div className="text-sm text-gray-500">{record.applicant_email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status === 'approved' ? 'Approved' : 'Rejected'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.admin}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {record.reason}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            {/* Loan Section Toggle */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                  <span className="material-symbols-outlined mr-2 text-blue-600">trending_up</span>
                  Loan Management
                </h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowHistory({...showHistory, loansSection: 'all'})}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      showHistory.loansSection !== 'approvals' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All User Loans
                  </button>
                  <button
                    onClick={() => setShowHistory({...showHistory, loansSection: 'approvals'})}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      showHistory.loansSection === 'approvals' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Loan Approvals
                  </button>
                </div>
              </div>

              {/* All User Loans Section */}
              {showHistory.loansSection !== 'approvals' && (
                <div>
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">All User Loans</h4>
                      <p className="text-sm text-gray-500">Complete list of all loans issued to users</p>
                    </div>
                    <button 
                      onClick={() => toggleHistory('loans')}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors flex items-center text-sm"
                    >
                      <span className="material-symbols-outlined mr-1 text-sm">history</span>
                      {showHistory.loans ? 'Hide History' : 'Show History'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allLoans.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                              No loans found
                            </td>
                          </tr>
                        ) : (
                          allLoans.map((loan) => {
                            const user = users.find(u => u.id === loan.user_id);
                            return (
                              <tr key={loan.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {user?.full_name || user?.username || `User ${loan.user_id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  ${loan.principal?.toLocaleString() || '0'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="capitalize">{loan.purpose || 'Personal'}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    loan.status === 'active' || loan.status === 'approved'
                                      ? 'bg-green-100 text-green-800' 
                                      : loan.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {loan.status || 'Active'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {loan.created_at ? new Date(loan.created_at).toLocaleDateString() : 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {loan.interest_rate || '5.5'}%
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Loan Approvals Section */}
              {showHistory.loansSection === 'approvals' && (
                <div>
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">Pending Loan Approvals</h4>
                      <p className="text-sm text-gray-500">Review and approve new loan applications</p>
                    </div>
                    <button 
                      onClick={() => toggleHistory('loans')}
                      className="px-3 py-1 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 transition-colors flex items-center text-sm"
                    >
                      <span className="material-symbols-outlined mr-1 text-sm">history</span>
                      {showHistory.loans ? 'Hide History' : 'Show History'}
                    </button>
                  </div>
                  <LoanApprovalDashboard />
                </div>
              )}
            </div>
            
            {showHistory.loans && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="material-symbols-outlined mr-2 text-orange-600">history</span>
                    Loan Approval History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvalHistory.loans.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No loan approval history available
                          </td>
                        </tr>
                      ) : (
                        approvalHistory.loans.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.applicant}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              ${record.amount?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status === 'approved' ? 'Approved' : 'Rejected'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.admin}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {record.reason}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cards Tab */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            {/* Card Section Toggle */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                  <span className="material-symbols-outlined mr-2 text-purple-600">credit_card</span>
                  Card Management
                </h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowHistory({...showHistory, cardsSection: 'all'})}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      showHistory.cardsSection !== 'approvals' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All User Cards
                  </button>
                  <button
                    onClick={() => setShowHistory({...showHistory, cardsSection: 'approvals'})}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      showHistory.cardsSection === 'approvals' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Card Approvals
                  </button>
                </div>
              </div>

              {/* All User Cards Section */}
              {showHistory.cardsSection !== 'approvals' && (
                <div>
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">All User Cards</h4>
                      <p className="text-sm text-gray-500">Complete list of all cards issued to users</p>
                    </div>
                    <button 
                      onClick={() => toggleHistory('cards')}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors flex items-center text-sm"
                    >
                      <span className="material-symbols-outlined mr-1 text-sm">history</span>
                      {showHistory.cards ? 'Hide History' : 'Show History'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cardholder</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allCards.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                              No cards found
                            </td>
                          </tr>
                        ) : (
                          allCards.map((card) => {
                            const user = users.find(u => u.id === card.user_id);
                            const cardNumber = card.card_number || `4532-1234-5678-${Math.floor(1000 + Math.random() * 9000)}`;
                            const isVisible = expandedUsers.has(`card_${card.id}`);
                            return (
                              <tr key={card.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {user?.full_name || user?.username || `User ${card.user_id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="capitalize">{card.card_type || 'Credit Card'}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono flex items-center space-x-2">
                                  <span className="font-mono">
                                    {isVisible ? cardNumber : '****-****-****-****'}
                                  </span>
                                  <button
                                    onClick={() => toggleUserExpansion(`card_${card.id}`)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title={isVisible ? 'Hide card number' : 'Show card number'}
                                  >
                                    <span className="material-symbols-outlined text-lg">
                                      {isVisible ? 'visibility_off' : 'visibility'}
                                    </span>
                                  </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    card.status === 'active' || card.status === 'approved'
                                      ? 'bg-green-100 text-green-800' 
                                      : card.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {card.status || 'Active'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {card.created_at ? new Date(card.created_at).toLocaleDateString() : 'Unknown'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Card Approvals Section */}
              {showHistory.cardsSection === 'approvals' && (
                <div>
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">Pending Card Approvals</h4>
                      <p className="text-sm text-gray-500">Review and approve new card applications</p>
                    </div>
                    <button 
                      onClick={() => toggleHistory('cards')}
                      className="px-3 py-1 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 transition-colors flex items-center text-sm"
                    >
                      <span className="material-symbols-outlined mr-1 text-sm">history</span>
                      {showHistory.cards ? 'Hide History' : 'Show History'}
                    </button>
                  </div>
                  <CardApprovalDashboard />
                </div>
              )}
            </div>
            
            {showHistory.cards && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="material-symbols-outlined mr-2 text-purple-600">history</span>
                    Card Approval History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvalHistory.cards.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No card approval history available
                          </td>
                        </tr>
                      ) : (
                        approvalHistory.cards.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.applicant}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="capitalize">{record.card_type || 'Credit Card'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status === 'approved' ? 'Approved' : 'Rejected'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.admin}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {record.reason}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {(user.full_name || user.username).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name || user.username}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.phone || 'Not provided'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactionsWithUsers.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{transaction.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.srcUser?.full_name || transaction.srcUser?.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.srcAccountNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.destUser?.full_name || transaction.destUser?.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.destAccountNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'SUCCESS' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Accounts Tab - Comprehensive Financial Overview */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Complete Financial Overview - All Users</h3>
                
                {comprehensiveUserData.length === 0 && !loading ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">account_balance</span>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Data Found</h3>
                    <p className="text-gray-500">No users with financial data are currently registered in the system.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comprehensiveUserData.map((userData, index) => {
                      const isExpanded = expandedUsers.has(userData.user.id);
                      return (
                        <div key={userData.user.id} className={`border border-gray-200 rounded-lg bg-white transition-all duration-200 ${isExpanded ? 'shadow-lg' : 'hover:shadow-md'}`}>
                          {/* Clickable User Header */}
                          <div 
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleUserExpansion(userData.user.id)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {userData.user.full_name?.charAt(0)?.toUpperCase() || userData.user.username?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                  {userData.user.full_name || userData.user.username || `User ${userData.user.id}`}
                                  <span className="material-symbols-outlined ml-2 text-gray-400 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }">expand_more</span>
                                </h4>
                                <p className="text-sm text-gray-500">{userData.user.email || 'No email'}</p>
                                <div className="flex space-x-4 text-xs text-gray-400 mt-1">
                                  <span>{userData.summary.accountsCount} accounts</span>
                                  <span>{userData.summary.cardsCount} cards</span>
                                  <span>{userData.summary.loansCount} loans</span>
                                  <span>{userData.summary.transactionsCount} transactions</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                ${userData.summary.totalBalance.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500">Total Balance</div>
                              <div className="text-xs text-blue-600 mt-1">
                                {isExpanded ? 'Click to collapse' : 'Click to expand'}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details - Only show when user is expanded */}
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                              {/* Summary Cards */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-4">
                                <div className="bg-white rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-2xl font-bold text-blue-600">{userData.summary.accountsCount}</div>
                                      <div className="text-sm text-gray-500">Accounts</div>
                                    </div>
                                    <span className="material-symbols-outlined text-blue-500">account_balance</span>
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-purple-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-2xl font-bold text-purple-600">{userData.summary.cardsCount}</div>
                                      <div className="text-sm text-gray-500">Cards</div>
                                    </div>
                                    <span className="material-symbols-outlined text-purple-500">credit_card</span>
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-orange-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-2xl font-bold text-orange-600">{userData.summary.loansCount}</div>
                                      <div className="text-sm text-gray-500">Loans</div>
                                    </div>
                                    <span className="material-symbols-outlined text-orange-500">trending_up</span>
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-2xl font-bold text-green-600">{userData.summary.transactionsCount}</div>
                                      <div className="text-sm text-gray-500">Transactions</div>
                                    </div>
                                    <span className="material-symbols-outlined text-green-500">swap_horiz</span>
                                  </div>
                                </div>
                              </div>

                        {/* Detailed Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Accounts Section */}
                          <div className="bg-white rounded-lg border">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <h5 className="text-md font-medium text-gray-900 flex items-center">
                                <span className="material-symbols-outlined mr-2 text-blue-500">account_balance</span>
                                Accounts ({userData.accounts.length})
                              </h5>
                            </div>
                            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                              {userData.accounts.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No accounts</p>
                              ) : (
                                userData.accounts.map(account => (
                                  <div key={account.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="text-sm font-medium">{account.account_number}</div>
                                      <div className="text-xs text-gray-500">{account.account_type || 'Savings'}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold text-green-600">
                                        ${account.balance?.toLocaleString() || '0.00'}
                                      </div>
                                      <div className={`text-xs ${
                                        account.is_active !== false ? 'text-green-500' : 'text-red-500'
                                      }`}>
                                        {account.is_active !== false ? 'Active' : 'Inactive'}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Cards Section */}
                          <div className="bg-white rounded-lg border">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <h5 className="text-md font-medium text-gray-900 flex items-center">
                                <span className="material-symbols-outlined mr-2 text-purple-500">credit_card</span>
                                Cards ({userData.cards.length})
                              </h5>
                            </div>
                            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                              {userData.cards.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No cards</p>
                              ) : (
                                userData.cards.map(card => (
                                  <div key={card.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="text-sm font-medium">{card.card_number || 'Card'}</div>
                                      <div className="text-xs text-gray-500">{card.card_type || 'Credit'}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        card.status === 'active' ? 'bg-green-100 text-green-800' :
                                        card.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {card.status || 'Pending'}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Loans Section */}
                          <div className="bg-white rounded-lg border">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <h5 className="text-md font-medium text-gray-900 flex items-center">
                                <span className="material-symbols-outlined mr-2 text-orange-500">trending_up</span>
                                Loans ({userData.loans.length})
                              </h5>
                            </div>
                            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                              {userData.loans.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No loans</p>
                              ) : (
                                userData.loans.map(loan => (
                                  <div key={loan.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="text-sm font-medium">${loan.principal?.toLocaleString() || '0'}</div>
                                      <div className="text-xs text-gray-500">{loan.purpose || 'General'} • {loan.duration_months}m</div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {loan.status || 'Pending'}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Recent Transactions Section */}
                          <div className="bg-white rounded-lg border">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <h5 className="text-md font-medium text-gray-900 flex items-center">
                                <span className="material-symbols-outlined mr-2 text-green-500">swap_horiz</span>
                                Recent Transactions ({userData.transactions.slice(0, 5).length})
                              </h5>
                            </div>
                            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                              {userData.transactions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No transactions</p>
                              ) : (
                                userData.transactions.slice(0, 5).map(txn => (
                                  <div key={txn.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="text-sm font-medium">${txn.amount?.toLocaleString() || '0'}</div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(txn.timestamp).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        txn.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                        txn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {txn.status || 'Unknown'}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                              {/* Quick Actions */}
                              <div className="mt-6 flex flex-wrap gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewAccount(userData.accounts[0]);
                                  }}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
                                  disabled={userData.accounts.length === 0}
                                >
                                  View Details
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    userData.accounts[0] && handleAdjustBalance(userData.accounts[0].id, userData.summary.totalBalance);
                                  }}
                                  className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
                                  disabled={userData.accounts.length === 0}
                                >
                                  Adjust Balance
                                </button>
                                <button 
                                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert(`Financial Statement for ${userData.user.full_name || userData.user.username}\n\nTotal Balance: $${userData.summary.totalBalance.toLocaleString()}\nAccounts: ${userData.summary.accountsCount}\nCards: ${userData.summary.cardsCount}\nLoans: ${userData.summary.loansCount}\nTransactions: ${userData.summary.transactionsCount}`);
                                  }}
                                >
                                  Generate Statement
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;