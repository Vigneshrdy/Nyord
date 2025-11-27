import { useState, useEffect } from 'react';
import { cardsAPI } from '../services/api';

const ManageCards = () => {
  const [activeCard, setActiveCard] = useState(0);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState('Standard');
  const [cardPin, setCardPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalAction, setPinModalAction] = useState(null); // { action: 'block'/'unblock', cardId: number }
  const [pinInput, setPinInput] = useState('');
  const [cardSettings, setCardSettings] = useState({
    onlineTransactions: true,
    contactlessPayments: true,
    internationalUsage: false,
    atmWithdrawals: true,
    notifications: true,
  });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const data = await cardsAPI.getMyCards();
      setCards(data || []);
    } catch (e) {
      console.error('Failed to fetch cards', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCard = async () => {
    if (!cardPin || cardPin.length !== 4 || !/^\d{4}$/.test(cardPin)) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }
    try {
      setRequestLoading(true);
      const newCard = await cardsAPI.requestCard({
        card_type: selectedCardType,
        credit_limit: 0, // Backend will use default based on type
        pin: cardPin,
      });
      setCards([...cards, newCard]);
      setShowRequestForm(false);
      setCardPin('');
      setActiveCard(cards.length); // Select the newly created card
    } catch (e) {
      console.error('Failed to request card', e);
      alert('Failed to request card. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const openPinModal = (action, cardId) => {
    setPinModalAction({ action, cardId });
    setPinInput('');
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    if (!pinInput || pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      const { action, cardId } = pinModalAction;
      let updated;
      if (action === 'block') {
        updated = await cardsAPI.blockCard(cardId, pinInput);
      } else if (action === 'unblock') {
        updated = await cardsAPI.unblockCard(cardId, pinInput);
      }
      setCards(cards.map(c => c.id === updated.id ? updated : c));
      setShowPinModal(false);
      setPinInput('');
    } catch (e) {
      console.error('Failed to process action', e);
      alert(e.message || 'Invalid PIN or action failed');
    }
  };

  const maskCardNumber = (number) => {
    const parts = number.split(' ');
    if (parts.length === 4) {
      return `${parts[0]} **** **** ${parts[3]}`;
    }
    return number;
  };

  const toggleSetting = (settingKey) => {
    setCardSettings(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Cards</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your cards and settings</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Card Display */}
          <div className="lg:col-span-2 space-y-8">
            {/* Card Carousel */}
            <div className="relative">
              {loading ? (
                <div className="w-full h-56 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Loading cards...</p>
                </div>
              ) : cards.length === 0 ? (
                <div className="w-full h-56 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8">
                  <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">credit_card_off</span>
                  <p className="text-gray-500 dark:text-gray-400 text-center mb-4">No cards yet. Request your first card to get started!</p>
                </div>
              ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 w-full sm:w-96 h-56 bg-gradient-to-br ${card.gradient_colors || 'from-gray-600 to-gray-800'} rounded-2xl shadow-2xl p-6 text-white cursor-pointer transform transition-all hover:scale-105 snap-center ${
                      activeCard === idx ? 'ring-4 ring-blue-400 ring-offset-4 dark:ring-offset-gray-900' : ''
                    }`}
                    onClick={() => setActiveCard(idx)}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <div className="text-xs opacity-80 mb-1">Card Type</div>
                        <div className="text-lg font-bold">{card.card_type}</div>
                      </div>
                      <span className="material-symbols-outlined text-4xl">contactless</span>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-2xl font-bold tracking-wider mb-2">{maskCardNumber(card.card_number)}</div>
                      <div className="text-sm opacity-80">Available: ${(card.available_credit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xs opacity-80 mb-1">Card Holder</div>
                        <div className="font-semibold text-sm">{card.card_holder}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-80 mb-1">Expires</div>
                        <div className="font-semibold text-sm">{card.expiry_date}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-80 mb-1">CVV</div>
                        <div className="font-semibold text-sm">***</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
              
              <button onClick={() => setShowRequestForm(true)} className="mt-4 w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all">
                <span className="material-symbols-outlined mr-2">add</span>
                Request New Card
              </button>

              {/* Request Card Modal */}
              {showRequestForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Request New Card</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Type</label>
                        <select value={selectedCardType} onChange={(e) => setSelectedCardType(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                          <option value="Standard">Standard ($5,000 limit)</option>
                          <option value="Gold">Gold ($15,000 limit)</option>
                          <option value="Platinum">Platinum ($25,000 limit)</option>
                          <option value="Premium">Premium ($50,000 limit)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Set 4-Digit PIN</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardPin}
                          onChange={(e) => setCardPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 4-digit PIN"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => { setShowRequestForm(false); setCardPin(''); }} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                      <button onClick={handleRequestCard} disabled={requestLoading} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60">{requestLoading ? 'Requesting...' : 'Request Card'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* All Cards Details */}
            {cards.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">All Cards</h2>
              
              <div className="space-y-6">
                {cards.map((card, idx) => (
                  <div key={card.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-12 h-8 rounded bg-gradient-to-br ${card.gradient_colors || 'from-gray-600 to-gray-800'}`}></div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{card.card_type}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{maskCardNumber(card.card_number)}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Expiry Date</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{card.expiry_date}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                              card.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                              card.status === 'BLOCKED' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {card.status}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Available Credit</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${(card.available_credit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Credit Limit</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${(card.credit_limit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: `${((card.available_credit || 0) / (card.credit_limit || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for each card */}
                    <div className="flex flex-wrap gap-2">
                      {card.status === 'ACTIVE' ? (
                        <button
                          onClick={() => openPinModal('block', card.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-sm font-medium"
                        >
                          <span className="material-symbols-outlined text-lg">block</span>
                          Block Card
                        </button>
                      ) : card.status === 'BLOCKED' ? (
                        <button
                          onClick={() => openPinModal('unblock', card.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all text-sm font-medium"
                        >
                          <span className="material-symbols-outlined text-lg">lock_open</span>
                          Unblock Card
                        </button>
                      ) : null}
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-sm font-medium">
                        <span className="material-symbols-outlined text-lg">pin</span>
                        Change PIN
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>

          {/* Right: Settings & Transactions */}
          <div className="space-y-6">
            {/* Card Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Card Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Online Transactions</span>
                  <button
                    onClick={() => toggleSetting('onlineTransactions')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      cardSettings.onlineTransactions ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        cardSettings.onlineTransactions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Contactless Payments</span>
                  <button
                    onClick={() => toggleSetting('contactlessPayments')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      cardSettings.contactlessPayments ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        cardSettings.contactlessPayments ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">International Usage</span>
                  <button
                    onClick={() => toggleSetting('internationalUsage')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      cardSettings.internationalUsage ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        cardSettings.internationalUsage ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">ATM Withdrawals</span>
                  <button
                    onClick={() => toggleSetting('atmWithdrawals')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      cardSettings.atmWithdrawals ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        cardSettings.atmWithdrawals ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Notifications</span>
                  <button
                    onClick={() => toggleSetting('notifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      cardSettings.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        cardSettings.notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>


           
          </div>
        </div>

        {/* PIN Verification Modal */}
        {showPinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {pinModalAction?.action === 'block' ? 'Block Card' : 'Unblock Card'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter your 4-digit PIN to {pinModalAction?.action} this card.
              </p>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPinModal(false); setPinInput(''); }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePinSubmit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCards;
