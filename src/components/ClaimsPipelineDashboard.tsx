/**
 * Claims Pipeline Dashboard Component
 * Visual representation of claims flow with real-time metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, FileText, Plane } from 'lucide-react';

interface PipelineStats {
  total: number;
  byStatus: Record<string, number>;
  readyToFile: number;
  overdue: number;
  needingFollowUp: number;
}

interface FollowUpStats {
  totalFollowUps: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  followUpsByType: Record<string, number>;
}

interface MonitoringStats {
  emailDeliveryRate: number;
  averageResponseTime: number;
  claimsFiledToday: number;
  overdueClaims: number;
  systemUptime: number;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    timestamp: string;
  }>;
}

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-blue-500', icon: FileText },
  validated: { label: 'Validated', color: 'bg-green-500', icon: CheckCircle },
  documents_prepared: { label: 'Documents Ready', color: 'bg-yellow-500', icon: FileText },
  ready_to_file: { label: 'Ready to File', color: 'bg-orange-500', icon: Clock },
  filed: { label: 'Filed', color: 'bg-purple-500', icon: Plane },
  airline_acknowledged: { label: 'Acknowledged', color: 'bg-indigo-500', icon: CheckCircle },
  monitoring: { label: 'Monitoring', color: 'bg-cyan-500', icon: Clock },
  airline_responded: { label: 'Responded', color: 'bg-teal-500', icon: CheckCircle },
  approved: { label: 'Approved', color: 'bg-green-600', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: AlertTriangle },
  completed: { label: 'Completed', color: 'bg-gray-600', icon: CheckCircle },
  refunded: { label: 'Refunded', color: 'bg-pink-500', icon: CheckCircle },
};

export default function ClaimsPipelineDashboard() {
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [followUpStats, setFollowUpStats] = useState<FollowUpStats | null>(null);
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pipeline stats
      const pipelineResponse = await fetch('/api/admin/claims/stats');
      const pipelineData = await pipelineResponse.json();
      setPipelineStats(pipelineData.data);

      // Fetch follow-up stats
      const followUpResponse = await fetch('/api/admin/follow-ups/stats');
      const followUpData = await followUpResponse.json();
      setFollowUpStats(followUpData.data);

      // Fetch monitoring stats
      const monitoringResponse = await fetch('/api/monitoring/stats');
      const monitoringData = await monitoringResponse.json();
      setMonitoringStats(monitoringData.data);

      setLastUpdated(new Date());
    } catch (error: unknown) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusOrder = () => [
    'submitted', 'validated', 'documents_prepared', 'ready_to_file',
    'filed', 'airline_acknowledged', 'monitoring', 'airline_responded',
    'approved', 'rejected', 'completed', 'refunded'
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading && !pipelineStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Claims Pipeline Dashboard</h1>
          <p className="text-gray-600">
            Real-time view of claim processing and system health
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Alerts */}
      {monitoringStats?.alerts && monitoringStats.alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">System Alerts</h2>
          {monitoringStats.alerts.map((alert) => (
            <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.title}</strong> - {alert.message}
                <span className="text-xs ml-2">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time claims processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to File</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pipelineStats?.readyToFile || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting airline submission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Claims</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pipelineStats?.overdue || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Past 48-hour deadline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {monitoringStats?.emailDeliveryRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered emails
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Claims Pipeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Pipeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Visual representation of claims flowing through the system
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Pipeline Flow */}
            <div className="flex flex-wrap gap-2">
              {getStatusOrder().map((status, index) => {
                const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                const count = pipelineStats?.byStatus[status] || 0;
                const Icon = config.icon;
                
                return (
                  <div key={status} className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-3 min-w-[140px]">
                      <div className={`p-2 rounded-full ${config.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{config.label}</div>
                        <div className="text-lg font-bold">{count}</div>
                      </div>
                    </div>
                    {index < getStatusOrder().length - 1 && (
                      <div className="text-gray-400">→</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pipeline Progress</span>
                <span>
                  {pipelineStats ? 
                    Math.round(((pipelineStats.total - pipelineStats.overdue) / pipelineStats.total) * 100) : 0
                  }% Complete
                </span>
              </div>
              <Progress 
                value={pipelineStats ? 
                  ((pipelineStats.total - pipelineStats.overdue) / pipelineStats.total) * 100 : 0
                } 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Statistics */}
      {followUpStats && (
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Statistics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automated follow-ups with airlines
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{followUpStats.totalFollowUps}</div>
                <div className="text-sm text-muted-foreground">Total Follow-ups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{followUpStats.pendingFollowUps}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{followUpStats.overdueFollowUps}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {followUpStats.totalFollowUps - followUpStats.pendingFollowUps - followUpStats.overdueFollowUps}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>

            {/* Follow-up Types */}
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Follow-ups by Type</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(followUpStats.followUpsByType).map(([type, count]) => (
                  <Badge key={type} variant="outline">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      {monitoringStats && (
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <p className="text-sm text-muted-foreground">
              Overall system performance metrics
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {monitoringStats.systemUptime}%
                </div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {monitoringStats.averageResponseTime}h
                </div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {monitoringStats.claimsFiledToday}
                </div>
                <div className="text-sm text-muted-foreground">Filed Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
