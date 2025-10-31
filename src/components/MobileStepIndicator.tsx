'use client';

import { ChevronLeft } from 'lucide-react';

interface MobileStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  onBack?: () => void;
  canGoBack?: boolean;
}

export function MobileStepIndicator({
  currentStep,
  totalSteps,
  stepName,
  onBack,
  canGoBack = true
}: MobileStepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {canGoBack && currentStep > 1 && onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded"
                aria-label="Go back"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div>
              <div className="text-sm font-medium text-gray-900">
                Step {currentStep} of {totalSteps}
              </div>
              <div className="text-xs text-gray-500">{stepName}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
