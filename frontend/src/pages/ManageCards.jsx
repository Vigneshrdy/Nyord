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

  const [visibleCardNumbers, setVisibleCardNumbers] = useState(new Set());
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [changePinCardId, setChangePinCardId] = useState(null);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [changePinLoading, setChangePinLoading] = useState(false);
  const [changePinStep, setChangePinStep] = useState(1); // 1: current, 2: new+confirm
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [viewDetailsCardId, setViewDetailsCardId] = useState(null);
  const [viewDetailsPinInput, setViewDetailsPinInput] = useState('');

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

  const openViewDetailsModal = (cardId) => {
    setViewDetailsCardId(cardId);
    setViewDetailsPinInput('');
    setShowViewDetailsModal(true);
  };

  const handleViewDetailsSubmit = async () => {
    if (!viewDetailsPinInput || viewDetailsPinInput.length !== 4 || !/^\d{4}$/.test(viewDetailsPinInput)) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      await cardsAPI.verifyPin(viewDetailsCardId, viewDetailsPinInput);
      setVisibleCardNumbers(prev => {
        const next = new Set(prev);
        next.add(viewDetailsCardId);
        return next;
      });
      setShowViewDetailsModal(false);
      setViewDetailsPinInput('');
    } catch (e) {
      console.error('Invalid PIN', e);
      alert(e.message || 'Invalid PIN');
    }
  };

  const hideCardDetails = (cardId) => {
    setVisibleCardNumbers(prev => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  };

  const openChangePinModal = (cardId) => {
    setChangePinCardId(cardId);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmNewPinInput('');
    setChangePinStep(1);
    setShowChangePinModal(true);
  };

  const handleChangePinNext = () => {
    if (!currentPinInput || currentPinInput.length !== 4 || !/^\d{4}$/.test(currentPinInput)) {
      alert('Enter your current 4-digit PIN');
      return;
    }
    // Verify current PIN against backend
    (async () => {
      try {
        await cardsAPI.verifyPin(changePinCardId, currentPinInput);
        setChangePinStep(2);
      } catch (e) {
        console.error('Invalid current PIN', e);
        alert(e.message || 'Invalid current PIN');
      }
    })();
  };

  const handleChangePinSubmit = async () => {
    if (!newPinInput || newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      alert('Enter a new valid 4-digit PIN');
      return;
    }
    if (confirmNewPinInput !== newPinInput) {
      alert('New PIN and confirmation do not match');
      return;
    }
    try {
      setChangePinLoading(true);
      await cardsAPI.changePin(changePinCardId, currentPinInput, newPinInput);
      setShowChangePinModal(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmNewPinInput('');
      alert('PIN updated successfully');
    } catch (e) {
      console.error('Failed to change PIN', e);
      alert(e.message || 'Failed to change PIN');
    } finally {
      setChangePinLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Cards</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your cards and settings</p>
        </div>

        <div className="space-y-8">
          {/* Card Display */}
          <div className="space-y-8">
            {/* Cards Grid */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`relative w-full aspect-[1.586/1] bg-gradient-to-br ${card.gradient_colors || 'from-indigo-600 via-purple-600 to-pink-600'} rounded-2xl shadow-xl p-6 text-white transition-all duration-300 hover:shadow-2xl cursor-pointer overflow-hidden ${
                      activeCard === idx ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900' : ''
                    }`}
                    onClick={() => setActiveCard(idx)}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-24 -translate-x-24"></div>
                    </div>
                    {/* Card Content - Relative to stay above background */}
                    <div className="relative h-full flex flex-col justify-between">
                      {/* Top Section */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs opacity-70 mb-0.5 uppercase tracking-wider">Card Type</div>
                          <div className="text-base font-bold">{card.card_type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {visibleCardNumbers.has(card.id) ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); hideCardDetails(card.id); }}
                              className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 transition-all"
                              title="Hide card details"
                            >
                              <span className="material-symbols-outlined text-lg">visibility_off</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openViewDetailsModal(card.id); }}
                              className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 transition-all"
                              title="View card details (requires PIN)"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                          )}
                          <span className="material-symbols-outlined text-3xl opacity-90">contactless</span>
                        </div>
                      </div>
                      
                      {/* Middle Section - Card Number */}
                      <div className="my-auto">
                        <div className="text-xl font-mono font-bold tracking-widest mb-1">
                          {visibleCardNumbers.has(card.id) ? card.card_number : maskCardNumber(card.card_number)}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="material-symbols-outlined text-sm opacity-70">account_balance_wallet</span>
                          <span className="text-xs opacity-80">Available: ${(card.available_credit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Bottom Section */}
                      <div className="flex justify-between items-end text-sm">
                        <div className="flex-1">
                          <div className="text-[10px] opacity-70 mb-0.5 uppercase tracking-wider">Card Holder</div>
                          <div className="font-semibold truncate pr-2">{card.card_holder}</div>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <div className="text-[10px] opacity-70 mb-0.5 uppercase tracking-wider">Expires</div>
                            <div className="font-semibold">{card.expiry_date}</div>
                          </div>
                          <div>
                            <div className="text-[10px] opacity-70 mb-0.5 uppercase tracking-wider">CVV</div>
                            <div className="font-semibold font-mono">{visibleCardNumbers.has(card.id) ? (card.cvv || '***') : '***'}</div>
                          </div>
                        </div>
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
                      <button onClick={() => openChangePinModal(card.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-sm font-medium">
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
        </div>

        {/* View Card Details PIN Modal */}
        {showViewDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
              <div className="flex items-center mb-4">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-3">lock</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Verify PIN
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter your 4-digit card PIN to view full card number and CVV.
              </p>
              <input
                type="password"
                maxLength={4}
                value={viewDetailsPinInput}
                onChange={(e) => setViewDetailsPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleViewDetailsSubmit()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowViewDetailsModal(false); setViewDetailsPinInput(''); }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleViewDetailsSubmit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Change PIN Modal */}
        {showChangePinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Change Card PIN</h3>
              {changePinStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter current PIN"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => { setShowChangePinModal(false); setCurrentPinInput(''); setNewPinInput(''); setConfirmNewPinInput(''); }}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePinNext}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter new PIN"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={confirmNewPinInput}
                      onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Re-enter new PIN"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => { setShowChangePinModal(false); setCurrentPinInput(''); setNewPinInput(''); setConfirmNewPinInput(''); }}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePinSubmit}
                      disabled={changePinLoading}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60"
                    >
                      {changePinLoading ? 'Updating...' : 'Update PIN'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCards;
