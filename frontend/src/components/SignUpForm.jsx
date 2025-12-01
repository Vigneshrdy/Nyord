import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/auth-animations.css';

const SignUpForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    // Basic account info
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    account_type: 'savings',
    
    // Personal information (required for KYC)
    full_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    nationality: '',
    
    // Government ID information (required for KYC)
    government_id: '',
    id_type: 'passport',
    
    // Employment information (required for KYC)
    occupation: '',
    annual_income: '',
    employer_name: '',
    employment_type: 'employed',
    
    // Personal details (required for KYC)
    marital_status: 'single',
    
    // Emergency contact (required for KYC)
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate required KYC fields
    const requiredFields = [
      'full_name', 'phone', 'date_of_birth', 'address', 'nationality',
      'government_id', 'occupation', 'annual_income',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation'
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        setError(`Please fill in the ${field.replace('_', ' ')} field`);
        return;
      }
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      // Convert annual_income to number
      registrationData.annual_income = parseFloat(registrationData.annual_income);
      // Set role as customer
      registrationData.role = 'customer';
      
      await register(registrationData);
      
      // Show success message for pending approval
      alert('Registration successful! Your account is pending admin approval. You will be notified once your KYC is verified.');
      navigate('/signin');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex form-slide-up overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 relative overflow-hidden gradient-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-32 left-16 w-28 h-28 bg-white/10 rounded-full blur-xl float"></div>
        <div className="absolute top-20 right-24 w-36 h-36 bg-white/5 rounded-full blur-lg float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl float" style={{ animationDelay: '4s' }}></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full">
          {/* Logo */}
          <div className="mb-8 transform transition-all duration-700 hover:scale-105">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30 mb-6">
              <span className="text-4xl font-bold">N</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Join Nyord Bank</h1>
            <p className="text-xl text-white/80">Start Your Digital Banking Journey</p>
          </div>
          
          {/* Benefits */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-center space-x-4 transform transition-all duration-500 hover:translate-x-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Free Account Opening</h3>
                <p className="text-white/70 text-sm">No hidden fees, transparent pricing</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 transform transition-all duration-500 hover:translate-x-2 delay-75">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined text-2xl">contactless</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Instant Digital Card</h3>
                <p className="text-white/70 text-sm">Get your virtual card immediately</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 transform transition-all duration-500 hover:translate-x-2 delay-150">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined text-2xl">savings</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">High Interest Rates</h3>
                <p className="text-white/70 text-sm">Earn more on your savings account</p>
              </div>
            </div>
          </div>
          
          {/* Testimonial */}
          <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 max-w-md transform transition-all duration-500 hover:scale-105">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="material-symbols-outlined text-lg">person</span>
              </div>
              <div>
                <div className="font-semibold">Sarah Johnson</div>
                <div className="text-white/70 text-sm">Verified Customer</div>
              </div>
            </div>
            <p className="text-white/90 text-sm italic">
              "Best banking experience I've ever had. The app is intuitive and transfers are lightning fast!"
            </p>
            <div className="flex mt-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-symbols-outlined text-yellow-400 text-lg animate-pulse" style={{animationDelay: `${i * 0.1}s`}}>star</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 bg-gray-50 overflow-y-auto h-screen">
        <div className="p-8">
          <div className="max-w-md w-full mx-auto fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8 stagger-item">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mb-4">
              <span className="text-white text-2xl font-bold">N</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Nyord Bank</h1>
          </div>
          
          {/* Form Header */}
          <div className="mb-8 stagger-item">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Join thousands of satisfied customers today</p>
          </div>
          
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl mb-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg animate-shake">
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-2">error</span>
                  {error}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="transform transition-all duration-300 focus-within:scale-105 stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">person</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500 input-focus-glow"
                    placeholder="Choose a unique username"
                    required
                  />
                </div>
              </div>
              
              <div className="transform transition-all duration-300 focus-within:scale-105">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">mail</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="transform transition-all duration-300 focus-within:scale-105">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">account_balance</span>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
                    required
                  >
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                  </select>
                </div>
              </div>
              
              <div className="transform transition-all duration-300 focus-within:scale-105">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">lock</span>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
              </div>
              
              <div className="transform transition-all duration-300 focus-within:scale-105">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">lock</span>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              {/* KYC Information Section */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information (KYC)</h3>
                
                <div className="transform transition-all duration-300 focus-within:scale-105">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">person</span>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Enter your full legal name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">phone</span>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">calendar_today</span>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="transform transition-all duration-300 focus-within:scale-105 mt-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-4 text-gray-400 transition-colors duration-200">home</span>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Enter your full address"
                      rows="3"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nationality *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">public</span>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="e.g., American, British, Indian"
                        required
                      />
                    </div>
                  </div>

                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Marital Status
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">group</span>
                      <select
                        value={formData.marital_status}
                        onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
                      >
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Government ID Section */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Government ID & Employment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ID Type *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">badge</span>
                      <select
                        value={formData.id_type}
                        onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
                      >
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID</option>
                        <option value="driving_license">Driver's License</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Government ID Number *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">credit_card</span>
                      <input
                        type="text"
                        value={formData.government_id}
                        onChange={(e) => setFormData({ ...formData, government_id: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="Enter your ID number"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="transform transition-all duration-300 focus-within:scale-105 mt-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Occupation *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">work</span>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="e.g., Software Engineer, Teacher, Business Owner"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">business_center</span>
                      <select
                        value={formData.employment_type}
                        onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
                      >
                        <option value="employed">Employed</option>
                        <option value="self_employed">Self Employed</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="student">Student</option>
                        <option value="retired">Retired</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Annual Income (USD) *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">attach_money</span>
                      <input
                        type="number"
                        value={formData.annual_income}
                        onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="50000"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="transform transition-all duration-300 focus-within:scale-105 mt-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Employer Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">domain</span>
                    <input
                      type="text"
                      value={formData.employer_name}
                      onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Company/Organization name (if applicable)"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                
                <div className="transform transition-all duration-300 focus-within:scale-105">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Emergency Contact Name *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">contact_emergency</span>
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Full name of emergency contact"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Emergency Contact Phone *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">phone</span>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="transform transition-all duration-300 focus-within:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Relationship *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">family_restroom</span>
                      <input
                        type="text"
                        value={formData.emergency_contact_relation}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="e.g., Parent, Spouse, Sibling, Friend"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-blue-600 mr-3 mt-1">info</span>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-2">KYC Verification Required</p>
                      <p>Your account will be reviewed by our admin team for KYC compliance. You'll receive an email notification once your account is approved and activated.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Terms Agreement */}
              <div className="flex items-start">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1 transition-all duration-200" 
                  required
                />
                <label className="ml-3 text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-purple-600 hover:text-purple-500 font-medium transition-colors duration-200 hover:underline">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-purple-600 hover:text-purple-500 font-medium transition-colors duration-200 hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 focus:ring-4 focus:ring-purple-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none btn-hover-scale stagger-item"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
            
            {/* Social Signup */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>
                
                <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="ml-2">Facebook</span>
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  to="/signin" 
                  className="font-medium text-purple-600 hover:text-purple-500 transition-all duration-200 hover:underline transform hover:scale-105 inline-block"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
          </div>
          
          {/* Security Notice */}
          <div className="mt-8 flex items-center justify-center text-sm text-gray-500 mb-8">
            <span className="material-symbols-outlined text-green-500 mr-2 animate-pulse">verified_user</span>
            <span>Your data is protected with bank-level security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;