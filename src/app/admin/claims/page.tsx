'use client';

import { useState, useEffect } from 'react';
import { ClaimStatus } from '@/lib/airtable';

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
  status: ClaimStatus;
  submittedAt: string;
  estimatedCompensation?: string;
}

interface ClaimsStats {
  total: number;
  byStatus: Record<ClaimStatus, number>;
  readyToFile: number;
  overdue: number;
  needingFollowUp: number;
}

export default function AdminDashboard() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<ClaimsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus | 'all'>('all');
  const [selectedAirline, setSelectedAirline] = useState<string>('all');

  useEffect(() => {
    fetchClaims();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedAirline]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (selectedAirline !== 'all') {
        params.append('airline', selectedAirline);
      }

      const response = await fetch(`/api/admin/claims?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setClaims(data.data.claims);
      } else {
        setError(data.error || 'Failed to fetch claims');
      }
    } catch {
      setError('Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/claims/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch {
      console.error('Failed to fetch stats');
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
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysSinceSubmission = (submittedAt: string) => {
    const days = Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const isOverdue = (claim: Claim) => {
    const days = getDaysSinceSubmission(claim.submittedAt);
    return days > 2 && ['submitted', 'validated', 'documents_prepared', 'ready_to_file'].includes(claim.status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claims...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage flight compensation claims</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-gray-600">Total Claims</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-orange-600">{stats.readyToFile}</div>
              <div className="text-gray-600">Ready to File</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-gray-600">Overdue</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.needingFollowUp}</div>
              <div className="text-gray-600">Need Follow-up</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ClaimStatus | 'all')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Airline
              </label>
              <select
                value={selectedAirline}
                onChange={(e) => setSelectedAirline(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Airlines</option>
                <option value="British Airways">British Airways</option>
                <option value="Ryanair">Ryanair</option>
                <option value="EasyJet">EasyJet</option>
                <option value="Lufthansa">Lufthansa</option>
                <option value="Air France">Air France</option>
                <option value="KLM">KLM</option>
                <option value="Iberia">Iberia</option>
                <option value="Alitalia">Alitalia</option>
                <option value="SAS Scandinavian">SAS Scandinavian</option>
                <option value="TAP Air Portugal">TAP Air Portugal</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Claims ({claims.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Passenger
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Airline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims.map((claim) => (
                  <tr key={claim.id} className={isOverdue(claim) ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {claim.claimId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.firstName} {claim.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.flightNumber}
                      <br />
                      <span className="text-gray-500">{claim.departureAirport} → {claim.arrivalAirport}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.airline}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                        {claim.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(claim.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={isOverdue(claim) ? 'text-red-600 font-bold' : ''}>
                        {getDaysSinceSubmission(claim.submittedAt)} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href={`/admin/claims/${claim.claimId}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
