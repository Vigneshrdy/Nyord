import React, { useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { dashboardAPI, transactionsAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

const backendMatplotlibUrl = 'http://localhost:8000/stats/matplotlib.png';

const Statistics = () => {
  const [matplotlibLoaded, setMatplotlibLoaded] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [barData, setBarData] = useState(null);
  const [pieData, setPieData] = useState(null);
  const [lineData, setLineData] = useState(null);

  // helper to build colors
  const COLORS = ['#4c9f70', '#d95f02', '#7570b3', '#1b9e77', '#e7298a', '#66c2a5', '#fc8d62'];

  useEffect(() => {
    const img = new Image();
    img.onload = () => setMatplotlibLoaded(true);
    img.onerror = () => setMatplotlibLoaded(false);
    img.src = backendMatplotlibUrl + '?_=' + Date.now();

    // Fetch dashboard summary and transactions to populate charts dynamically
    (async () => {
      try {
        const summary = await dashboardAPI.getSummary();
        setAccounts(summary.accounts || []);

        // Fetch full transactions list for user
        const txns = await transactionsAPI.getMyTransactions();
        setTransactions(txns || []);

        const accountIds = (summary.accounts || []).map(a => a.id);

        // Aggregate spending to counterparties (only debits)
        const spendingByRecipient = {};
        const monthlyTotals = {}; // YYYY-MM -> total

        (txns || []).forEach(t => {
          const isDebit = accountIds.includes(t.src_account);
          if (t.status !== 'SUCCESS') return; // only count completed

          // Monthly totals for trend (use timestamp)
          let month = 'Unknown';
          try {
            month = new Date(t.timestamp).toLocaleString('default', { month: 'short', year: 'numeric' });
          } catch (e) {}

          if (isDebit) {
            const recipient = t.dest_user_name || t.description || `Acct ${t.dest_account}`;
            spendingByRecipient[recipient] = (spendingByRecipient[recipient] || 0) + Number(t.amount || 0);
            monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(t.amount || 0);
          }
        });

        // Prepare bar/pie datasets from top recipients
        const recipients = Object.keys(spendingByRecipient).sort((a,b) => spendingByRecipient[b]-spendingByRecipient[a]);
        const topRecipients = recipients.slice(0, 6);
        const topValues = topRecipients.map(r => spendingByRecipient[r]);

        setBarData({
          labels: topRecipients,
          datasets: [{ label: 'Spent (USD)', data: topValues, backgroundColor: topRecipients.map((_,i)=>COLORS[i%COLORS.length]) }]
        });

        setPieData({
          labels: topRecipients,
          datasets: [{ data: topValues, backgroundColor: topRecipients.map((_,i)=>COLORS[i%COLORS.length]) }]
        });

        // Monthly trend (sorted by month order)
        const months = Object.keys(monthlyTotals).sort((a,b)=> new Date(a) - new Date(b));
        const monthValues = months.map(m => monthlyTotals[m]);
        setLineData({ labels: months, datasets: [{ label: 'Monthly Spending', data: monthValues, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', fill: true }] });

      } catch (err) {
        console.error('Failed to load stats data', err);
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Statistics & Insights</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
          <h3 className="font-semibold mb-2">Top Recipients (Bar)</h3>
          {barData ? <Bar data={barData} /> : <div className="text-sm text-gray-500">Loading...</div>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
          <h3 className="font-semibold mb-2">Spending Distribution (Pie)</h3>
          {pieData ? <Pie data={pieData} /> : <div className="text-sm text-gray-500">Loading...</div>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow mb-6">
        <h3 className="font-semibold mb-2">Recent Trend (Monthly)</h3>
        {lineData ? <Line data={lineData} /> : <div className="text-sm text-gray-500">Loading...</div>}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
        <h3 className="font-semibold mb-2">Server-generated Matplotlib Snapshot</h3>
        <p className="text-sm text-gray-500 mb-2">This image is produced by a backend endpoint using matplotlib (PNG).</p>
        {matplotlibLoaded ? (
          <img src={backendMatplotlibUrl} alt="matplotlib snapshot" className="w-full rounded" />
        ) : (
          <div className="text-sm text-gray-500">Matplotlib image unavailable or loading. Ensure backend has `matplotlib` installed.</div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
