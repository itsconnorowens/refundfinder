'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface RefundAnalytics {
  period: string;
  startDate: string;
  endDate: string;
  totalClaims: number;
  totalPayments: number;
  totalRefunds: number;
  refundRate: number;
  totalRevenue: number;
  totalRefunded: number;
  netRevenue: number;
  refundsByTrigger: Record<string, {
    count: number;
    amount: number;
    percentage: number;
  }>;
  averageRefundTime: number;
  claimsByStatus: Record<string, number>;
  dailyRefundRate: Array<{
    date: string;
    refundRate: number;
    refundCount: number;
    claimCount: number;
  }>;
}

interface RefundAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
  createdAt: string;
  acknowledged: boolean;
}

interface RefundPerformanceMetrics {
  overall: {
    refundRate: number;
    averageRefundTime: number;
    customerSatisfaction: number;
  };
  byTrigger: Record<string, {
    count: number;
    rate: number;
    averageTime: number;
  }>;
  recommendations: string[];
}

export default function RefundAdminDashboard() {
  const [analytics, setAnalytics] = useState<RefundAnalytics | null>(null);
  const [alerts, setAlerts] = useState<RefundAlert[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<RefundPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, alertsRes, performanceRes] = await Promise.all([
        fetch('/api/refund-analytics/dashboard'),
        fetch('/api/refund-analytics/alerts'),
        fetch('/api/refund-analytics/performance'),
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.data.currentPeriod);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.data);
      }

      if (performanceRes.ok) {
        const performanceData = await performanceRes.json();
        setPerformanceMetrics(performanceData.data);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#00D9B5] animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Refund Management Dashboard</h1>
          <p className="text-slate-400">Monitor and manage refund operations</p>
          <Button 
            onClick={fetchDashboardData}
            className="mt-4 bg-[#00D9B5] hover:bg-[#00D9B5]/90 text-slate-950"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Active Alerts</h2>
            <div className="grid gap-4">
              {alerts.map((alert) => (
                <Alert key={alert.id} className="border-slate-700">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className={`inline-block w-3 h-3 rounded-full ${getSeverityColor(alert.severity)} mr-2`}></span>
                      <strong className="text-white">{alert.title}</strong>
                      <p className="text-slate-400 mt-1">{alert.message}</p>
                    </div>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {alert.severity}
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Refund Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-[#00D9B5]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatPercentage(analytics.refundRate)}</div>
                <p className="text-xs text-slate-400">
                  {analytics.totalRefunds} of {analytics.totalClaims} claims
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Net Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-[#00D9B5]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(analytics.netRevenue)}</div>
                <p className="text-xs text-slate-400">
                  After {formatCurrency(analytics.totalRefunded)} refunds
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Avg Refund Time</CardTitle>
                <Clock className="h-4 w-4 text-[#00D9B5]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{analytics.averageRefundTime.toFixed(1)}h</div>
                <p className="text-xs text-slate-400">From submission to refund</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Claims</CardTitle>
                <Users className="h-4 w-4 text-[#00D9B5]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{analytics.totalClaims}</div>
                <p className="text-xs text-slate-400">This period</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="text-slate-400 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="triggers" className="text-slate-400 data-[state=active]:text-white">
              Refund Triggers
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-slate-400 data-[state=active]:text-white">
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {analytics && (
              <>
                {/* Refunds by Trigger */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Refunds by Trigger</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.refundsByTrigger).map(([trigger, data]) => (
                        <div key={trigger} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                          <div>
                            <h4 className="text-white font-medium capitalize">
                              {trigger.replace(/_/g, ' ')}
                            </h4>
                            <p className="text-slate-400 text-sm">
                              {data.count} refunds • {formatCurrency(data.amount)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-slate-400 border-slate-600">
                            {formatPercentage(data.percentage)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Claims by Status */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Claims by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(analytics.claimsByStatus).map(([status, count]) => (
                        <div key={status} className="text-center p-4 bg-slate-700 rounded-lg">
                          <div className="text-2xl font-bold text-white">{count}</div>
                          <div className="text-slate-400 text-sm capitalize">{status}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="triggers" className="space-y-6">
            {analytics && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Refund Trigger Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(analytics.refundsByTrigger).map(([trigger, data]) => (
                      <div key={trigger} className="p-6 bg-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white capitalize">
                            {trigger.replace(/_/g, ' ')}
                          </h3>
                          <Badge variant="outline" className="text-slate-400 border-slate-600">
                            {formatPercentage(data.percentage)} of total refunds
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-[#00D9B5]">{data.count}</div>
                            <div className="text-slate-400 text-sm">Refunds</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-[#00D9B5]">{formatCurrency(data.amount)}</div>
                            <div className="text-slate-400 text-sm">Total Amount</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-[#00D9B5]">{formatCurrency(data.amount / data.count)}</div>
                            <div className="text-slate-400 text-sm">Avg per Refund</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {performanceMetrics && (
              <>
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-slate-700 rounded-lg">
                        <div className="text-3xl font-bold text-[#00D9B5] mb-2">
                          {formatPercentage(performanceMetrics.overall.refundRate)}
                        </div>
                        <div className="text-slate-400">Overall Refund Rate</div>
                      </div>
                      <div className="text-center p-6 bg-slate-700 rounded-lg">
                        <div className="text-3xl font-bold text-[#00D9B5] mb-2">
                          {performanceMetrics.overall.averageRefundTime.toFixed(1)}h
                        </div>
                        <div className="text-slate-400">Avg Refund Time</div>
                      </div>
                      <div className="text-center p-6 bg-slate-700 rounded-lg">
                        <div className="text-3xl font-bold text-[#00D9B5] mb-2">
                          {formatPercentage(performanceMetrics.overall.customerSatisfaction)}
                        </div>
                        <div className="text-slate-400">Customer Satisfaction</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {performanceMetrics.recommendations.length > 0 && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {performanceMetrics.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-3 p-4 bg-slate-700 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-[#00D9B5] mt-0.5 flex-shrink-0" />
                            <p className="text-slate-300">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
