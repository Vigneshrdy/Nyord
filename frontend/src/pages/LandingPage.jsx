import { Link } from 'react-router-dom';
import ScrollExpandMedia from '../components/ScrollExpandMedia';
import XapoStyleScroll from '../components/XapoStyleScroll';

const LandingPage = () => {
  return (
    <div className="min-h-screen -mt-16 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Scroll Expand Media Hero Section */}
      <ScrollExpandMedia
        title="Banking Made Simple"
        date="2025"
        scrollToExpand="Scroll to explore our features"
        textBlend={false}
      >
        {/* Content that appears after scroll expansion */}
        <div className="text-center text-white space-y-6">
          <h3 className="text-3xl font-bold">Experience Modern Banking</h3>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join over 1 million customers who trust Nyord for seamless digital banking, instant transfers, and smart financial tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Open Account
              <span className="ml-2">→</span>
            </Link>
            <Link
              to="/signin"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all border-2 border-white/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </ScrollExpandMedia>

      {/* Xapo-Style Scroll Section */}
      <XapoStyleScroll />

      {/* Original Hero Section - Keep as fallback/alternative */}
      <div className="relative overflow-hidden hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                <span className="material-symbols-outlined text-lg mr-2">verified</span>
                Trusted by 1M+ customers
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
                Banking made
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> simple</span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Experience the future of banking with seamless digital services, instant transfers, and smart financial tools all in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Open Account
                  <span className="material-symbols-outlined ml-2">arrow_forward</span>
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border-2 border-gray-200 dark:border-gray-700"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right Content - Card Visual */}
            <div className="relative lg:h-[500px] flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Card 1 */}
                <div className="absolute top-0 left-0 w-72 h-44 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl transform rotate-6 opacity-90 animate-pulse">
                  <div className="p-6 text-white">
                    <div className="flex justify-between items-start">
                      <span className="text-sm opacity-80">Premium Account</span>
                      <span className="material-symbols-outlined">contactless</span>
                    </div>
                    <div className="mt-8">
                      <div className="text-2xl font-bold tracking-wider">•••• 4829</div>
                    </div>
                  </div>
                </div>
                
                {/* Card 2 */}
                <div className="relative w-72 h-44 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl ml-auto mt-12 transform -rotate-3">
                  <div className="p-6 text-white">
                    <div className="flex justify-between items-start">
                      <span className="text-sm opacity-80">Savings Account</span>
                      <span className="material-symbols-outlined">credit_card</span>
                    </div>
                    <div className="mt-8">
                      <div className="text-2xl font-bold tracking-wider">•••• 8192</div>
                      <div className="text-sm mt-2 opacity-80">Balance: $12,450.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white dark:bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything you need</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Powerful features for modern banking</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: 'flash_on', title: 'Instant Transfers', desc: 'Send money instantly to anyone, anywhere in the world' },
              { icon: 'account_balance_wallet', title: 'Digital Wallet', desc: 'Secure digital wallet with contactless payments' },
              { icon: 'trending_up', title: 'Accounts & Investments', desc: 'Manage accounts, FDs, and investment tools with ease' },
              { icon: 'security', title: 'Bank-level Security', desc: '256-bit encryption and biometric authentication' },
              { icon: 'insights', title: 'Smart Analytics', desc: 'AI-powered insights to manage your finances better' },
              { icon: 'support_agent', title: '24/7 Support', desc: 'Get help anytime with our dedicated support team' },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-white text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Loved by customers</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">See what people are saying about Nyord</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Johnson', role: 'Entrepreneur', text: 'Best banking app I\'ve ever used. The interface is intuitive and transfers are lightning fast!' },
              { name: 'Michael Chen', role: 'Software Engineer', text: 'The investment tools are fantastic. I\'ve grown my savings significantly using their FD and stock features.' },
              { name: 'Emma Williams', role: 'Designer', text: 'Customer support is incredible. They solved my issue within minutes. Highly recommended!' },
            ].map((testimonial, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-yellow-500">star</span>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {testimonial.name[0]}
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to get started?</h2>
          <p className="text-xl text-blue-100 mb-8">Join over 1 million customers who trust Nyord for their banking needs</p>
          <Link
            to="/signup"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
          >
            Open Your Account
            <span className="material-symbols-outlined ml-2">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">account_balance</span>
                </div>
                <span className="text-lg font-bold text-white">Nyord</span>
              </div>
              <p className="text-sm">Modern banking for the digital age</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/cards" className="hover:text-white transition-colors">Cards</Link></li>
                <li><Link to="/loans" className="hover:text-white transition-colors">Loans</Link></li>
                <li><Link to="/fixed-deposits" className="hover:text-white transition-colors">Fixed Deposits</Link></li>
                <li><Link to="/accounts" className="hover:text-white transition-colors">Accounts</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2025 Nyord Banking. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
