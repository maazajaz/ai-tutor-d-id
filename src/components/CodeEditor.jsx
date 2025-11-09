import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  PlayIcon, 
  StopIcon, 
  LightBulbIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const CodeEditor = ({ problem, onComplete }) => {
  const [code, setCode] = useState(problem?.starterCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [currentHintLevel, setCurrentHintLevel] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (problem) {
      setCode(problem.starterCode || '');
      setOutput('');
      setTestResults([]);
      setShowHint(false);
      setCurrentHintLevel(0);
      setShowSolution(false);
    }
  }, [problem]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor settings
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      automaticLayout: true,
    });
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');
    setTestResults([]);

    try {
      const response = await fetch('http://localhost:3000/api/execute-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: problem.language,
          testCases: problem.testCases,
          problemId: problem.id
        })
      });

      const result = await response.json();

      if (result.error) {
        setOutput(`❌ Error:\n${result.error}`);
      } else {
        setOutput(result.output || 'Code executed successfully!');
        setTestResults(result.testResults || []);
        
        // Check if all tests passed
        const allPassed = result.testResults?.every(test => test.passed);
        if (allPassed && onComplete) {
          onComplete(problem.id);
        }
      }
    } catch (error) {
      setOutput(`❌ Connection Error:\n${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    if (window.confirm('Reset code to starter template? You will lose your current work.')) {
      setCode(problem.starterCode);
      setOutput('');
      setTestResults([]);
    }
  };

  const getHint = async () => {
    if (currentHintLevel >= problem.hints.length) {
      setShowSolution(true);
      return;
    }

    // Insert hint as comment in the editor
    const hint = problem.hints[currentHintLevel];
    const hintComment = `\n# 💡 Hint ${currentHintLevel + 1}: ${hint}\n`;
    
    // Add hint at the top of the code (after function definition)
    const lines = code.split('\n');
    const functionDefLine = lines.findIndex(line => line.trim().startsWith('def '));
    
    if (functionDefLine !== -1) {
      // Insert after the function definition line
      lines.splice(functionDefLine + 1, 0, hintComment);
      setCode(lines.join('\n'));
    } else {
      // If no function found, add at the top
      setCode(hintComment + code);
    }
    
    setCurrentHintLevel(prev => prev + 1);
    setOutput(`💡 Hint ${currentHintLevel + 1} added to your code!`);
  };

  const getAIExplanation = async () => {
    try {
      setOutput('🤖 Generating AI explanation...\n');
      
      const response = await fetch('http://localhost:3000/api/explain-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          userCode: code,
          problemDescription: problem.description
        })
      });

      const result = await response.json();
      
      if (result.explanation) {
        setOutput(`🤖 AI Explanation:\n\n${result.explanation}`);
      }
    } catch (error) {
      setOutput(`❌ Failed to get AI explanation: ${error.message}`);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a problem to start coding</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Problem Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{problem.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <span className="text-sm text-gray-500">{problem.category}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{problem.language}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <p className="text-gray-700 text-sm leading-relaxed">{problem.description}</p>
        </div>

        {/* Examples */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Examples:</h3>
            {problem.examples.map((example, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 mb-2 text-sm font-mono">
                <div><span className="text-gray-600">Input:</span> {example.input}</div>
                <div><span className="text-gray-600">Output:</span> {example.output}</div>
                {example.explanation && (
                  <div className="text-gray-500 mt-1">Explanation: {example.explanation}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Code Editor</span>
            <div className="flex gap-2">
              <button
                onClick={resetCode}
                className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors flex items-center gap-1"
              >
                <ArrowPathIcon className="w-3 h-3" />
                Reset
              </button>
              <button
                onClick={getHint}
                className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors flex items-center gap-1"
              >
                <LightBulbIcon className="w-3 h-3" />
                Hint ({currentHintLevel}/{problem.hints?.length || 0})
              </button>
              <button
                onClick={getAIExplanation}
                className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors flex items-center gap-1"
              >
                <SparklesIcon className="w-3 h-3" />
                AI Explain
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <Editor
              height="100%"
              language={problem.language}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              theme="vs-light"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={runCode}
                disabled={isRunning}
                className={`px-4 py-2 rounded-lg font-semibold text-white transition-all flex items-center gap-2 ${
                  isRunning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isRunning ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    Run Code
                  </>
                )}
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Tests Passed: {testResults.filter(t => t.passed).length}/{testResults.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:w-96 flex flex-col bg-gray-50">
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
            <span className="text-sm font-semibold text-gray-700">Output</span>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Test Results:</h4>
                {testResults.map((test, idx) => (
                  <div
                    key={idx}
                    className={`mb-2 p-3 rounded-lg border ${
                      test.passed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {test.passed ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-semibold text-sm">
                        Test Case {idx + 1}
                      </span>
                    </div>
                    <div className="text-xs font-mono space-y-1">
                      <div><span className="text-gray-600">Input:</span> {test.input}</div>
                      <div><span className="text-gray-600">Expected:</span> {test.expected}</div>
                      <div><span className="text-gray-600">Got:</span> {test.actual}</div>
                      {!test.passed && test.error && (
                        <div className="text-red-600 mt-1">{test.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Console Output */}
            {output && (
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                {output}
              </div>
            )}

            {/* Solution Display */}
            {showSolution && problem.solution && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Solution:</h4>
                <pre className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-100 overflow-x-auto">
                  <code>{problem.solution}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
