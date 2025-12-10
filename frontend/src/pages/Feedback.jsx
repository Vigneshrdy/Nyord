import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeedbackSlider from '../components/FeedbackSlider';

const Feedback = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = () => {
    setSubmitted(true);
    // Here you could add API call to save feedback
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 dark:bg-green-900/20">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank you!</h2>
          <p className="text-gray-600 dark:text-gray-300">Your feedback has been submitted successfully.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-4 left-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
      >
        <span className="material-symbols-outlined text-white">arrow_back</span>
      </button>

      {/* Submit button */}
      <button
        onClick={handleSubmitFeedback}
        className="absolute bottom-8 right-8 z-10 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors text-white font-medium"
      >
        Submit Feedback
      </button>

      <FeedbackSlider />
    </div>
  );
};

export default Feedback;