'use client';

import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VerificationScoreCardProps {
  status: 'verified' | 'failed' | 'manual' | 'pending';
  score: {
    overall: number;
    flightData: number;
    timingAccuracy: number;
    routeValidation: number;
    airlineConfirmation: number;
  };
}

export default function VerificationScoreCard({ status, score }: VerificationScoreCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Verification Successful',
          description: 'Your flight details have been verified with airline records',
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Verification Failed',
          description: 'Unable to automatically verify. Manual review required.',
        };
      case 'manual':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Manual Review Required',
          description: 'We\'ll manually verify your claim within 24 hours',
        };
      default:
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Verifying...',
          description: 'Checking flight records with airline databases',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const scoreItems = [
    { label: 'Flight Data', value: score.flightData },
    { label: 'Timing Accuracy', value: score.timingAccuracy },
    { label: 'Route Validation', value: score.routeValidation },
    { label: 'Airline Confirmation', value: score.airlineConfirmation },
  ];

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full bg-white`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div>
            <CardTitle className="text-lg">{config.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Score */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Confidence</span>
              <span className="text-sm font-bold text-gray-900">{score.overall}%</span>
            </div>
            <Progress value={score.overall} className="h-2" />
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {scoreItems.map((item) => (
              <div key={item.label} className="bg-white rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600">{item.label}</span>
                  <span className="text-xs font-bold text-gray-900">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-1" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

