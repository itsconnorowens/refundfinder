'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EmailTestPage() {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestEmail = async () => {
    if (!testEmail) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/email?action=test', {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueueStatus = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/email?action=status', {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get queue status');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailedEmails = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/email?action=failed', {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get failed emails');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Email System Testing
          </h1>
          <p className="text-xl text-slate-400">
            Test and monitor email functionality
          </p>
        </div>

        {/* Test Email Form */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Send Test Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="testEmail" className="text-white">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="test@example.com"
                />
              </div>
              
              <Button
                onClick={handleTestEmail}
                disabled={isLoading || !testEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Queue Management */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Email Queue Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={handleQueueStatus}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Get Queue Status
              </Button>
              
              <Button
                onClick={handleFailedEmails}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Get Failed Emails
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="bg-green-900 border-green-700 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-green-100">Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-green-200 text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="bg-red-900 border-red-700 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-red-100">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Console Mode (Default)</h3>
              <p>Emails will be logged to the console. No setup required.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">2. SendGrid Setup</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Get API key from SendGrid dashboard</li>
                <li>Set EMAIL_PROVIDER=sendgrid in .env.local</li>
                <li>Set SENDGRID_API_KEY=your_api_key</li>
                <li>Set SENDGRID_FROM_EMAIL=your_verified_email</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Resend Setup</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Get API key from Resend dashboard</li>
                <li>Set EMAIL_PROVIDER=resend in .env.local</li>
                <li>Set RESEND_API_KEY=your_api_key</li>
                <li>Set RESEND_FROM_EMAIL=your_verified_email</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">4. SMTP Setup (Gmail)</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Enable 2-factor authentication</li>
                <li>Generate app password</li>
                <li>Set EMAIL_PROVIDER=smtp in .env.local</li>
                <li>Set SMTP_HOST=smtp.gmail.com</li>
                <li>Set SMTP_USER=your_email@gmail.com</li>
                <li>Set SMTP_PASS=your_app_password</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
