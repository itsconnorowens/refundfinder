'use client';

import { CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface VerificationStep {
  id: string;
  name: string;
  status: 'success' | 'checking' | 'failed' | 'pending';
  message: string;
}

interface VerificationData {
  status: 'verified' | 'failed' | 'manual' | 'pending';
  confidence: number;
  message: string;
  actualData?: {
    delayMinutes: number;
  };
  userReportedData?: {
    delayMinutes: number;
  };
  verificationSteps: VerificationStep[];
}

interface VerificationVisualizationProps {
  verificationData: VerificationData;
}

export default function VerificationVisualization({ verificationData }: VerificationVisualizationProps) {
  const getStepIcon = (status: VerificationStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepStyles = (status: VerificationStep['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'checking':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Verification Message */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Verification Status</p>
              <p className="text-sm text-blue-700 mt-1">{verificationData.message}</p>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Verification Progress</h4>
            {verificationData.verificationSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${getStepStyles(step.status)}`}
              >
                <div className="flex-shrink-0 mt-0.5">{getStepIcon(step.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{step.name}</p>
                    <span className="text-xs text-gray-500">
                      Step {index + 1}/{verificationData.verificationSteps.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{step.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Data Comparison (if available) */}
          {verificationData.actualData && verificationData.userReportedData && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Comparison</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Airline Records</p>
                  <p className="text-sm font-medium text-gray-900">
                    {verificationData.actualData.delayMinutes} minutes delay
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Your Report</p>
                  <p className="text-sm font-medium text-gray-900">
                    {verificationData.userReportedData.delayMinutes} minutes delay
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confidence Indicator */}
          <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <span className="text-sm text-gray-700">Verification Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    verificationData.confidence >= 80
                      ? 'bg-green-500'
                      : verificationData.confidence >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${verificationData.confidence}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900">{verificationData.confidence}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

