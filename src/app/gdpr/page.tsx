'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getDataSubjectRightsInfo } from '@/lib/gdpr';

interface GDPRRequest {
  type: string;
  email: string;
  reason?: string;
}

export default function GDPRCompliancePage() {
  const [request, setRequest] = useState<GDPRRequest>({
    type: '',
    email: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const rightsInfo = getDataSubjectRightsInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/gdpr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setResponse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 via-pink-50 to-orange-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            GDPR Data Subject Rights
          </h1>
          <p className="text-xl text-gray-600">
            Exercise your data protection rights under GDPR and UK GDPR
          </p>
        </div>

        {/* Rights Information */}
        <Card className="bg-white/90 border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Your Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {rightsInfo.rights.map((right, index) => (
                <div key={index} className="bg-white/60 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{right.name}</h3>
                  <p className="text-gray-700 text-sm mb-2">{right.description}</p>
                  <p className="text-gray-600 text-xs">Response time: {right.responseTime}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Request Form */}
        <Card className="bg-white/90 border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Submit a Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="type" className="text-gray-900">Request Type</Label>
                <select
                  id="type"
                  value={request.type}
                  onChange={(e) => setRequest({ ...request, type: e.target.value })}
                  className="w-full bg-white/60 border border-gray-300 text-gray-900 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select request type</option>
                  <option value="access">Access - Get a copy of my data</option>
                  <option value="rectification">Rectification - Correct my data</option>
                  <option value="erasure">Erasure - Delete my data</option>
                  <option value="portability">Portability - Export my data</option>
                  <option value="objection">Objection - Object to processing</option>
                  <option value="restriction">Restriction - Limit processing</option>
                </select>
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-900">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={request.email}
                  onChange={(e) => setRequest({ ...request, email: e.target.value })}
                  className="bg-white/60 border-gray-300 text-gray-900"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {(request.type === 'objection' || request.type === 'restriction') && (
                <div>
                  <Label htmlFor="reason" className="text-gray-900">Reason (Required)</Label>
                  <Textarea
                    id="reason"
                    value={request.reason}
                    onChange={(e) => setRequest({ ...request, reason: e.target.value })}
                    className="bg-white/60 border-gray-300 text-gray-900"
                    placeholder="Please explain your reason for this request..."
                    rows={4}
                    required={request.type === 'objection' || request.type === 'restriction'}
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !request.type || !request.email}
                className="w-full bg-blue-600 hover:bg-blue-700 text-gray-900"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Response */}
        {response && (
          <Card className="bg-green-900 border-green-700 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-green-100">Request Submitted Successfully</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-green-200">{response.data.message}</p>
                <div className="bg-green-800 rounded-lg p-4">
                  <p className="text-green-100 font-semibold">Request ID: {response.requestId}</p>
                  <p className="text-green-200 text-sm">Keep this ID for reference</p>
                </div>
                <div>
                  <h3 className="text-green-100 font-semibold mb-2">Next Steps:</h3>
                  <ul className="list-disc list-inside text-green-200 space-y-1">
                    {response.data.nextSteps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-800 rounded-lg p-4">
                  <h3 className="text-green-100 font-semibold mb-2">Contact Information:</h3>
                  <p className="text-green-200 text-sm">
                    Email: {response.contactInfo.email}
                  </p>
                  <p className="text-green-200 text-sm">
                    Response Time: {response.contactInfo.responseTime}
                  </p>
                  <p className="text-green-200 text-sm">
                    EU Representative: {response.contactInfo.euRepresentative}
                  </p>
                </div>
              </div>
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

        {/* Contact Information */}
        <Card className="bg-white/90 border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/60 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Privacy Team</h3>
                <p className="text-gray-700 text-sm">privacy@flghtly.com</p>
                <p className="text-gray-600 text-xs">General privacy inquiries</p>
              </div>
              <div className="bg-white/60 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Data Protection Officer</h3>
                <p className="text-gray-700 text-sm">dpo@flghtly.com</p>
                <p className="text-gray-600 text-xs">Data protection matters</p>
              </div>
              <div className="bg-white/60 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">EU Representative</h3>
                <p className="text-gray-700 text-sm">eu-representative@flghtly.com</p>
                <p className="text-gray-600 text-xs">EU data protection authority liaison</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
