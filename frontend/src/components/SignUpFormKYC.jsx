import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignUpForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    // Step 1: Basic account info
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    account_type: 'savings',
    
    // Step 2: Personal information
    full_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    nationality: '',
    
    // Step 3: Government ID & Employment
    government_id: '',
    id_type: 'passport',
    occupation: '',
    annual_income: '',
    employer_name: '',
    employment_type: 'employed',
    marital_status: 'single',
    
    // Step 4: Emergency contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('Please fill in all basic account fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return false;
        }
        break;
      case 2:
        if (!formData.full_name || !formData.phone || !formData.date_of_birth || !formData.address || !formData.nationality) {
          setError('Please fill in all personal information fields');
          return false;
        }
        break;
      case 3:
        if (!formData.government_id || !formData.occupation || !formData.annual_income) {
          setError('Please fill in all identification and employment fields');
          return false;
        }
        break;
      case 4:
        if (!formData.emergency_contact_name || !formData.emergency_contact_phone || !formData.emergency_contact_relation) {
          setError('Please fill in all emergency contact fields');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
    setError('');
    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      // Convert annual_income to number
      registrationData.annual_income = parseFloat(registrationData.annual_income);
      
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h3>
            
            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Choose a unique username"
                  required
                />
              </div>
            </div>

            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">mail</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Create a strong password"
                  required
                />
              </div>
            </div>

            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
              <select
                value={formData.account_type}
                onChange={(e) => handleInputChange('account_type', e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
              >
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Enter your full legal name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Enter your full address"
                rows="3"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality *</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="e.g., American, British, Indian"
                  required
                />
              </div>

              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marital Status</label>
                <select
                  value={formData.marital_status}
                  onChange={(e) => handleInputChange('marital_status', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
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
        );

      case 3:
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Identification & Employment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">ID Type *</label>
                <select
                  value={formData.id_type}
                  onChange={(e) => handleInputChange('id_type', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
                >
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="driving_license">Driver's License</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Government ID Number *</label>
                <input
                  type="text"
                  value={formData.government_id}
                  onChange={(e) => handleInputChange('government_id', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your ID number"
                  required
                />
              </div>
            </div>

            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Occupation *</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., Software Engineer, Teacher, Business Owner"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Type</label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => handleInputChange('employment_type', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900"
                >
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Income (USD) *</label>
                <input
                  type="number"
                  value={formData.annual_income}
                  onChange={(e) => handleInputChange('annual_income', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="50000"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Employer Name</label>
              <input
                type="text"
                value={formData.employer_name}
                onChange={(e) => handleInputChange('employer_name', e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Company/Organization name (if applicable)"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Emergency Contact</h3>
            
            <div className="stagger-item">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Name *</label>
              <input
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Full name of emergency contact"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Phone *</label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship *</label>
                <input
                  type="text"
                  value={formData.emergency_contact_relation}
                  onChange={(e) => handleInputChange('emergency_contact_relation', e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Parent, Spouse, Sibling, Friend"
                  required
                />
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
        );
    }
  };

  return (
    <div className="min-h-screen flex form-slide-up">
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
            <h1 className="text-4xl font-bold mb-2">Nyord Bank</h1>
            <p className="text-xl text-white/80">Secure KYC Registration</p>
          </div>
          
          {/* Progress Indicator */}
          <div className="w-full max-w-md mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-white/70">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Labels */}
          <div className="space-y-4 text-center">
            <div className={`flex items-center space-x-3 ${currentStep >= 1 ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-white text-purple-600' : 'bg-white/20'}`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span>Account Setup</span>
            </div>
            <div className={`flex items-center space-x-3 ${currentStep >= 2 ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-white text-purple-600' : 'bg-white/20'}`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span>Personal Info</span>
            </div>
            <div className={`flex items-center space-x-3 ${currentStep >= 3 ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-white text-purple-600' : 'bg-white/20'}`}>
                {currentStep > 3 ? '✓' : '3'}
              </div>
              <span>ID & Employment</span>
            </div>
            <div className={`flex items-center space-x-3 ${currentStep >= 4 ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-white text-purple-600' : 'bg-white/20'}`}>
                {currentStep > 4 ? '✓' : '4'}
              </div>
              <span>Emergency Contact</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="max-w-md w-full fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8 stagger-item">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mb-4">
              <span className="text-white text-2xl font-bold">N</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Nyord Bank</h1>
          </div>
          
          {/* Form Header */}
          <div className="mb-8 stagger-item">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">KYC Registration</h2>
            <p className="text-gray-600">Complete your profile for account verification</p>
          </div>
          
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg">
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-2">error</span>
                  {error}
                </div>
              </div>
            )}
            
            <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
              {renderStep()}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                  >
                    Previous
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 focus:ring-4 focus:ring-purple-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed btn-hover-scale stagger-item ${currentStep === 1 ? 'ml-auto' : ''}`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {currentStep === totalSteps ? 'Submitting...' : 'Please wait...'}
                    </div>
                  ) : (
                    currentStep === totalSteps ? 'Submit Application' : 'Next Step'
                  )}
                </button>
              </div>
            </form>
            
            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  to="/signin" 
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;