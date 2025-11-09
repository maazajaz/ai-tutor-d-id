/**
 * Vercel Serverless Function: Execute Python Code using Judge0 API
 * Endpoint: /api/execute-code
 * Get free API key: https://rapidapi.com/judge0-official/api/judge0-ce
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, language, testCases, problemId } = req.body;
    console.log('🏃 Executing code for problem:', problemId);

    if (language !== 'python') {
      return res.status(400).json({
        error: `Language ${language} is not supported yet. Currently only Python is supported.`
      });
    }

    // Run test cases using Judge0 API
    let testResults = [];
    if (testCases && testCases.length > 0) {
      testResults = await runTestCasesWithJudge0(code, testCases);
    } else {
      const result = await executeWithJudge0(code);
      return res.status(200).json({
        output: result.output,
        testResults: [],
        success: !result.error
      });
    }

    const allPassed = testResults.every(test => test.passed);
    const output = allPassed 
      ? '✅ All test cases passed!' 
      : `❌ ${testResults.filter(t => !t.passed).length} test(s) failed`;

    res.status(200).json({
      output,
      testResults,
      success: allPassed
    });

  } catch (error) {
    console.error('❌ Error executing code:', error);
    res.status(500).json({ error: error.message });
  }
}

// Execute code using Judge0 API
async function executeWithJudge0(code, stdin = '') {
  try {
    const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
    
    if (!RAPIDAPI_KEY) {
      console.log('⚠️ No Judge0 API key, using demo mode');
      return {
        output: '⚠️ Code execution requires RapidAPI key.\n\nTo enable:\n1. Sign up free at rapidapi.com\n2. Subscribe to Judge0 CE (free tier)\n3. Add RAPIDAPI_KEY to Vercel env vars',
        error: null
      };
    }
    
    const submitResponse = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        language_id: 71, // Python 3.8
        source_code: code,
        stdin: stdin,
        cpu_time_limit: 5
      })
    });

    if (!submitResponse.ok) {
      throw new Error(`Judge0 API error: ${submitResponse.status}`);
    }

    const result = await submitResponse.json();
    
    return {
      output: result.stdout || result.stderr || result.compile_output || 'No output',
      error: result.status.id > 3 ? result.stderr || result.compile_output : null
    };
  } catch (error) {
    console.error('Judge0 API error:', error);
    return {
      output: 'Code execution temporarily unavailable',
      error: error.message
    };
  }
}

// Run test cases with Judge0
async function runTestCasesWithJudge0(code, testCases) {
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const functionMatch = code.match(/def\s+(\w+)\s*\(/);
      if (!functionMatch) {
        results.push({
          passed: false,
          error: 'Could not find function definition',
          input: JSON.stringify(testCase.input),
          expected: JSON.stringify(testCase.expected),
          actual: 'N/A'
        });
        continue;
      }

      const functionName = functionMatch[1];
      const inputArgs = Array.isArray(testCase.input) 
        ? testCase.input.map(arg => JSON.stringify(arg)).join(', ')
        : JSON.stringify(testCase.input);
      
      const testCode = `${code}\n\nresult = ${functionName}(${inputArgs})\nprint(result)`;
      const result = await executeWithJudge0(testCode);
      
      const actualOutput = (result.output || '').trim();
      const expectedOutput = String(testCase.expected);

      results.push({
        passed: actualOutput === expectedOutput,
        input: JSON.stringify(testCase.input),
        expected: expectedOutput,
        actual: actualOutput,
        error: result.error || null
      });
    } catch (error) {
      results.push({
        passed: false,
        error: error.message,
        input: JSON.stringify(testCase.input),
        expected: JSON.stringify(testCase.expected),
        actual: 'Error'
      });
    }
  }

  return results;
}
