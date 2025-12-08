export const DashboardLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="mb-8 animate-bounce">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl">
            <span className="text-5xl">🎓</span>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-3xl font-bold text-white mb-3">
          Loading Dashboard
        </h2>
        <p className="text-amber-200 mb-8">
          Preparing your learning journey...
        </p>

        {/* Animated Progress Bar */}
        <div className="w-64 mx-auto bg-white/10 backdrop-blur-md rounded-full h-2 overflow-hidden border border-white/20">
          <div className="h-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-full animate-loading-bar"></div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};
