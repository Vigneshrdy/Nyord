import { useState, useEffect, useRef } from 'react';

const Help = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const faqs = [
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking on "Forgot Password" on the sign-in page and following the instructions sent to your email.',
    },
    {
      category: 'account',
      question: 'How do I update my contact information?',
      answer: 'Go to Profile & Settings, select Personal Info, update your details, and click Save Changes.',
    },
    {
      category: 'transactions',
      question: 'How long do transfers take?',
      answer: 'Instant transfers are processed immediately. Standard transfers may take 1-3 business days.',
    },
    {
      category: 'transactions',
      question: 'What are the transfer limits?',
      answer: 'Daily transfer limit is $10,000 for instant transfers and $50,000 for standard transfers.',
    },
    {
      category: 'cards',
      question: 'How do I block my card?',
      answer: 'Go to Manage Cards, select your card, and click on the "Block Card" quick action button.',
    },
    {
      category: 'cards',
      question: 'How do I request a new card?',
      answer: 'Navigate to Manage Cards and click on "Request New Card" button to apply for a new card.',
    },
    {
      category: 'security',
      question: 'Is my information secure?',
      answer: 'Yes, we use bank-level 256-bit encryption and two-factor authentication to protect your data.',
    },
    {
      category: 'security',
      question: 'How do I enable two-factor authentication?',
      answer: 'Go to Profile & Settings > Security and toggle on the Two-Factor Authentication option.',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
            <span className="material-symbols-outlined text-white text-4xl">help</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How can we help you?</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">Find answers to common questions or contact our support team</p>
        </div>

        {/* Search Bar with Suggestions */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
            />
            {showSuggestions && searchQuery && (
              <div className="absolute z-10 left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {faqs
                  .filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 8)
                  .map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearchQuery(f.question);
                        setShowSuggestions(false);
                        // Optionally scroll to the matching FAQ
                        const idx = filteredFaqs.findIndex(ff => ff.question === f.question);
                        if (idx >= 0) {
                          // no-op; details are filtered and shown
                        }
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 mr-2 align-middle">help_center</span>
                      <span className="align-middle text-gray-800 dark:text-gray-200">{f.question}</span>
                    </button>
                  ))}
                {faqs.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">No matching FAQs</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: 'support_agent', title: 'Live Chat', desc: 'Chat with our support team', color: 'blue' },
            { icon: 'mail', title: 'Email Support', desc: 'support@nyord.com', color: 'purple' },
            { icon: 'phone', title: 'Call Us', desc: '1-800-NYORD-HELP', color: 'green' },
          ].map((action, idx) => (
            <div key={idx} className={`p-6 rounded-2xl bg-gradient-to-br from-${action.color}-50 to-${action.color}-100 dark:from-${action.color}-900/20 dark:to-${action.color}-900/10 hover:shadow-xl transition-all cursor-pointer border border-${action.color}-200 dark:border-${action.color}-800`}>
              <div className={`w-14 h-14 bg-${action.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                <span className="material-symbols-outlined text-white text-3xl">{action.icon}</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{action.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{action.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg h-fit">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Categories</h2>
            
            <div className="space-y-2">
              {[
                { id: 'all', label: 'All Topics', icon: 'folder' },
                { id: 'account', label: 'Account', icon: 'person' },
                { id: 'transactions', label: 'Transactions', icon: 'swap_horiz' },
                { id: 'cards', label: 'Cards', icon: 'credit_card' },
                { id: 'security', label: 'Security', icon: 'security' },
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined mr-3 text-lg">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Frequently Asked Questions
              </h2>
              
              {filteredFaqs.length > 0 ? (
                <div className="space-y-4">
                  {filteredFaqs.map((faq, idx) => (
                    <details key={idx} className="group">
                      <summary className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all">
                        <h3 className="font-semibold text-gray-900 dark:text-white pr-4">{faq.question}</h3>
                        <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform">
                          expand_more
                        </span>
                      </summary>
                      <div className="mt-2 px-4 py-3 text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">search_off</span>
                  <p className="text-gray-600 dark:text-gray-400">No results found. Try a different search term.</p>
                </div>
              )}
            </div>

            {/* ConvAI widget is available globally — open the assistant using the chat button in the bottom-right */}



          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
