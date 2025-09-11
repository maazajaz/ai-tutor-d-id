import React from 'react';

const DebugInfo = () => {
  const debugData = {
    hasApiKey: !!import.meta.env.VITE_DID_API_KEY,
    apiKeyLength: import.meta.env.VITE_DID_API_KEY?.length || 0,
    apiKeyFirst10: import.meta.env.VITE_DID_API_KEY?.substring(0, 10) || 'Not found',
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    allEnvKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
    userAgent: navigator.userAgent,
    location: window.location.href
  };

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔧 Debug Info</h3>
      <pre className="text-xs overflow-auto max-h-60">
        {JSON.stringify(debugData, null, 2)}
      </pre>
    </div>
  );
};

export default DebugInfo;
