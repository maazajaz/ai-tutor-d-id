import { useState } from 'react';
import { useChat } from '../hooks/useChat';

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If we're on Vercel (production), use the current origin with /api path
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  
  // For localhost, use the configured API URL or default to localhost:3000
  if (envUrl && !envUrl.includes('your-app-name')) {
    return envUrl;
  }
  
  return "http://localhost:3000";
};

const backendUrl = getBackendUrl();

export const QuizGenerator = () => {
  const { chatHistory, currentChatId } = useChat();
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const generateQuiz = async () => {
    if (!chatHistory || chatHistory.length === 0) {
      alert('No chat history available to generate a quiz from!');
      return;
    }

    setIsGenerating(true);
    setQuiz(null);
    setUserAnswers({});
    setShowResults(false);

    try {
      const apiUrl = `${backendUrl}/api/generate-quiz`;
      console.log('🎯 Generating quiz...');
      console.log('📡 Backend URL:', backendUrl);
      console.log('📡 Full API URL:', apiUrl);
      console.log('📊 Chat history length:', chatHistory.length);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const data = await response.json();
      console.log('✅ Quiz data received:', data);
      setQuiz(data.quiz);
    } catch (error) {
      console.error('❌ Error generating quiz:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      alert(`Failed to generate quiz: ${error.message}\n\nCheck console for details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (showResults) return; // Don't allow changes after submission
    
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const submitQuiz = () => {
    if (Object.keys(userAnswers).length !== quiz.questions.length) {
      alert('Please answer all questions before submitting!');
      return;
    }

    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setQuiz(null);
    setUserAnswers({});
    setShowResults(false);
    setScore(0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            🎯 Smart Quiz Generator
          </h3>
          <p className="text-sm text-gray-600">
            {quiz ? 'Test your knowledge' : 'Generate AI-powered quizzes from your conversations'}
          </p>
        </div>
      </div>

      {!quiz ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧠</div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            Ready to test your knowledge?
          </h4>
          <p className="text-sm text-gray-600 mb-6">
            {chatHistory && chatHistory.length > 0 
              ? 'Generate a quiz based on your recent conversations'
              : 'Start a conversation first to generate a quiz'}
          </p>
          <button
            onClick={generateQuiz}
            disabled={isGenerating || !chatHistory || chatHistory.length === 0}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isGenerating || !chatHistory || chatHistory.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:scale-105'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Quiz...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate Quiz</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div>
          {/* Quiz Header */}
          {!showResults && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl">
                    📝
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{quiz.title}</h4>
                    <p className="text-xs text-gray-600">{quiz.questions.length} questions</p>
                  </div>
                </div>
                <span className="text-xs bg-white px-3 py-1 rounded-full font-medium text-gray-700">
                  {Object.keys(userAnswers).length}/{quiz.questions.length} answered
                </span>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {showResults && (
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-300">
              <div className="text-center">
                <div className="text-5xl mb-3">
                  {score === quiz.questions.length ? '🎉' : score >= quiz.questions.length / 2 ? '👍' : '💪'}
                </div>
                <h4 className="text-2xl font-bold text-gray-800 mb-2">
                  Your Score: {score}/{quiz.questions.length}
                </h4>
                <p className="text-gray-600 mb-4">
                  {score === quiz.questions.length 
                    ? 'Perfect! You mastered this topic! 🌟'
                    : score >= quiz.questions.length / 2
                    ? 'Good job! Keep learning! 📚'
                    : 'Keep practicing! You\'ll get there! 💡'}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(score / quiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {quiz.questions.map((question, qIndex) => (
              <div 
                key={qIndex}
                className={`p-5 rounded-xl border-2 transition-all ${
                  showResults
                    ? userAnswers[qIndex] === question.correctAnswer
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    showResults
                      ? userAnswers[qIndex] === question.correctAnswer
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {qIndex + 1}
                  </div>
                  <p className="font-medium text-gray-800 flex-1">{question.question}</p>
                </div>

                <div className="space-y-2 ml-11">
                  {question.options.map((option, oIndex) => {
                    const isSelected = userAnswers[qIndex] === oIndex;
                    const isCorrect = question.correctAnswer === oIndex;
                    
                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswerSelect(qIndex, oIndex)}
                        disabled={showResults}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          showResults
                            ? isCorrect
                              ? 'bg-green-100 border-green-400 font-medium'
                              : isSelected
                              ? 'bg-red-100 border-red-400'
                              : 'bg-white border-gray-200'
                            : isSelected
                            ? 'bg-purple-100 border-purple-400 font-medium'
                            : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            showResults
                              ? isCorrect
                                ? 'border-green-500 bg-green-500'
                                : isSelected
                                ? 'border-red-500 bg-red-500'
                                : 'border-gray-300'
                              : isSelected
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {(showResults && isCorrect) || (!showResults && isSelected) ? (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : null}
                          </div>
                          <span className="flex-1 text-sm">{option}</span>
                          {showResults && isCorrect && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                              Correct
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showResults && question.explanation && (
                  <div className="mt-4 ml-11 p-3 bg-white rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs font-semibold text-gray-700 mb-1">💡 Explanation:</p>
                    <p className="text-sm text-gray-600">{question.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {!showResults ? (
              <>
                <button
                  onClick={submitQuiz}
                  disabled={Object.keys(userAnswers).length !== quiz.questions.length}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    Object.keys(userAnswers).length !== quiz.questions.length
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  Submit Quiz
                </button>
                <button
                  onClick={resetQuiz}
                  className="px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={generateQuiz}
                  className="flex-1 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:scale-105 transition-all"
                >
                  New Quiz
                </button>
                <button
                  onClick={resetQuiz}
                  className="px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
