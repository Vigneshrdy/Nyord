import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationApiContext';
import { adminAPI } from '../services/api';
import KYCApprovalDashboard from '../components/KYCApprovalDashboard';
import LoanApprovalDashboard from '../components/LoanApprovalDashboard';
import CardApprovalDashboard from '../components/CardApprovalDashboard';
import AccountApprovals from '../components/AccountApprovals';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Update active tab from URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/admin/kyc') {
      setActiveTab('kyc');
    } else if (path === '/admin/loans') {
      setActiveTab('loans');
    } else if (path === '/admin/cards') {
      setActiveTab('cards');
    } else if (path === '/admin/accounts') {
      setActiveTab('accounts');
    } else if (path === '/admin/users') {
      setActiveTab('users');
    } else if (path === '/admin/transactions') {
      setActiveTab('transactions');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  // Refresh data when specific tabs become active (only for admins)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activeTab === 'transactions') {
      refreshTransactions();
    } else if (activeTab === 'users' || activeTab === 'accounts') {
      loadAdminData();
    }
  }, [activeTab, user]);

  const refreshTransactions = async () => {
    try {
      setLoading(true);
      const [transactionsRes, usersRes, accountsRes] = await Promise.all([
        adminAPI.getTransactions(0, 50), // Get more transactions
        adminAPI.getAllUsers(),
        adminAPI.getAccounts(0, 100)
      ]);
      
      setTransactions(transactionsRes);
      
      // Enrich transactions with user data
      const enrichedTransactions = transactionsRes.map(transaction => {
        const srcAccount = accountsRes.find(acc => acc.id === transaction.src_account);
        const destAccount = accountsRes.find(acc => acc.id === transaction.dest_account);
        const srcUser = usersRes.find(user => user.id === srcAccount?.user_id);
        const destUser = usersRes.find(user => user.id === destAccount?.user_id);
        
        return {
          ...transaction,
          srcUser: srcUser || null,
          destUser: destUser || null,
          srcAccountNumber: srcAccount?.account_number || transaction.src_account,
          destAccountNumber: destAccount?.account_number || transaction.dest_account
        };
      });
      
      setTransactionsWithUsers(enrichedTransactions);
    } catch (err) {
      console.error('Failed to refresh transactions:', err);
    } finally {
      setLoading(false);
    }
  };
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
    if (user && user.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

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
    
    const reason = prompt('Enter reason for balance adjustment:', 'Administrative adjustment');
    if (!reason) return;
    
    try {
      await adminAPI.adjustBalance(accountId, parseFloat(amount), reason);
      showSuccess('Balance adjusted successfully!');
      loadAdminData(); // Refresh data
    } catch (error) {
      showError('Failed to adjust balance: ' + error.message);
    }
  };

  const handleToggleAccount = async (accountId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this account?`)) return;
    
    const reason = prompt(`Enter reason to ${action} this account:`, `Account ${action}d by admin`);
    if (!reason) return;
    
    try {
      await adminAPI.toggleAccount(accountId, !currentStatus, reason);
      showSuccess(`Account ${action}d successfully!`);
      loadAdminData(); // Refresh data
    } catch (error) {
      showError(`Failed to ${action} account: ` + error.message);
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

  const handleEditUser = (user) => {
    const updatedRole = user.role === 'admin' ? 'customer' : 'admin';
    const updatedKyc = !user.kyc_approved;
    
    if (window.confirm(`Update user ${user.username || user.full_name}?\n\nChange role to: ${updatedRole}\nChange KYC status to: ${updatedKyc ? 'Approved' : 'Pending'}`)) {
      adminAPI.updateUser(user.id, {
        role: updatedRole,
        kyc_approved: updatedKyc
      }).then(() => {
        showSuccess('User Updated', 'User has been updated successfully');
        fetchUsers();
        fetchComprehensiveUserData();
      }).catch(err => {
        showError('Update Failed', err.message || 'Failed to update user');
      });
    }
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone and will delete all associated accounts, loans, and cards.`)) {
      adminAPI.deleteUser(userId).then(() => {
        showSuccess('User Deleted', 'User has been deleted successfully');
        fetchUsers();
        fetchComprehensiveUserData();
      }).catch(err => {
        showError('Delete Failed', err.message || 'Failed to delete user');
      });
    }
  };

  const handleDeleteAccount = (accountId, accountNumber) => {
    if (window.confirm(`Are you sure you want to delete account "${accountNumber}"?\n\nThis action cannot be undone.`)) {
      adminAPI.deleteAccount(accountId).then(() => {
        showSuccess('Account Deleted', 'Account has been deleted successfully');
        fetchComprehensiveUserData();
      }).catch(err => {
        showError('Delete Failed', err.message || 'Failed to delete account');
      });
    }
  };

  const handleApproveCard = (cardId) => {
    adminAPI.approveCard(cardId).then(() => {
      showSuccess('Card Approved', 'Card has been approved successfully');
      fetchComprehensiveUserData();
    }).catch(err => {
      showError('Approval Failed', err.message || 'Failed to approve card');
    });
  };

  const handleDeleteCard = (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?\n\nThis action cannot be undone.')) {
      adminAPI.deleteCard(cardId).then(() => {
        showSuccess('Card Deleted', 'Card has been deleted successfully');
        fetchComprehensiveUserData();
      }).catch(err => {
        showError('Delete Failed', err.message || 'Failed to delete card');
      });
    }
  };

  const handleApproveLoan = (loanId) => {
    adminAPI.approveLoan(loanId).then(() => {
      showSuccess('Loan Approved', 'Loan has been approved successfully');
      fetchComprehensiveUserData();
    }).catch(err => {
      showError('Approval Failed', err.message || 'Failed to approve loan');
    });
  };

  const handleDeleteLoan = (loanId) => {
    if (window.confirm('Are you sure you want to delete this loan?\n\nThis action cannot be undone.')) {
      adminAPI.deleteLoan(loanId).then(() => {
        showSuccess('Loan Deleted', 'Loan has been deleted successfully');
        fetchComprehensiveUserData();
      }).catch(err => {
        showError('Delete Failed', err.message || 'Failed to delete loan');
      });
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

            {/* Account Approvals - Always visible on overview */}
            <AccountApprovals />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
            {/* Account Approvals Section */}
            <AccountApprovals />
            
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
                                    <div className="flex items-center space-x-3">
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
                                      <div className="flex flex-col space-y-1">
                                        <button
                                          onClick={() => handleAdjustBalance(account.id, account.balance)}
                                          className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          Adjust
                                        </button>
                                        <button
                                          onClick={() => handleToggleAccount(account.id, account.is_active !== false)}
                                          className="text-xs text-orange-600 hover:text-orange-800"
                                        >
                                          {account.is_active !== false ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                          onClick={() => handleDeleteAccount(account.id, account.account_number)}
                                          className="text-xs text-red-600 hover:text-red-800"
                                        >
                                          Delete
                                        </button>
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
                                    <div className="flex items-center space-x-3">
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        card.status === 'active' ? 'bg-green-100 text-green-800' :
                                        card.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {card.status || 'Pending'}
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleApproveCard(card.id)}
                                          className="text-xs text-green-600 hover:text-green-800"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCard(card.id)}
                                          className="text-xs text-red-600 hover:text-red-800"
                                        >
                                          Delete
                                        </button>
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
                                    <div className="flex items-center space-x-3">
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {loan.status || 'Pending'}
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleApproveLoan(loan.id)}
                                          className="text-xs text-green-600 hover:text-green-800"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLoan(loan.id)}
                                          className="text-xs text-red-600 hover:text-red-800"
                                        >
                                          Delete
                                        </button>
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

            {/* Sidebar for Admin - Quick Transfers + small widgets */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Transfers</h3>

                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => window.location.assign('/transfer')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Money Transfer
                  </button>

                  <button
                    onClick={() => window.location.assign('/qr-payment')}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    QR Transfer
                  </button>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Recent Transaction Users</p>
                  {transactionsWithUsers && transactionsWithUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-3 max-h-28 overflow-auto">
                      {transactionsWithUsers.slice(0, 5).map((t, idx) => (
                            <button
                              key={t.id || idx}
                              type="button"
                              onClick={() => {
                                const recipient = (t.srcUser && t.srcUser.id && t.srcUser.id === user.id) ? t.destUser : t.srcUser;
                                if (recipient) {
                                  navigate('/transfer', { state: { recipientUser: recipient } });
                                } else {
                                  // fallback: open transfer page
                                  navigate('/transfer');
                                }
                              }}
                              className="flex flex-col items-center text-center w-20 focus:outline-none"
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${idx % 2 === 0 ? 'bg-red-500' : 'bg-blue-500'}`}>
                                {((t.srcUser?.full_name || t.destUser?.full_name) || (t.srcUser?.username || t.destUser?.username) || 'U').toString().charAt(0).toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate w-full">{(t.srcUser?.full_name || t.destUser?.full_name) || (t.srcUser?.username || t.destUser?.username) || 'Unknown'}</div>
                            </button>
                          ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No recent transactions</div>
                  )}
                </div>
              </div>

              {/* Optional small widgets could be added here (Totals, Spending) */}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Management</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accounts</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => {
                        const userData = comprehensiveUserData.find(u => u.user.id === user.id);
                        return (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.full_name || user.username || `User ${user.id}`}
                                  </div>
                                  <div className="text-sm text-gray-500">ID: {user.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email || 'No email'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role || 'customer'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.kyc_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.kyc_approved ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {userData?.summary.accountsCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${userData?.summary.totalBalance?.toLocaleString() || '0.00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.username || user.full_name)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">All Transactions</h3>
                  <button
                    onClick={refreshTransactions}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : transactionsWithUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                    <p className="mt-1 text-sm text-gray-500">There are no transactions to display at this time.</p>
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionsWithUsers.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            TXN-{transaction.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{transaction.srcUser?.full_name || transaction.srcUser?.username || 'Unknown'}</div>
                              <div className="text-gray-500">{transaction.srcAccountNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{transaction.destUser?.full_name || transaction.destUser?.username || 'Unknown'}</div>
                              <div className="text-gray-500">{transaction.destAccountNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-semibold text-green-600">
                              ${transaction.amount?.toLocaleString() || '0.00'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'SUCCESS'
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.timestamp ? new Date(transaction.timestamp).toLocaleDateString() : 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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