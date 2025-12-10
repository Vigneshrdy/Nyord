import React from 'react';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { 
    opacity: 0,
    y: 30
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.43, 0.13, 0.23, 0.96],
      delayChildren: 0.1,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
};

const numberVariants = {
  hidden: (direction) => ({
    opacity: 0,
    x: direction * 40,
    y: 15,
    rotate: direction * 5
  }),
  visible: {
    opacity: 0.7,
    x: 0,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
};

const ghostVariants = {
  hidden: { 
    scale: 0.8,
    opacity: 0,
    y: 15,
    rotate: -5
  },
  visible: { 
    scale: 1,
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  },
  hover: {
    scale: 1.1,
    y: -10,
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      rotate: {
        duration: 2,
        ease: "linear",
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  },
  floating: {
    y: [-5, 5],
    transition: {
      y: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  }
};

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 md:gap-6 mb-8 md:mb-12">
          <span className="text-[80px] md:text-[120px] font-bold text-[#222222] opacity-70 select-none">
            4
          </span>
          <div className="animate-bounce">
            <svg 
              width="120" 
              height="120" 
              viewBox="0 0 120 120" 
              className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] object-contain select-none"
            >
              <circle cx="60" cy="60" r="50" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2"/>
              <circle cx="45" cy="45" r="8" fill="#374151"/>
              <circle cx="75" cy="45" r="8" fill="#374151"/>
              <path d="M40 75 Q60 95 80 75" stroke="#374151" strokeWidth="3" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[80px] md:text-[120px] font-bold text-[#222222] opacity-70 select-none">
            4
          </span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold text-[#222222] mb-4 md:mb-6 opacity-70 select-none">
          Boo! Page missing!
        </h1>
        
        <p className="text-lg md:text-xl text-[#222222] mb-8 md:mb-12 opacity-50 select-none">
          Whoops! This page must be a ghost - it's not here!
        </p>

        <div className="hover:scale-105 transition-transform duration-300">
          <Link 
            to="/"
            className="inline-block bg-[#222222] text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-[#000000] transition-colors select-none"
          >
            Find shelter
          </Link>
        </div>

        <div className="mt-12">
          <button className="text-[#222222] opacity-50 hover:opacity-70 transition-opacity underline select-none">
            What means 404?
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;