'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileNavProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  isLoading?: boolean;
}

export function MobileNav({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  canGoBack,
  isLoading,
}: MobileNavProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack || isLoading}
          className="flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className="flex items-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Loading...
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 p-4 z-10">
        <div className="max-w-md mx-auto">
          {/* Progress bar */}
          <div className="mb-3">
            <Progress value={progress} className="h-1.5 mb-2" />
            <p className="text-xs text-slate-500 text-center">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={!canGoBack || isLoading}
              className="flex-1 flex items-center justify-center min-h-[48px]"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <Button
              type="button"
              onClick={onNext}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center min-h-[48px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

