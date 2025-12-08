import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Users, CreditCard, Building2, DollarSign, Calendar, Activity } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const AdminStatistics = () => {
  const [timeframe, setTimeframe] = useState('monthly'); // 'weekly' or 'monthly'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalLoans: 0,
    totalCards: 0,
    totalTransactions: 0,
    accountsThisWeek: 0,
    accountsThisMonth: 0,
    loansThisWeek: 0,
    loansThisMonth: 0,
    cardsThisWeek: 0,
    cardsThisMonth: 0
  });
  const [detailedStats, setDetailedStats] = useState(null);
  const [transactionStats, setTransactionStats] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch basic stats
      const statsResponse = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const statsData = await statsResponse.json();
      
      // Fetch detailed statistics
      const detailedResponse = await fetch(`${API_BASE_URL}/admin/statistics/detailed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const detailedData = await detailedResponse.json();
      
      // Fetch transaction statistics
      const transactionResponse = await fetch(`${API_BASE_URL}/admin/statistics/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const transactionData = await transactionResponse.json();
      
      setStats({
        totalAccounts: statsData.total_accounts,
        totalLoans: statsData.total_loans,
        totalCards: statsData.total_cards,
        totalTransactions: statsData.total_transactions,
        accountsThisWeek: detailedData.weeklyStats.accounts,
        accountsThisMonth: detailedData.monthlyStats.accounts,
        loansThisWeek: detailedData.weeklyStats.loans,
        loansThisMonth: detailedData.monthlyStats.loans,
        cardsThisWeek: detailedData.weeklyStats.cards,
        cardsThisMonth: detailedData.monthlyStats.cards
      });
      
      setDetailedStats(detailedData);
      setTransactionStats(transactionData);
    } catch (error) {
      console.error('Failed to fetch statistics', error);
    } finally {
      setLoading(false);
    }
  };

  // Get chart data from API responses
  const weeklyAccountsData = detailedStats?.dailyAccounts || [];
  const monthlyAccountsData = detailedStats?.monthlyData || [];
  
  const accountTypeData = (detailedStats?.accountTypes || []).map((item, idx) => ({
    name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
    value: item.value,
    color: ['#3b82f6', '#10b981', '#f59e0b'][idx % 3]
  }));

  const loanTypeData = (detailedStats?.loanTypes || []).map((item, idx) => ({
    name: item.name,
    value: item.value,
    color: ['#8b5cf6', '#ec4899', '#06b6d4'][idx % 3]
  }));

  const cardTypeData = (detailedStats?.cardTypes || []).map((item, idx) => ({
    name: item.name,
    value: item.value,
    color: ['#6366f1', '#f59e0b', '#94a3b8', '#000000'][idx % 4]
  }));

  const approvalRateData = detailedStats ? [
    { 
      name: 'Accounts', 
      approved: detailedStats.approvalRates.accounts.approved, 
      rejected: detailedStats.approvalRates.accounts.rejected 
    },
    { 
      name: 'Loans', 
      approved: detailedStats.approvalRates.loans.approved, 
      rejected: detailedStats.approvalRates.loans.rejected 
    },
    { 
      name: 'Cards', 
      approved: detailedStats.approvalRates.cards.approved, 
      rejected: detailedStats.approvalRates.cards.rejected 
    }
  ] : [];

  const userGrowthData = detailedStats?.userGrowth || [];
  
  const dailyTransactionData = transactionStats?.dailyTransactions || [];

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value.toLocaleString()}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Statistics</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics and insights</p>
        </div>

        {/* Timeframe Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Accounts"
            value={stats.totalAccounts}
            change={12}
            icon={Building2}
            color="bg-blue-600"
          />
          <StatCard
            title="Total Loans"
            value={stats.totalLoans}
            change={8}
            icon={DollarSign}
            color="bg-green-600"
          />
          <StatCard
            title="Total Cards"
            value={stats.totalCards}
            change={15}
            icon={CreditCard}
            color="bg-purple-600"
          />
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions}
            change={-3}
            icon={Activity}
            color="bg-orange-600"
          />
        </div>

        {/* Weekly/Monthly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Accounts {timeframe === 'weekly' ? 'This Week' : 'This Month'}
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {timeframe === 'weekly' ? stats.accountsThisWeek : stats.accountsThisMonth}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Loans {timeframe === 'weekly' ? 'This Week' : 'This Month'}
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {timeframe === 'weekly' ? stats.loansThisWeek : stats.loansThisMonth}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cards {timeframe === 'weekly' ? 'This Week' : 'This Month'}
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {timeframe === 'weekly' ? stats.cardsThisWeek : stats.cardsThisMonth}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Chart 1: Accounts, Loans & Cards Over Time */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {timeframe === 'weekly' ? 'Weekly' : 'Monthly'} Approvals Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeframe === 'weekly' ? weeklyAccountsData : monthlyAccountsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="accounts" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Accounts" />
                <Area type="monotone" dataKey="loans" stackId="1" stroke="#10b981" fill="#10b981" name="Loans" />
                <Area type="monotone" dataKey="cards" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Cards" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2 & 3: Account Types & Loan Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Types Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={accountTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {accountTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Types Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={loanTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {loanTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Card Types */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Card Types Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Cards Issued">
                  {cardTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 5: Daily Transactions (Last 30 Days) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Transactions (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyTransactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Transaction Count" />
                <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Total Amount ($)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 6: Transaction Types Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Types (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyTransactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="transfers" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Transfers" />
                <Area type="monotone" dataKey="deposits" stackId="1" stroke="#10b981" fill="#10b981" name="Deposits" />
                <Area type="monotone" dataKey="withdrawals" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Withdrawals" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 6: Approval Rates */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Approval Rates</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={approvalRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#10b981" name="Approved %" />
                <Bar dataKey="rejected" fill="#ef4444" name="Rejected %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 7: User Growth */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="users" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="Total Users" />
                <Area type="monotone" dataKey="active" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Active Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 8: Comparison Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {timeframe === 'weekly' ? 'Weekly' : 'Monthly'} Performance Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeframe === 'weekly' ? weeklyAccountsData : monthlyAccountsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accounts" fill="#3b82f6" name="Accounts" />
                <Bar dataKey="loans" fill="#10b981" name="Loans" />
                <Bar dataKey="cards" fill="#8b5cf6" name="Cards" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;
