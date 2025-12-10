import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const XapoStyleScroll = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef(null);

  const sections = [
    {
      id: 0,
      leftCategory: "EFFORTLESS TRANSACTIONS",
      leftTitle: "BUY, SEND, AND SPEND, LIGHTNING FAST.",
      leftDescription: "Send money instantly across the globe with competitive exchange rates and minimal fees.",
      leftButton: "Learn more",
      rightTitle: "Move your money your way – quickly and securely",
      rightDescription: "Send and spend in multiple currencies—all in one app. No FX fees, just fast and secure payments anywhere you go.",
      phoneContent: {
        title: "Send",
        subtitle: "Amount you would like to send",
        mainValue: "$ USD 1,000",
        items: [
          { label: "From Savings Account", value: "Use all USD 11,335.00" },
          { label: "Fee", value: "USD 0.15" },
          { label: "Exchange rate", value: "USD 1.00 = EUR 0.92" },
          { label: "Total converted", value: "≈ EUR 920.00" }
        ],
        buttons: ["Continue"]
      }
    },
    {
      id: 1,
      leftCategory: "EARN INTEREST",
      leftTitle: "EARN INTEREST ON YOUR SAVINGS, PAID EVERY DAY",
      leftDescription: "Watch your wealth grow with competitive interest rates on your savings.",
      leftButton: "Grow your savings",
      rightTitle: "Grow your wealth every day",
      rightDescription: "Earn up to 4.5% interest on your savings, paid out daily. Watch your wealth grow in real time.",
      phoneContent: {
        title: "Total earned",
        mainValue: "$1,586.57",
        subtitle: "This year",
        items: [
          { label: "Savings Interest", value: "$1,452.01", subValue: "3.6% APY" },
          { label: "Fixed Deposit", value: "$88.67", subValue: "4.5% APY" },
          { label: "Referrals", value: "$28.56", subValue: "Bonus" },
          { label: "Cashback", value: "$17.33", subValue: "1% on purchases" }
        ]
      }
    },
    {
      id: 2,
      leftCategory: "SPEND WITH NYORD",
      leftTitle: "YOUR GLOBAL DEBIT CARD",
      leftDescription: "Spend anywhere in the world with our premium debit card.",
      leftButton: "Learn more",
      rightTitle: "Earn cashback. No FX fees.",
      rightDescription: "Spend freely with your Nyord debit card wherever you are, with no FX fees and 1% cashback on qualifying purchases.",
      phoneContent: {
        title: "Latest transactions",
        items: [
          { label: "AIRLINE TICKETS", value: "-USD 650.00", subValue: "Today, 10:19" },
          { label: "COFFEE SHOP", value: "-USD 4.50", subValue: "Today, 10:16" },
          { label: "GROCERY STORE", value: "-USD 89.00", subValue: "Yesterday, 15:10" },
          { label: "GAS STATION", value: "-USD 60.00", subValue: "Yesterday, 14:05" }
        ],
        buttons: ["View all"]
      }
    },
    {
      id: 3,
      leftCategory: "INVEST WITH EASE",
      leftTitle: "YOUR WHOLE INVESTMENT PORTFOLIO, IN ONE PLACE",
      leftDescription: "Diversify your portfolio with investments and traditional assets all in one secure platform.",
      leftButton: "Start investing",
      rightTitle: "Build your financial future",
      rightDescription: "Access global markets and manage your entire investment portfolio with institutional-grade security and competitive fees.",
      phoneContent: {
        title: "Portfolio Overview",
        mainValue: "$125,847.32",
        subtitle: "+$2,847.12 (+2.31%) today",
        items: [
          { label: "Tech Investments", value: "$45,230.12", subValue: "+5.2%" },
          { label: "Index Funds", value: "$28,945.67", subValue: "+3.1%" },
          { label: "Bonds", value: "$35,671.23", subValue: "+1.8%" },
          { label: "Cash", value: "$16,000.30", subValue: "0.0%" }
        ]
      }
    }
  ];

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!containerRef.current) return;
          
          const container = containerRef.current;
          const containerTop = container.offsetTop;
          const containerHeight = container.offsetHeight;
          const scrolled = window.scrollY - containerTop;
          const progress = Math.max(0, Math.min(1, scrolled / (containerHeight - window.innerHeight)));
          
          setScrollProgress(progress);
          
          const sectionProgress = progress * (sections.length - 1);
          const easedProgress = sectionProgress + Math.sin(sectionProgress * Math.PI) * 0.1;
          const newSection = Math.max(0, Math.min(sections.length - 1, Math.round(easedProgress)));
          
          setCurrentSection(newSection);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections.length]);

  const currentData = sections[currentSection];

  return (
    <div ref={containerRef} className="relative h-[500vh] bg-black text-white">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <AnimatePresence mode="wait">
            
            {/* Left Content */}
            <motion.div 
              className="space-y-6"
              key={currentData.id}
              initial={{ opacity: 0, x: -30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -30, y: -10 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.25, 0.46, 0.45, 0.94],
                opacity: { duration: 0.6 }
              }}
            >
              <div className="text-sm text-orange-400 font-medium tracking-wider">
                {currentData.leftCategory}
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                {currentData.leftTitle}
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                {currentData.leftDescription}
              </p>
              <button className="inline-flex items-center text-white border-b-2 border-white pb-1 hover:border-orange-400 transition-colors">
                {currentData.leftButton}
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>

              {/* Scroll-responsive Navigation Menu */}
              <div className="space-y-6 pt-8">
                {sections.map((section, index) => {
                  const isActive = index === currentSection;
                  const distance = Math.abs(index - currentSection);
                  const scale = isActive ? 1.15 : Math.max(0.85, 1 - distance * 0.08);
                  const opacity = isActive ? 1 : Math.max(0.5, 1 - distance * 0.15);
                  
                  return (
                    <div key={section.id}>
                      <motion.div 
                        className={`cursor-pointer ${
                          isActive ? 'text-white font-bold' : 'text-gray-500 font-medium'
                        }`}
                        animate={{ 
                          scale: scale,
                          opacity: opacity
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                          mass: 0.8
                        }}
                        style={{
                          transformOrigin: 'left center'
                        }}
                        onClick={() => setCurrentSection(index)}
                      >
                        <motion.div 
                          className={isActive ? 'text-lg' : 'text-sm'}
                          animate={{ fontSize: isActive ? '1.125rem' : '0.875rem' }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                          {section.leftCategory}
                        </motion.div>
                      </motion.div>
                      {index < sections.length - 1 && (
                        <motion.div 
                          className="w-full h-px bg-gray-700 mt-4"
                          animate={{ opacity: 0.3 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Center Phone Mockup */}
            <motion.div 
              className="flex justify-center"
              key={`phone-${currentData.id}`}
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -30 }}
              transition={{ 
                type: "spring",
                stiffness: 100,
                damping: 20,
                opacity: { duration: 0.5 }
              }}
            >
              <div className="relative">
                <div className="w-80 h-[600px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                  <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
                    
                    {/* Phone Screen Content */}
                    <div className="absolute inset-4 text-white">
                      
                      <div className="mb-8"></div>

                      {/* App Content */}
                      <div className="space-y-6">
                        <h3 className="text-2xl font-semibold">{currentData.phoneContent.title}</h3>
                        
                        {currentData.phoneContent.subtitle && (
                          <p className="text-gray-400 text-sm">{currentData.phoneContent.subtitle}</p>
                        )}
                        
                        {currentData.phoneContent.mainValue && (
                          <div className="text-3xl font-bold">{currentData.phoneContent.mainValue}</div>
                        )}

                        {currentData.phoneContent.items && (
                          <motion.div 
                            className="space-y-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.0, delay: 0.2 }}
                          >
                            {currentData.phoneContent.items.map((item, index) => (
                              <motion.div 
                                key={index} 
                                className="flex justify-between items-center py-3 border-b border-gray-800"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                              >
                                <div>
                                  <div className="font-medium text-sm">{item.label}</div>
                                  {item.subValue && (
                                    <div className="text-xs text-gray-400 mt-1">{item.subValue}</div>
                                  )}
                                </div>
                                <div className="font-semibold text-sm">{item.value}</div>
                              </motion.div>
                            ))}
                            
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-4"></div>
                          </motion.div>
                        )}

                        {currentData.phoneContent.buttons && (
                          <div className="space-y-3 pt-4">
                            {currentData.phoneContent.buttons.map((button, index) => (
                              <button 
                                key={index}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold transition-colors"
                              >
                                {button}
                              </button>
                            ))}
                          </div>
                        )}

                        {currentData.id === 2 && (
                          <div className="mt-6">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 mb-4">
                              <div className="text-xs text-orange-100 mb-1">NYORD BANK</div>
                              <div className="text-xs text-orange-100 mb-8">debit</div>
                              <div className="text-sm text-orange-100">virtual</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button className="bg-orange-600 text-white py-2 rounded-lg text-xs">Details</button>
                              <button className="bg-gray-700 text-white py-2 rounded-lg text-xs">Freeze</button>
                              <button className="bg-gray-700 text-white py-2 rounded-lg text-xs">Settings</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Content */}
            <motion.div 
              className="space-y-6"
              key={`right-${currentData.id}`}
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 30, y: -10 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.25, 0.46, 0.45, 0.94],
                opacity: { duration: 0.6 }
              }}
            >
              <h3 className="text-2xl lg:text-3xl font-bold leading-tight">
                {currentData.rightTitle}
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                {currentData.rightDescription}
              </p>
            </motion.div>

          </AnimatePresence>
        </div>

        {/* Background Elements with scroll-responsive lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          {/* Dynamic left side lines that move with scroll */}
          {sections.map((_, index) => {
            const basePosition = 20 + (index * 12);
            const linePosition = basePosition - (scrollProgress * 50);
            const isNearActive = Math.abs(index - currentSection) <= 1;
            const opacity = index === currentSection ? 0.6 : (isNearActive ? 0.35 : 0.15);
            const width = index === currentSection ? 28 : (isNearActive ? 20 : 16);
            
            return (
              <motion.div
                key={`line-${index}`}
                className="absolute left-6 h-px bg-gradient-to-r from-white/40 to-transparent"
                animate={{
                  top: `${Math.max(10, Math.min(90, linePosition))}%`,
                  width: `${width}px`,
                  opacity: opacity
                }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                  opacity: { duration: 0.4, ease: "easeOut" }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default XapoStyleScroll;
