import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import logo from '../assets/logo_white.svg';
import { 
  CodeBracketIcon, 
  CheckCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';

// Sample problems database
const PROBLEMS_DATABASE = [
  {
    id: 'sum-two-numbers',
    title: 'Sum of Two Numbers',
    difficulty: 'easy',
    category: 'Math',
    language: 'python',
    description: 'Write a function that takes two numbers as input and returns their sum.',
    examples: [
      { input: 'sum_two(5, 3)', output: '8', explanation: '5 + 3 = 8' },
      { input: 'sum_two(-1, 1)', output: '0', explanation: '-1 + 1 = 0' }
    ],
    starterCode: `def sum_two(a, b):
    # Write your code here
    pass`,
    solution: `def sum_two(a, b):
    return a + b`,
    hints: [
      'Use the + operator to add two numbers',
      'Simply return a + b'
    ],
    testCases: [
      { input: [5, 3], expected: 8 },
      { input: [-1, 1], expected: 0 },
      { input: [0, 0], expected: 0 },
      { input: [100, 200], expected: 300 }
    ]
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    difficulty: 'easy',
    category: 'Strings',
    language: 'python',
    description: 'Write a function that reverses a string. For example, "hello" becomes "olleh".',
    examples: [
      { input: 'reverse("hello")', output: '"olleh"' },
      { input: 'reverse("Python")', output: '"nohtyP"' }
    ],
    starterCode: `def reverse(s):
    # Write your code here
    pass`,
    solution: `def reverse(s):
    return s[::-1]

# Alternative solution using reversed()
def reverse_alt(s):
    return ''.join(reversed(s))`,
    hints: [
      'You can use Python\'s slicing notation [::-1]',
      'Or use the reversed() function with join()'
    ],
    testCases: [
      { input: ['hello'], expected: 'olleh' },
      { input: ['Python'], expected: 'nohtyP' },
      { input: [''], expected: '' },
      { input: ['a'], expected: 'a' }
    ]
  },
  {
    id: 'find-max',
    title: 'Find Maximum in Array',
    difficulty: 'easy',
    category: 'Arrays',
    language: 'python',
    description: 'Write a function that finds and returns the maximum number in an array.',
    examples: [
      { input: 'find_max([1, 5, 3, 9, 2])', output: '9' },
      { input: 'find_max([-1, -5, -2])', output: '-1' }
    ],
    starterCode: `def find_max(arr):
    # Write your code here
    pass`,
    solution: `def find_max(arr):
    if not arr:
        return None
    return max(arr)

# Alternative without using max()
def find_max_manual(arr):
    if not arr:
        return None
    max_val = arr[0]
    for num in arr:
        if num > max_val:
            max_val = num
    return max_val`,
    hints: [
      'You can use Python\'s built-in max() function',
      'Or loop through the array keeping track of the largest value'
    ],
    testCases: [
      { input: [[1, 5, 3, 9, 2]], expected: 9 },
      { input: [[-1, -5, -2]], expected: -1 },
      { input: [[42]], expected: 42 },
      { input: [[0, 0, 0]], expected: 0 }
    ]
  },
  {
    id: 'palindrome-check',
    title: 'Check if String is Palindrome',
    difficulty: 'medium',
    category: 'Strings',
    language: 'python',
    description: 'Write a function that checks if a string is a palindrome (reads the same forwards and backwards). Ignore spaces and capitalization.',
    examples: [
      { input: 'is_palindrome("racecar")', output: 'True' },
      { input: 'is_palindrome("A man a plan a canal Panama")', output: 'True' },
      { input: 'is_palindrome("hello")', output: 'False' }
    ],
    starterCode: `def is_palindrome(s):
    # Write your code here
    pass`,
    solution: `def is_palindrome(s):
    # Remove spaces and convert to lowercase
    s = s.replace(" ", "").lower()
    # Check if string equals its reverse
    return s == s[::-1]`,
    hints: [
      'Remove all spaces from the string first',
      'Convert the string to lowercase for case-insensitive comparison',
      'Compare the string with its reverse'
    ],
    testCases: [
      { input: ['racecar'], expected: true },
      { input: ['A man a plan a canal Panama'], expected: true },
      { input: ['hello'], expected: false },
      { input: ['Was it a car or a cat I saw'], expected: true }
    ]
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    difficulty: 'easy',
    category: 'Logic',
    language: 'python',
    description: 'Write a function that prints numbers from 1 to n. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", and for multiples of both print "FizzBuzz".',
    examples: [
      { input: 'fizzbuzz(15)', output: '1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz' }
    ],
    starterCode: `def fizzbuzz(n):
    # Write your code here
    pass

# Test your function
fizzbuzz(15)`,
    solution: `def fizzbuzz(n):
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)`,
    hints: [
      'Check for divisibility by 15 first (both 3 and 5)',
      'Use the modulo operator % to check divisibility',
      'Loop from 1 to n (inclusive)'
    ],
    testCases: []  // FizzBuzz is output-based, harder to test automatically
  },
  {
    id: 'factorial',
    title: 'Calculate Factorial',
    difficulty: 'medium',
    category: 'Recursion',
    language: 'python',
    description: 'Write a function that calculates the factorial of a number. Factorial of n (n!) is the product of all positive integers less than or equal to n.',
    examples: [
      { input: 'factorial(5)', output: '120', explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120' },
      { input: 'factorial(0)', output: '1', explanation: '0! = 1 by definition' }
    ],
    starterCode: `def factorial(n):
    # Write your code here
    pass`,
    solution: `def factorial(n):
    if n == 0 or n == 1:
        return 1
    return n * factorial(n - 1)

# Iterative solution
def factorial_iterative(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result`,
    hints: [
      'Base case: factorial of 0 and 1 is 1',
      'Recursive case: n! = n × (n-1)!',
      'Or use a loop to multiply numbers from 1 to n'
    ],
    testCases: [
      { input: [5], expected: 120 },
      { input: [0], expected: 1 },
      { input: [1], expected: 1 },
      { input: [10], expected: 3628800 }
    ]
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci Sequence',
    difficulty: 'medium',
    category: 'Recursion',
    language: 'python',
    description: 'Write a function that returns the nth number in the Fibonacci sequence. The sequence starts: 0, 1, 1, 2, 3, 5, 8, 13...',
    examples: [
      { input: 'fibonacci(6)', output: '8', explanation: 'The 6th Fibonacci number is 8' },
      { input: 'fibonacci(10)', output: '55' }
    ],
    starterCode: `def fibonacci(n):
    # Write your code here
    pass`,
    solution: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Optimized iterative solution
def fibonacci_iterative(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,
    hints: [
      'Base cases: fibonacci(0) = 0, fibonacci(1) = 1',
      'Each number is the sum of the previous two',
      'For better performance, use iteration instead of recursion'
    ],
    testCases: [
      { input: [0], expected: 0 },
      { input: [1], expected: 1 },
      { input: [6], expected: 8 },
      { input: [10], expected: 55 }
    ]
  },
  {
    id: 'two-sum',
    title: 'Two Sum Problem',
    difficulty: 'medium',
    category: 'Arrays',
    language: 'python',
    description: 'Given an array of integers and a target sum, return indices of two numbers that add up to the target.',
    examples: [
      { input: 'two_sum([2,7,11,15], 9)', output: '[0, 1]', explanation: '2 + 7 = 9' },
      { input: 'two_sum([3,2,4], 6)', output: '[1, 2]', explanation: '2 + 4 = 6' }
    ],
    starterCode: `def two_sum(nums, target):
    # Write your code here
    pass`,
    solution: `def two_sum(nums, target):
    # Using hash map for O(n) solution
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    hints: [
      'Use a hash map (dictionary) to store numbers you\'ve seen',
      'For each number, check if (target - number) exists in the map',
      'This gives you O(n) time complexity'
    ],
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] }
    ]
  }
];

const PracticeProblems = ({ onBack }) => {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [completedProblems, setCompletedProblems] = useState(new Set());
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Load completed problems from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('completedProblems');
    if (saved) {
      setCompletedProblems(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save completed problems to localStorage
  const handleProblemComplete = (problemId) => {
    const updated = new Set([...completedProblems, problemId]);
    setCompletedProblems(updated);
    localStorage.setItem('completedProblems', JSON.stringify([...updated]));
  };

  // Filter problems
  const filteredProblems = PROBLEMS_DATABASE.filter(problem => {
    const matchesDifficulty = filterDifficulty === 'all' || problem.difficulty === filterDifficulty;
    const matchesCategory = filterCategory === 'all' || problem.category === filterCategory;
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = ['all', ...new Set(PROBLEMS_DATABASE.map(p => p.category))];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-200 bg-emerald-500/10 border border-emerald-400/40';
      case 'medium': return 'text-amber-200 bg-amber-500/10 border border-amber-400/30';
      case 'hard': return 'text-rose-200 bg-rose-500/10 border border-rose-400/40';
      default: return 'text-amber-100/80 bg-white/5 border border-white/10';
    }
  };

  const gradientBackground = "bg-gradient-to-br from-black via-[#130a04] to-[#2f1a00]";
  const glassPanel = "bg-black/60 border border-white/10 backdrop-blur-2xl shadow-[0_20px_45px_rgba(0,0,0,0.65)]";

  return (
    <div className={`${gradientBackground} text-amber-50 min-h-screen flex flex-col`}>
      {/* Mobile Top Nav */}
      <div className="lg:hidden sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_10px_25px_rgba(0,0,0,0.45)] border border-amber-200"
            aria-label="Toggle problem menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Informatics360.ai</p>
            <p className="text-sm font-semibold text-amber-50 mt-0.5">Practice Problems</p>
          </div>

          {onBack ? (
            <button
              onClick={onBack}
              className="px-3 py-2 rounded-xl border border-white/15 text-amber-50 bg-white/5 hover:bg-white/10 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <span className="w-10" />
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 relative lg:flex-row">

      {/* Left Sidebar - Problem List */}
      <div className={`
        w-full sm:w-80 lg:w-80 ${glassPanel} flex flex-col text-amber-50
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Sharda Informatics" className="h-8 w-auto" />
              <div>
                <h1 className="text-lg font-bold text-amber-100 flex items-center gap-2">
                  Practice Problems
                </h1>
                <p className="text-xs text-amber-300">Informatics360.ai</p>
              </div>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/15 text-amber-100 rounded-lg transition-colors text-sm"
                title="Back to Dashboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-3">
            <div>
              <p className="text-sm text-amber-200 font-semibold">
                {completedProblems.size} / {PROBLEMS_DATABASE.length} completed
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2">
                <FireIcon className="w-5 h-5 text-amber-300" />
                <span className="text-lg font-bold text-amber-200">3</span>
                <TrophyIcon className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-xs text-amber-300/80">Day Streak</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-white/10 bg-black/40">
          {/* Search */}
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="w-5 h-5 text-amber-300 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-white/15 rounded-2xl bg-black/60 text-amber-50 placeholder:text-amber-200/40 focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-white/15 rounded-xl bg-black/60 text-amber-50 focus:ring-2 focus:ring-amber-300"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-white/15 rounded-xl bg-black/60 text-amber-50 focus:ring-2 focus:ring-amber-300"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Topics' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Problem List */}
        <div className="flex-1 overflow-y-auto bg-black/20 p-3 space-y-3">
          {filteredProblems.map((problem) => {
            const isCompleted = completedProblems.has(problem.id);
            const isSelected = selectedProblem?.id === problem.id;

            return (
              <div
                key={problem.id}
                onClick={() => {
                  setSelectedProblem(problem);
                  setIsSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-[0_10px_30px_rgba(0,0,0,0.55)] ${
                  isSelected 
                    ? 'bg-gradient-to-r from-amber-400/20 to-yellow-500/10 border-amber-300/40' 
                    : 'bg-black/40 border-white/10 hover:border-amber-200/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isCompleted && (
                        <CheckCircleIcon className="w-5 h-5 text-amber-300 flex-shrink-0" />
                      )}
                      <h3 className={`font-semibold text-sm ${isCompleted ? 'text-amber-200' : 'text-amber-50'}`}>
                        {problem.title}
                      </h3>
                    </div>
                    <p className="text-xs text-amber-100/60 mb-2 line-clamp-2">
                      {problem.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">{problem.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProblems.length === 0 && (
            <div className="p-8 text-center text-amber-200/70">
              <p>No problems found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="flex-1 w-full px-4 pb-8 pt-4 lg:p-8">
        {selectedProblem ? (
          <CodeEditor 
            problem={selectedProblem} 
            onComplete={handleProblemComplete}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
              <CodeBracketIcon className="w-16 h-16 text-amber-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-amber-50 mb-2">
                Select a problem to start coding
              </h2>
              <p className="text-amber-100/70">
                Choose from {PROBLEMS_DATABASE.length} practice problems
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default PracticeProblems;
