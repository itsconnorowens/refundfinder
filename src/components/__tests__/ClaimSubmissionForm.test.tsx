import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClaimSubmissionForm from '../ClaimSubmissionForm';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

// Mock the Stripe components
vi.mock('../StripeProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../PaymentStep', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="payment-step">
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

describe('ClaimSubmissionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('should render the form with first step', () => {
    render(<ClaimSubmissionForm />);
    
    expect(screen.getByText('Personal Info')).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm />);
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    await user.type(emailInput, 'invalid-email');
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should allow navigation to next step when valid', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm />);
    
    // Fill in step 1
    await user.type(screen.getByLabelText(/First Name/i), 'John');
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe');
    await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);
    
    await waitFor(() => {
      expect(screen.getByText('Flight Details')).toBeInTheDocument();
    });
  });

  it('should allow navigation back to previous step', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm />);
    
    // Fill step 1 and go to step 2
    await user.type(screen.getByLabelText(/First Name/i), 'John');
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe');
    await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Flight Details')).toBeInTheDocument();
    });
    
    // Go back
    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);
    
    await waitFor(() => {
      expect(screen.getByText('Personal Info')).toBeInTheDocument();
    });
  });

  it('should persist form data in localStorage', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm />);
    
    await user.type(screen.getByLabelText(/First Name/i), 'John');
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe');
    
    await waitFor(() => {
      const savedData = localStorage.getItem('claimFormData');
      expect(savedData).toBeTruthy();
      const parsed = JSON.parse(savedData!);
      expect(parsed.firstName).toBe('John');
      expect(parsed.lastName).toBe('Doe');
    });
  });

  it('should show progress indicator', () => {
    render(<ClaimSubmissionForm />);
    
    const progressSteps = screen.getAllByText(/Personal Info|Flight Details|Documentation|Review|Payment/);
    expect(progressSteps.length).toBeGreaterThan(0);
  });

  it('should disable back button on first step', () => {
    render(<ClaimSubmissionForm />);
    
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeDisabled();
  });
});

describe('Form Validation', () => {
  it('should validate required fields for step 2', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm />);
    
    // Navigate to step 2
    await user.type(screen.getByLabelText(/First Name/i), 'John');
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe');
    await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Flight Details')).toBeInTheDocument();
    });
    
    // Try to continue without filling fields
    await user.click(screen.getByRole('button', { name: /continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Flight number is required')).toBeInTheDocument();
    });
  });

  it('should clear errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm />);
    
    const firstNameInput = screen.getByLabelText(/First Name/i);
    
    // Trigger validation error
    await user.click(screen.getByRole('button', { name: /continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
    
    // Start typing - error should clear
    await user.type(firstNameInput, 'J');
    
    await waitFor(() => {
      expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
    });
  });
});

