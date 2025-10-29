'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('itsconnorowens@gmail.com');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [messageId, setMessageId] = useState('');

  const sendTestEmail = async () => {
    setStatus('sending');
    setMessage('');
    setMessageId('');

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        setMessageId(result.messageId || '');
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Network error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📧 Email System Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test your Flghtly email infrastructure
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Send test email to:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-email@gmail.com"
              />
            </div>

            <button
              onClick={sendTestEmail}
              disabled={status === 'sending' || !email}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
                status === 'sending'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {status === 'sending' ? '📤 Sending...' : '📧 Send Test Email'}
            </button>

            {status === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Success!</h3>
                    <p className="text-green-700 text-sm mb-2">{message}</p>
                    {messageId && (
                      <p className="text-green-600 text-xs font-mono">
                        Message ID: {messageId}
                      </p>
                    )}
                    <div className="mt-4 space-y-2 text-sm text-green-800">
                      <p>✅ Email sent from: <strong>claims@flghtly.com</strong></p>
                      <p>✅ Provider: <strong>Resend</strong></p>
                      <p>📬 Check your inbox (and spam folder)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">❌</span>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                    <p className="text-red-700 text-sm">{message}</p>
                    <div className="mt-4 text-sm text-red-800">
                      <p className="font-semibold mb-2">Troubleshooting:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Check RESEND_API_KEY in .env.local</li>
                        <li>Verify domain in Resend dashboard</li>
                        <li>Check browser console for errors</li>
                        <li>View logs at <a href="https://resend.com/emails" target="_blank" rel="noopener" className="underline">resend.com/emails</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-6 mt-8">
              <h2 className="font-semibold text-gray-900 mb-3">Next Tests:</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="mr-2">1️⃣</span>
                  <div>
                    <strong>Test Email Forwarding:</strong>
                    <br />
                    Send an email TO <code className="bg-gray-100 px-2 py-1 rounded">claims@flghtly.com</code> from another account
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">2️⃣</span>
                  <div>
                    <strong>Test Gmail "Send As":</strong>
                    <br />
                    Compose email in Gmail and select "From: claims@flghtly.com"
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">3️⃣</span>
                  <div>
                    <strong>Check Deliverability:</strong>
                    <br />
                    Visit <a href="https://www.mail-tester.com/" target="_blank" rel="noopener" className="text-blue-600 underline">mail-tester.com</a> and send a test email
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

