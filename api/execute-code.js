/**
 * Vercel Serverless Function: Execute Python Code
 * Endpoint: /api/execute-code
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  // Set CORS headers - allow all origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
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

    // Create a temporary file
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `code_${Date.now()}.py`);
    
    // Write code to temp file
    fs.writeFileSync(tmpFile, code);

    try {
      // Execute with timeout
      const { stdout, stderr } = await execAsync(`python "${tmpFile}"`, {
        timeout: 5000, // 5 second timeout
        maxBuffer: 1024 * 1024 // 1MB max output
      });

      // Clean up
      fs.unlinkSync(tmpFile);

      // Run test cases if provided
      let testResults = [];
      if (testCases && testCases.length > 0) {
        testResults = await runTestCases(code, testCases);
      }

      res.status(200).json({
        output: stdout || stderr,
        testResults,
        success: !stderr
      });
    } catch (execError) {
      // Clean up on error
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }

      res.status(200).json({
        error: execError.message || execError.stderr || 'Execution error',
        output: execError.stdout || '',
        testResults: []
      });
    }
  } catch (error) {
    console.error('❌ Error executing code:', error);
    res.status(500).json({ error: error.message });
  }
}

// Helper function to run test cases
async function runTestCases(code, testCases) {
  const results = [];
  
  for (const testCase of testCases) {
    try {
      // Extract function name from code
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
      
      // Build test code
      const inputArgs = Array.isArray(testCase.input) 
        ? testCase.input.map(arg => JSON.stringify(arg)).join(', ')
        : JSON.stringify(testCase.input);
      
      const testCode = `${code}\n\nresult = ${functionName}(${inputArgs})\nprint(result)`;

      // Execute test
      const tmpDir = os.tmpdir();
      const tmpFile = path.join(tmpDir, `test_${Date.now()}.py`);
      fs.writeFileSync(tmpFile, testCode);

      const { stdout, stderr } = await execAsync(`python "${tmpFile}"`, {
        timeout: 2000,
        maxBuffer: 1024 * 1024
      });

      fs.unlinkSync(tmpFile);

      const actualOutput = stdout.trim();
      const expectedOutput = String(testCase.expected);

      results.push({
        passed: actualOutput === expectedOutput,
        input: JSON.stringify(testCase.input),
        expected: expectedOutput,
        actual: actualOutput,
        error: stderr || null
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
