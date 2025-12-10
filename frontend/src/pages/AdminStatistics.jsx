import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Users, CreditCard, Building2, DollarSign, Calendar, Activity, Download } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const AdminStatistics = () => {
  const [timeframe, setTimeframe] = useState('monthly'); // 'weekly' or 'monthly'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [filteredTransactionData, setFilteredTransactionData] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    // apply client-side filtering when transactionStats or dateRange changes
    if (!transactionStats?.dailyTransactions) return setFilteredTransactionData(null);
    const data = transactionStats.dailyTransactions;
    if (!dateRange.start && !dateRange.end) return setFilteredTransactionData(data);

    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;

    const filtered = data.filter(d => {
      const dDate = new Date(d.date);
      if (start && dDate < start) return false;
      if (end && dDate > end) return false;
      return true;
    });
    setFilteredTransactionData(filtered);
  }, [transactionStats, dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError('Failed to load statistics. Please try again or check server logs.');
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
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );

  // Helper: export JSON array to CSV and trigger download
  const exportCsv = (data = [], filename = 'export.csv') => {
    if (!data || !data.length) return alert('No data to export');
    const keys = Object.keys(data[0]);
    const csv = [keys.join(',')].concat(data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: export a single chart (SVG) inside a container to PNG
  const exportChart = (containerId, filename = 'chart.png') => {
    const container = document.getElementById(containerId);
    if (!container) return alert('Chart container not found');

    // pick the largest SVG in the container (buttons/icons also render SVGs)
    const svgs = Array.from(container.querySelectorAll('svg'));
    if (!svgs.length) return alert('No SVG found inside chart container');

    // choose svg with largest bounding rect area
    let svg = svgs[0];
    try {
      let maxArea = 0;
      svgs.forEach(s => {
        const rect = s.getBoundingClientRect();
        const area = (rect.width || 0) * (rect.height || 0);
        if (area > maxArea) {
          maxArea = area;
          svg = s;
        }
      });
    } catch (e) {
      // fall back to first svg
      svg = svgs[0];
    }

    // compute pixel width/height for export
    const rect = svg.getBoundingClientRect();
    const pixelWidth = Math.max(Math.round(rect.width), 800);
    const pixelHeight = Math.max(Math.round(rect.height), 400);

    // clone svg to avoid modifying on-screen element
    const clone = svg.cloneNode(true);

    // ensure namespaces
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!clone.getAttribute('xmlns:xlink')) clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // set explicit width/height so image has proper pixel size
    clone.setAttribute('width', pixelWidth);
    clone.setAttribute('height', pixelHeight);
    // preserve viewBox if present or set it from rect
    if (!clone.getAttribute('viewBox')) {
      clone.setAttribute('viewBox', `0 0 ${pixelWidth} ${pixelHeight}`);
    }

    // inline computed styles for fonts/colors (best-effort)
    const styleSheets = Array.from(document.styleSheets || []);
    let cssText = '';
    for (const sheet of styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) {
          cssText += rule.cssText + '\n';
        }
      } catch (ex) {
        // ignore cross-origin sheets
      }
    }
    if (cssText) {
      const style = document.createElement('style');
      style.innerHTML = `<![CDATA[\n${cssText}\n]]>`;
      clone.insertBefore(style, clone.firstChild);
    }

    const serializer = new XMLSerializer();
    let svgStr = serializer.serializeToString(clone);

    const imgSrc = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    const image = new Image();
    image.onload = function () {
      const canvas = document.createElement('canvas');
      // draw at device pixel ratio for crisper images
      const ratio = window.devicePixelRatio || 1;
      canvas.width = pixelWidth * ratio;
      canvas.height = pixelHeight * ratio;
      canvas.style.width = pixelWidth + 'px';
      canvas.style.height = pixelHeight + 'px';
      const ctx = canvas.getContext('2d');
      // draw white background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.drawImage(image, 0, 0, pixelWidth, pixelHeight);
      canvas.toBlob((blob) => {
        if (!blob) return alert('Failed to generate image');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    image.onerror = function () {
      alert('Failed to export chart image');
    };
    image.src = imgSrc;
  };

  // Derived metrics (best-effort from available data)
  const transactionsDataForView = filteredTransactionData || dailyTransactionData;
  const DAU = transactionsDataForView.length ? transactionsDataForView[transactionsDataForView.length - 1].count : null;
  const MAU = userGrowthData.length ? userGrowthData[userGrowthData.length - 1].active : null; // approximate
  const weeklyVolume = transactionStats?.weeklyVolume ?? null;
  const transactionsPerHourEstimate = weeklyVolume ? Math.round((weeklyVolume / 7) / 24) : null;

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">{error}</p>
          <button onClick={() => fetchStatistics()} className="px-4 py-2 bg-blue-600 text-white rounded">Retry</button>
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

        {/* Date range filter & CSV export */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-300">Start:</label>
          <input type="date" value={dateRange.start || ''} onChange={e => setDateRange(s => ({...s, start: e.target.value || null}))} className="px-3 py-2 rounded border" />
          <label className="text-sm text-gray-600 dark:text-gray-300">End:</label>
          <input type="date" value={dateRange.end || ''} onChange={e => setDateRange(s => ({...s, end: e.target.value || null}))} className="px-3 py-2 rounded border" />
          <button onClick={() => { setDateRange({start: null, end: null}); }} className="px-3 py-2 bg-gray-200 rounded">Clear</button>
          <button onClick={() => exportCsv(filteredTransactionData || dailyTransactionData, 'transactions.csv')} className="px-3 py-2 bg-green-600 text-white rounded">Export CSV</button>
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

        {/* Derived Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <StatCard title="DAU (approx.)" value={DAU ?? 'N/A'} icon={Users} color="bg-indigo-600" />
          <StatCard title="MAU (approx.)" value={MAU ?? 'N/A'} icon={TrendingUp} color="bg-teal-600" />
          <StatCard title="Tx / hr (est)" value={transactionsPerHourEstimate ?? 'N/A'} icon={Activity} color="bg-orange-600" />
          <div className="col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Availability Notes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Some advanced metrics (New vs Returning users, Conversion funnel, Median balances, Top customers, Retention cohorts) require additional backend endpoints or pre-aggregated data. The cards above show best-effort estimates derived from available endpoints.</p>
          </div>
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
          <div id="chart-approvals" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {timeframe === 'weekly' ? 'Weekly' : 'Monthly'} Approvals Overview
              </h3>
              <button onClick={() => exportChart('chart-approvals', 'approvals.png')} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">Export PNG</button>
              <button title="Download chart" onClick={() => exportChart('chart-approvals', 'approvals.png')} className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-md shadow hover:opacity-95" style={{border: '1px solid rgba(255,255,255,0.08)'}}>
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
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
            <div id="chart-account-types" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Types Distribution</h3>
                <button onClick={() => exportChart('chart-account-types', 'account_types.png')} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">Export PNG</button>
                  <button title="Download chart" onClick={() => exportChart('chart-account-types', 'account_types.png')} className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-md shadow hover:opacity-95" style={{border: '1px solid rgba(255,255,255,0.08)'}}>
                    <Download className="w-5 h-5 text-white" />
                  </button>
              </div>
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

            <div id="chart-loan-types" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loan Types Distribution</h3>
                <button onClick={() => exportChart('chart-loan-types', 'loan_types.png')} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">Export PNG</button>
                  <button title="Download chart" onClick={() => exportChart('chart-loan-types', 'loan_types.png')} className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-md shadow hover:opacity-95" style={{border: '1px solid rgba(255,255,255,0.08)'}}>
                    <Download className="w-5 h-5 text-white" />
                  </button>
              </div>
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
          <div id="chart-card-types" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0">Card Types Distribution</h3>
              <button onClick={() => exportChart('chart-card-types', 'card_types.png')} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">Export PNG</button>
              <button title="Download chart" onClick={() => exportChart('chart-card-types', 'card_types.png')} className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-md shadow hover:opacity-95" style={{border: '1px solid rgba(255,255,255,0.08)'}}>
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
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
          <div id="chart-daily-transactions" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Transactions (Last 30 Days)</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => exportChart('chart-daily-transactions', 'daily_transactions.png')} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">Export PNG</button>
                  <button title="Download chart" onClick={() => exportChart('chart-daily-transactions', 'daily_transactions.png')} className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-md shadow hover:opacity-95" style={{border: '1px solid rgba(255,255,255,0.08)'}}>
                    <Download className="w-5 h-5 text-white" />
                  </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={transactionsDataForView}>
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

          {/* Chart 6: Transaction Types Breakdown (render only if breakdown exists) */}
          {transactionsDataForView && transactionsDataForView.length > 0 && transactionsDataForView[0].transfers !== undefined ? (
            <div id="chart-transaction-types" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Types (Last 30 Days)</h3>
                <button onClick={() => exportChart('chart-transaction-types', 'transaction_types.png')} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">Export PNG</button>
                  <button title="Download chart" onClick={() => exportChart('chart-transaction-types', 'transaction_types.png')} className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-md shadow hover:opacity-95" style={{border: '1px solid rgba(255,255,255,0.08)'}}>
                    <Download className="w-5 h-5 text-white" />
                  </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={transactionsDataForView}>
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
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Types (Last 30 Days)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transaction-type breakdown not available from backend. Remove or provide `transaction_type` data on the server to enable this chart.</p>
            </div>
          )}

          {/* Chart 6: Approval Rates */}
          <div id="chart-approval-rates" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0">Approval Rates</h3>
              <button onClick={() => exportChart('chart-approval-rates', 'approval_rates.png')} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">Export PNG</button>
              <button title="Download chart" onClick={() => exportChart('chart-approval-rates', 'approval_rates.png')} className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-md shadow hover:opacity-95" style={{border: '1px solid rgba(255,255,255,0.08)'}}>
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
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
          <div id="chart-user-growth" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0">User Growth Trend</h3>
              <button onClick={() => exportChart('chart-user-growth', 'user_growth.png')} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">Export PNG</button>
              <button title="Download chart" onClick={() => exportChart('chart-user-growth', 'user_growth.png')} className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-md shadow hover:opacity-95" style={{border: '1px solid rgba(255,255,255,0.08)'}}>
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
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
