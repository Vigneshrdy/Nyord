import { useEffect, useState } from 'react';
import { fixedDepositsAPI } from '../services/api';

const FixedDeposits = () => {
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ principal: 10000, rate: 7.0, tenure_months: 12, start_date: new Date().toISOString().slice(0,10) });
  const allowedRates = [7.0, 8.0, 9.0, 10.0];
  const [renewingId, setRenewingId] = useState(null);
  const [renewForm, setRenewForm] = useState({ principal: '', tenure_months: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadFDs();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const loadFDs = async () => {
    setLoading(true);
    try {
      const list = await fixedDepositsAPI.getMyFDs();
      setFds(list || []);
    } catch (err) {
      console.error(err);
      showMessage('error', err.message || 'Failed to load fixed deposits');
    } finally {
      setLoading(false);
    }
  };

  const calculateMaturityAmount = (principal, rate, tenureMonths) => {
    const years = tenureMonths / 12;
    return +(principal * Math.pow(1 + rate / 100, years)).toFixed(2);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        principal: Number(form.principal),
        rate: Number(form.rate),
        tenure_months: Number(form.tenure_months),
        start_date: form.start_date,
      };
      const created = await fixedDepositsAPI.createFD(payload);
      showMessage('success', 'Fixed deposit created');
      setFds((s) => [created, ...s]);
    } catch (err) {
        const beginRenew = (fd) => {
          setRenewingId(fd.id);
          setRenewForm({ principal: fd.principal, tenure_months: fd.tenure_months });
        };

        const submitRenew = async (e) => {
          e.preventDefault();
          if (!renewingId) return;
          try {
            const principal = Number(renewForm.principal);
            const tenureMonths = Number(renewForm.tenure_months);
            const newFd = await fixedDepositsAPI.renewFD(renewingId, principal, tenureMonths);
            showMessage('success', 'Fixed deposit renewed');
            // Update old FD status locally
            setFds((prev) => {
              const updated = prev.map(fd => fd.id === renewingId ? { ...fd, status: 'RENEWED' } : fd);
              return [newFd, ...updated];
            });
            setRenewingId(null);
          } catch (err) {
            showMessage('error', err.message || 'Renewal failed');
          }
        };
      console.error(err);
      showMessage('error', err.message || 'Failed to create FD');
    } finally {
      setCreating(false);
    }
  };

  const totalInvestment = fds.reduce((s, fd) => s + (fd.principal || 0), 0);
  const totalMaturity = fds.reduce((s, fd) => s + (fd.maturity_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Fixed Deposits</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your fixed deposits</p>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-1">Total Investment</div>
            <div className="text-3xl font-bold">${totalInvestment.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 mb-1">Expected Returns</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">${(totalMaturity - totalInvestment).toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 mb-1">Average Rate</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{fds.length ? (fds.reduce((s, f) => s + f.rate, 0) / fds.length).toFixed(2) : '—'}%</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 mb-1">Active FDs</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{fds.length}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Fixed Deposits</h2>
              </div>

              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="space-y-4">
                  {fds.map((fd) => (
                    <div key={fd.id} className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">FD Number</div>
                          <div className="font-bold text-gray-900 dark:text-white text-lg">{fd.fd_number}</div>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">{fd.status}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Principal Amount</div>
                          <div className="font-semibold text-gray-900 dark:text-white">${Number(fd.principal).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Interest Rate</div>
                          <div className="font-semibold text-green-600 dark:text-green-400">{fd.rate}% p.a.</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Maturity Date</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{fd.start_date}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Maturity Date</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{fd.maturity_date}</div>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Maturity Amount</div>
                            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">${Number(fd.maturity_amount).toLocaleString()}</div>
                          </div>
                          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-4xl">account_balance_wallet</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button className="flex-1 py-2 px-4 bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-500 transition-all border border-gray-300 dark:border-gray-500">View Details</button>
                        {fd.status === 'ACTIVE' && (
                          <button onClick={()=>beginRenew(fd)} className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all">Renew FD</button>
                        )}
                      </div>
                      {renewingId === fd.id && (
                        <form onSubmit={submitRenew} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-300">New Principal</label>
                              <input type="number" value={renewForm.principal} onChange={(e)=>setRenewForm({...renewForm, principal:e.target.value})} className="w-full px-2 py-1 rounded border text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-300">New Tenure (months)</label>
                              <input type="number" value={renewForm.tenure_months} onChange={(e)=>setRenewForm({...renewForm, tenure_months:e.target.value})} className="w-full px-2 py-1 rounded border text-sm" />
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Rate remains {fd.rate}%</div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={()=>setRenewingId(null)} className="px-3 py-1 text-sm rounded border">Cancel</button>
                            <button type="submit" className="px-3 py-1 text-sm rounded bg-blue-600 text-white">Confirm Renewal</button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Open New Fixed Deposit</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Principal</label>
                  <input type="number" value={form.principal} onChange={(e)=>setForm({...form, principal: e.target.value})} className="w-full px-3 py-2 rounded-lg border" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Rate (%)</label>
                  <select value={form.rate} onChange={(e)=>setForm({...form, rate: parseFloat(e.target.value)})} className="w-full px-3 py-2 rounded-lg border">
                    {allowedRates.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Tenure (months)</label>
                  <input type="number" value={form.tenure_months} onChange={(e)=>setForm({...form, tenure_months: e.target.value})} className="w-full px-3 py-2 rounded-lg border" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Maturity Date</label>
                  <input type="date" value={form.start_date} onChange={(e)=>setForm({...form, start_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border" />
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{creating ? 'Creating...' : 'Create FD'}</button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedDeposits;
