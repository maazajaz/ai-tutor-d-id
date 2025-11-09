import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
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

const PracticeProblems = () => {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [completedProblems, setCompletedProblems] = useState(new Set());
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Problem List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CodeBracketIcon className="w-6 h-6 text-indigo-600" />
                Practice Problems
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {completedProblems.size} / {PROBLEMS_DATABASE.length} completed
              </p>
            </div>
            <div className="text-center">
              <TrophyIcon className="w-8 h-8 text-yellow-500 mx-auto" />
              <span className="text-xs text-gray-500">Streak</span>
              <div className="flex items-center gap-1 mt-1">
                <FireIcon className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-gray-800">3</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
        <div className="flex-1 overflow-y-auto">
          {filteredProblems.map((problem) => {
            const isCompleted = completedProblems.has(problem.id);
            const isSelected = selectedProblem?.id === problem.id;

            return (
              <div
                key={problem.id}
                onClick={() => setSelectedProblem(problem)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-indigo-50 border-l-4 border-l-indigo-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isCompleted && (
                        <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                      <h3 className={`font-semibold text-sm ${isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                        {problem.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {problem.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getDifficultyColor(problem.difficulty)}`}>
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
            <div className="p-8 text-center text-gray-500">
              <p>No problems found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="flex-1">
        {selectedProblem ? (
          <CodeEditor 
            problem={selectedProblem} 
            onComplete={handleProblemComplete}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <CodeBracketIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Select a problem to start coding
              </h2>
              <p className="text-gray-500">
                Choose from {PROBLEMS_DATABASE.length} practice problems
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeProblems;
