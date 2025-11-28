import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getSummary();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    total_balance = 0,
    balance_change_percent = 0,
    monthly_income = 0,
    income_change_percent = 0,
    monthly_expenses = 0,
    expense_change_percent = 0,
    accounts = [],
    recent_transactions = [],
  } = dashboardData || {};

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your financial overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-4xl opacity-80">account_balance_wallet</span>
              <span className={`text-sm px-3 py-1 rounded-full ${
                balance_change_percent >= 0 
                  ? 'bg-white/20' 
                  : 'bg-red-500/30'
              }`}>
                {balance_change_percent >= 0 ? '+' : ''}{balance_change_percent.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm opacity-90 mb-1">Total Balance</div>
            <div className="text-3xl font-bold">{formatCurrency(total_balance)}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-4xl text-green-500">trending_up</span>
              <span className={`text-sm px-3 py-1 rounded-full ${
                income_change_percent >= 0
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
              }`}>
                {income_change_percent >= 0 ? '+' : ''}{income_change_percent.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Income</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(monthly_income)}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-4xl text-red-500">trending_down</span>
              <span className={`text-sm px-3 py-1 rounded-full ${
                expense_change_percent <= 0
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
              }`}>
                {expense_change_percent.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Expenses</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(monthly_expenses)}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Accounts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Accounts</h2>
                <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">View All</button>
              </div>
              
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-50">account_balance</span>
                  <p>No accounts found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          account.account_type === 'savings' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          account.account_type === 'current' ? 'bg-green-100 dark:bg-green-900/30' :
                          'bg-purple-100 dark:bg-purple-900/30'
                        }`}>
                          <span className={`material-symbols-outlined ${
                            account.account_type === 'savings' ? 'text-blue-600 dark:text-blue-400' :
                            account.account_type === 'current' ? 'text-green-600 dark:text-green-400' :
                            'text-purple-600 dark:text-purple-400'
                          }`}>
                            account_balance
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {account.account_type === 'savings' ? 'Savings Account' : 
                             account.account_type === 'current' ? 'Current Account' : 'Account'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{account.account_number}</div>
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${account.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(Math.abs(account.balance))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
                <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">View All</button>
              </div>

              {recent_transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-50">receipt_long</span>
                  <p>No recent transactions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent_transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          txn.type === 'credit' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          <span className={`material-symbols-outlined text-sm ${
                            txn.type === 'credit' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {txn.type === 'credit' ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {txn.type === 'credit' ? 'Received' : 'Sent'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(txn.timestamp)} • {txn.status}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        txn.type === 'credit' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/transfer')}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">send</span>
                  <span className="font-medium text-gray-900 dark:text-white">Transfer Money</span>
                </button>
             
                {/* <button className="w-full flex items-center space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  {/* <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">credit_card</span> */}
                  {/* <span className="font-medium text-gray-900 dark:text-white">Pay Bills</span> */}
                {/* </button> */} 
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
