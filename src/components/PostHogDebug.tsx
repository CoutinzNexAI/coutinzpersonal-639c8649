import React, { useState, useEffect } from 'react';
import { trackEvent, posthog } from '@/lib/posthog';

const PostHogDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [testEventSent, setTestEventSent] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('PostHog Debug Component loaded');
    
    // Verificar se PostHog está carregado
    if (typeof window !== 'undefined') {
      addLog(`PostHog loaded: ${posthog.__loaded ? 'YES' : 'NO'}`);
      addLog(`PostHog key: ${process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'EXISTS' : 'MISSING'}`);
      addLog(`PostHog host: ${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'DEFAULT'}`);
    }
  }, []);

  const sendTestEvent = () => {
    addLog('Sending test event...');
    trackEvent('debug_test_event', {
      test_property: 'debug_value',
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });
    setTestEventSent(true);
    addLog('Test event sent!');
  };

  const checkPostHogStatus = () => {
    if (typeof window !== 'undefined') {
      addLog(`PostHog __loaded: ${posthog.__loaded}`);
      addLog(`PostHog config: ${JSON.stringify(posthog.config)}`);
      addLog(`PostHog ready: ${posthog.has_opted_out_capturing() ? 'NO (opted out)' : 'YES'}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 border rounded-lg shadow-lg max-w-md z-50">
      <h3 className="font-bold text-lg mb-2">🔥 PostHog Debug</h3>
      
      <div className="space-y-2 mb-4">
        <button 
          onClick={sendTestEvent}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Send Test Event
        </button>
        
        <button 
          onClick={checkPostHogStatus}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
        >
          Check Status
        </button>
      </div>

      <div className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
        <div className="font-semibold mb-1">Console Logs:</div>
        {logs.map((log, index) => (
          <div key={index} className="text-gray-700">{log}</div>
        ))}
      </div>

      {testEventSent && (
        <div className="mt-2 text-sm text-green-600">
          ✅ Test event sent! Check your PostHog dashboard.
        </div>
      )}
    </div>
  );
};

export default PostHogDebug; 