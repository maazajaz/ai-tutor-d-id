import React from 'react';

const LoadingScreen = ({ isLoading = true, loadingText = "Loading your AI tutor..." }) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      <div className="text-white text-center bg-black bg-opacity-20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
        <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
        <p className="text-2xl font-bold mb-2">AI Tutor</p>
        <p className="text-lg font-medium text-green-100">{loadingText}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;