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
  const [showOutput, setShowOutput] = useState(false); // Toggle output panel on mobile
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
    setShowOutput(true); // Show output panel when running code

    try {
      // Always use relative URL for API calls in production
      const executeUrl = '/api/execute-code';
      
      const response = await fetch(executeUrl, {
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
      
      // Always use relative URL for API calls
      const explainUrl = '/api/explain-solution';
      
      const response = await fetch(explainUrl, {
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
      case 'easy': return 'text-emerald-200 bg-emerald-500/10 border border-emerald-400/40';
      case 'medium': return 'text-amber-200 bg-amber-500/10 border border-amber-400/40';
      case 'hard': return 'text-rose-200 bg-rose-500/10 border border-rose-400/40';
      default: return 'text-amber-100 bg-white/5 border border-white/10';
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
    <div className="flex flex-col h-full bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.65)] text-amber-50">
      {/* Problem Header */}
      <div className="bg-black/30 border-b border-white/10 p-3 md:p-4 rounded-t-3xl">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-amber-50 truncate tracking-wide">{problem.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <span className="text-xs md:text-sm text-amber-200/80">{problem.category}</span>
              <span className="text-xs md:text-sm text-amber-200/60 hidden sm:inline">•</span>
              <span className="text-xs md:text-sm text-amber-200/80 uppercase tracking-wide">{problem.language}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <p className="text-amber-50/80 text-xs md:text-sm leading-relaxed">{problem.description}</p>
        </div>

        {/* Examples */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs md:text-sm font-semibold text-amber-200 mb-2">Examples:</h3>
            {problem.examples.map((example, idx) => (
              <div key={idx} className="bg-black/40 border border-white/10 rounded-xl p-2 md:p-3 mb-2 text-xs md:text-sm font-mono overflow-x-auto text-amber-50">
                <div><span className="text-amber-200/80">Input:</span> {example.input}</div>
                <div><span className="text-amber-200/80">Output:</span> {example.output}</div>
                {example.explanation && (
                  <div className="text-amber-200/70 mt-1">Explanation: {example.explanation}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Editor Panel */}
        <div className={`flex-1 flex flex-col bg-black/30 border-r border-white/10 ${showOutput ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-black/40 border-b border-white/10 px-2 md:px-4 py-2 flex items-center justify-between rounded-t-3xl lg:rounded-t-none">
            <span className="text-xs md:text-sm font-semibold text-amber-200 tracking-wider">Code Editor</span>
            <div className="flex gap-1 md:gap-2 flex-wrap">
              <button
                onClick={resetCode}
                className="px-2 md:px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-amber-50 rounded-xl transition-colors flex items-center gap-1"
              >
                <ArrowPathIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={getHint}
                className="px-2 md:px-3 py-1 text-xs rounded-xl transition-colors flex items-center gap-1 bg-gradient-to-r from-amber-400/30 to-yellow-500/30 text-amber-100 border border-amber-200/30"
              >
                <LightBulbIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Hint ({currentHintLevel}/{problem.hints?.length || 0})</span>
                <span className="sm:hidden">💡</span>
              </button>
              <button
                onClick={getAIExplanation}
                className="px-2 md:px-3 py-1 text-xs rounded-xl transition-colors flex items-center gap-1 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-100 border border-purple-300/30"
              >
                <SparklesIcon className="w-3 h-3" />
                <span className="hidden sm:inline">AI Explain</span>
                <span className="sm:hidden">✨</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            <Editor
              height="100%"
              language={problem.language}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              theme="vs-dark"
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
          <div className="bg-black/40 border-t border-white/10 px-2 md:px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={runCode}
                disabled={isRunning}
                className={`px-3 md:px-4 py-2 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${
                  isRunning 
                    ? 'bg-white/10 text-amber-200/40 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-black shadow-[0_10px_25px_rgba(16,185,129,0.35)] hover:translate-y-[-1px]'
                }`}
              >
                {isRunning ? (
                  <>
                    <ArrowPathIcon className="w-4 md:w-5 h-4 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">Running...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 md:w-5 h-4 md:h-5" />
                    Run
                  </>
                )}
              </button>
              
              {/* Toggle Output Button (Mobile Only) */}
              <button
                onClick={() => setShowOutput(!showOutput)}
                className="lg:hidden px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold text-sm flex items-center gap-2"
              >
                {showOutput ? '← Code' : 'Output →'}
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm text-amber-100/80">
                  Tests: {testResults.filter(t => t.passed).length}/{testResults.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className={`w-full lg:w-96 flex flex-col bg-black/30 border-l border-white/10 ${showOutput ? 'flex' : 'hidden lg:flex'}`}>
          <div className="bg-black/40 border-b border-white/10 px-2 md:px-4 py-2 flex items-center justify-between">
            <span className="text-xs md:text-sm font-semibold text-amber-200">Output</span>
            {/* Back to Code button for mobile */}
            <button
              onClick={() => setShowOutput(false)}
              className="lg:hidden text-amber-200 text-sm font-medium"
            >
              ← Back to Code
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-2 md:p-4 space-y-4">
            {/* Test Results */}
            {testResults.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-amber-100 mb-2">Test Results:</h4>
                {testResults.map((test, idx) => (
                  <div
                    key={idx}
                    className={`mb-2 p-3 rounded-lg border ${
                      test.passed 
                        ? 'bg-emerald-500/10 border-emerald-400/40' 
                        : 'bg-rose-500/10 border-rose-400/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {test.passed ? (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-300" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-rose-300" />
                      )}
                      <span className="font-semibold text-sm">
                        Test Case {idx + 1}
                      </span>
                    </div>
                    <div className="text-xs font-mono space-y-1 text-amber-50">
                      <div><span className="text-amber-200/80">Input:</span> {test.input}</div>
                      <div><span className="text-amber-200/80">Expected:</span> {test.expected}</div>
                      <div><span className="text-amber-200/80">Got:</span> {test.actual}</div>
                      {!test.passed && test.error && (
                        <div className="text-rose-200 mt-1">{test.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Console Output */}
            {output && (
              <div className="bg-black rounded-xl p-4 font-mono text-sm whitespace-pre-wrap border border-white/10 text-emerald-300">
                {output}
              </div>
            )}

            {/* Solution Display */}
            {showSolution && problem.solution && (
              <div className="mt-4 bg-indigo-500/10 border border-indigo-400/30 rounded-xl p-4">
                <h4 className="font-semibold text-indigo-100 mb-2">Solution:</h4>
                <pre className="text-sm text-indigo-100 bg-black/40 p-3 rounded border border-white/10 overflow-x-auto">
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
