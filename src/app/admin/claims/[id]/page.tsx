'use client';

import { useState, useEffect } from 'react';
import { ClaimStatus } from '@/lib/airtable';
import { getAirlineConfig } from '@/lib/airline-config';
import { showError, showSuccess } from '@/lib/toast';

interface Claim {
  id: string;
  claimId: string;
  firstName: string;
  lastName: string;
  email: string;
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
  delayReason?: string;
  status: ClaimStatus;
  submittedAt: string;
  estimatedCompensation?: string;
  boardingPassUrl?: string;
  delayProofUrl?: string;
  filingMethod?: string;
  airlineReference?: string;
  filedBy?: string;
  filedAt?: string;
  nextFollowUpDate?: string;
  airlineResponse?: string;
  internalNotes?: string;
  generatedSubmission?: string;
}

export default function ClaimDetailPage({ params }: { params: { id: string } }) {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionTemplate, setSubmissionTemplate] = useState<any>(null);
  const [generatingSubmission, setGeneratingSubmission] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<ClaimStatus>('submitted');
  const [airlineReference, setAirlineReference] = useState('');
  const [filedBy, setFiledBy] = useState('');
  const [filingMethod, setFilingMethod] = useState<'email' | 'web_form' | 'postal'>('email');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchClaim();
  }, [params.id]);

  const fetchClaim = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/claims/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setClaim(data.data);
        setNewStatus(data.data.status);
        setAirlineReference(data.data.airlineReference || '');
        setFiledBy(data.data.filedBy || '');
        setFilingMethod(data.data.filingMethod || 'email');
        setNotes(data.data.internalNotes || '');
      } else {
        setError(data.error || 'Failed to fetch claim');
      }
    } catch (err) {
      setError('Failed to fetch claim');
    } finally {
      setLoading(false);
    }
  };

  const generateSubmission = async () => {
    try {
      setGeneratingSubmission(true);
      const response = await fetch(`/api/admin/claims/${params.id}/generate-submission`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setSubmissionTemplate(data.data);
        setClaim(prev => prev ? { ...prev, status: 'ready_to_file' } : null);
        showSuccess('Submission materials generated successfully');
      } else {
        showError(data.error || 'Failed to generate submission');
      }
    } catch (err) {
      showError('Failed to generate submission');
    } finally {
      setGeneratingSubmission(false);
    }
  };

  const updateStatus = async () => {
    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/admin/claims/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      const data = await response.json();

      if (data.success) {
        setClaim(prev => prev ? { ...prev, status: newStatus } : null);
        showSuccess('Status updated successfully');
      } else {
        showError(data.error || 'Failed to update status');
      }
    } catch (err) {
      showError('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const markAsFiled = async () => {
    if (!airlineReference || !filedBy) {
      showError('Please provide airline reference and filed by information');
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/admin/claims/${params.id}/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          airlineReference, 
          filedBy, 
          filingMethod 
        }),
      });
      const data = await response.json();

      if (data.success) {
        setClaim(prev => prev ? {
          ...prev,
          status: 'filed',
          airlineReference,
          filedBy,
          filingMethod,
          filedAt: new Date().toISOString()
        } : null);
        showSuccess('Claim marked as filed successfully');
      } else {
        showError(data.error || 'Failed to mark claim as filed');
      }
    } catch (err) {
      showError('Failed to mark claim as filed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: ClaimStatus) => {
    const colors = {
      submitted: 'bg-gray-100 text-gray-800',
      validated: 'bg-blue-100 text-blue-800',
      documents_prepared: 'bg-yellow-100 text-yellow-800',
      ready_to_file: 'bg-orange-100 text-orange-800',
      filed: 'bg-green-100 text-green-800',
      airline_acknowledged: 'bg-green-100 text-green-800',
      monitoring: 'bg-blue-100 text-blue-800',
      airline_responded: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDaysSinceSubmission = () => {
    if (!claim) return 0;
    return Math.floor((Date.now() - new Date(claim.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = () => {
    if (!claim) return false;
    const days = getDaysSinceSubmission();
    return days > 2 && ['submitted', 'validated', 'documents_prepared', 'ready_to_file'].includes(claim.status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claim details...</p>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error || 'Claim not found'}</p>
          <a 
            href="/admin/claims" 
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Claims
          </a>
        </div>
      </div>
    );
  }

  const airlineConfig = getAirlineConfig(claim.airline);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Claim Details</h1>
                <p className="mt-2 text-gray-600">Claim ID: {claim.claimId}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                  {claim.status.replace('_', ' ')}
                </span>
                {isOverdue() && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                    OVERDUE
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Claim Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Claim Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passenger Name</label>
                  <p className="mt-1 text-sm text-gray-900">{claim.firstName} {claim.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{claim.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Flight Number</label>
                  <p className="mt-1 text-sm text-gray-900">{claim.flightNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Airline</label>
                  <p className="mt-1 text-sm text-gray-900">{claim.airline}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Route</label>
                  <p className="mt-1 text-sm text-gray-900">{claim.departureAirport} → {claim.arrivalAirport}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                  <p className="mt-1 text-sm text-gray-900">{claim.departureDate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delay Duration</label>
                  <p className="mt-1 text-sm text-gray-900">{claim.delayDuration}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Compensation</label>
                  <p className="mt-1 text-sm text-gray-900">{claim.estimatedCompensation || 'Not calculated'}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
              <div className="space-y-4">
                {claim.boardingPassUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Boarding Pass</label>
                    <a 
                      href={claim.boardingPassUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Document
                    </a>
                  </div>
                )}
                {claim.delayProofUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delay Proof</label>
                    <a 
                      href={claim.delayProofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Document
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Submission */}
            {submissionTemplate && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Submission</h2>
                <div className="space-y-4">
                  {submissionTemplate.submissionTemplate?.subject && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <p className="mt-1 text-sm text-gray-900">{submissionTemplate.submissionTemplate.subject}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <div className="mt-1 p-4 bg-gray-50 rounded-md">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">{submissionTemplate.submissionTemplate?.body}</pre>
                    </div>
                  </div>
                  {submissionTemplate.submissionTemplate?.attachments && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Required Attachments</label>
                      <ul className="mt-1 text-sm text-gray-900">
                        {submissionTemplate.submissionTemplate.attachments.map((attachment: string, index: number) => (
                          <li key={index}>• {attachment}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Status Update */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ClaimStatus)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="validated">Validated</option>
                    <option value="documents_prepared">Documents Prepared</option>
                    <option value="ready_to_file">Ready to File</option>
                    <option value="filed">Filed</option>
                    <option value="airline_acknowledged">Airline Acknowledged</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="airline_responded">Airline Responded</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add internal notes..."
                  />
                </div>
                <button
                  onClick={updateStatus}
                  disabled={updatingStatus}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>

            {/* Generate Submission */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Submission</h2>
              <button
                onClick={generateSubmission}
                disabled={generatingSubmission}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {generatingSubmission ? 'Generating...' : 'Generate Submission Materials'}
              </button>
            </div>

            {/* Mark as Filed */}
            {claim.status === 'ready_to_file' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Mark as Filed</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Airline Reference</label>
                    <input
                      type="text"
                      value={airlineReference}
                      onChange={(e) => setAirlineReference(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter airline reference number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filed By</label>
                    <input
                      type="text"
                      value={filedBy}
                      onChange={(e) => setFiledBy(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filing Method</label>
                    <select
                      value={filingMethod}
                      onChange={(e) => setFilingMethod(e.target.value as 'email' | 'web_form' | 'postal')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="email">Email</option>
                      <option value="web_form">Web Form</option>
                      <option value="postal">Postal</option>
                    </select>
                  </div>
                  <button
                    onClick={markAsFiled}
                    disabled={updatingStatus}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Processing...' : 'Mark as Filed'}
                  </button>
                </div>
              </div>
            )}

            {/* Airline Information */}
            {airlineConfig && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Airline Information</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Submission Method:</span> {airlineConfig.submissionMethod}
                  </div>
                  {airlineConfig.claimEmail && (
                    <div>
                      <span className="font-medium">Email:</span> {airlineConfig.claimEmail}
                    </div>
                  )}
                  {airlineConfig.claimFormUrl && (
                    <div>
                      <span className="font-medium">Form URL:</span> 
                      <a href={airlineConfig.claimFormUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
                        View Form
                      </a>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Expected Response:</span> {airlineConfig.expectedResponseTime}
                  </div>
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="bg-white shadow rounded-lg p-6">
              <a 
                href="/admin/claims" 
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-center block"
              >
                Back to Claims
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
