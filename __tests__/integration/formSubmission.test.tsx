/**
 * Integration Tests for Form Submission Flows
 * Tests complete user journeys through the form for all disruption types
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, Mock } from 'vitest';
import FlightLookupForm from '@/components/FlightLookupForm';

// Mock PostHog
vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    init: vi.fn(),
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => {
  const motion: any = {};
  const elements = ['div', 'form', 'button', 'input', 'label', 'span', 'p', 'h1', 'h2', 'h3', 'section'];

  // Props to exclude from being passed to DOM
  const motionProps = ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'drag', 'dragConstraints', 'variants'];

  elements.forEach(el => {
    motion[el] = ({ children, ...props }: any) => {
      const filteredProps = { ...props };
      motionProps.forEach(prop => delete filteredProps[prop]);
      return React.createElement(el, filteredProps, children);
    };
  });
  return { motion };
});

// Mock CurrencyContext
vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'EUR' as const,
    setCurrency: vi.fn(),
    isEURegion: true,
  }),
}));

describe('Integration: Delay Claim Submission', () => {
  let mockFetch: Mock;
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              eligibility: {
                isEligible: true,
                compensationAmount: '€600',
                regulation: 'EU261',
                confidence: 95,
                reason: 'Flight delayed over 3 hours',
                message: 'You are eligible for €600 compensation',
              },
              flightDetails: {
                flightNumber: 'BA123',
                departureDate: '2024-01-15',
                route: 'LHR → JFK',
                airline: 'British Airways',
              },
            },
          }),
      })
    );
    global.fetch = mockFetch as any;
  });

  it('should submit a complete delay claim successfully', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    // Step 1: Select disruption type
    fireEvent.click(screen.getByLabelText(/Flight Delayed/i));

    // Wait for delay-specific fields to appear
    await waitFor(() => {
      expect(screen.getByText(/Delay Duration/i)).toBeInTheDocument();
    });

    // Step 2: Fill common fields
    fireEvent.change(screen.getByLabelText(/Departure Date/i), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText(/Flight Number/i), { target: { value: 'BA123' } });
    fireEvent.change(screen.getByPlaceholderText(/British Airways, BA/i), { target: { value: 'British Airways' } });

    // Fill airport fields (simplified - actual implementation uses autocomplete)
    const departureAirportInput = screen.getByPlaceholderText(/Departure/i);
    const arrivalAirportInput = screen.getByPlaceholderText(/Arrival/i);
    fireEvent.change(departureAirportInput, { target: { value: 'LHR' } });
    fireEvent.change(arrivalAirportInput, { target: { value: 'JFK' } });

    // Step 3: Fill delay-specific fields
    const delayInputs = await screen.findAllByPlaceholderText('0');
    const delayHoursInput = delayInputs[0];
    const delayMinutesInput = delayInputs[1];
    fireEvent.change(delayHoursInput, { target: { value: '4' } });
    fireEvent.change(delayMinutesInput, { target: { value: '30' } });

    // Step 4: Fill personal information
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });

    // Step 5: Submit form
    const submitButton = screen.getByRole('button', { name: /Check My Compensation/i });
    fireEvent.click(submitButton);

    // Verify loading callback was called
    expect(mockOnLoading).toHaveBeenCalledWith(true);

    // Wait for API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Verify API payload
    const apiCall = mockFetch.mock.calls[0];
    expect(apiCall[0]).toBe('/api/check-eligibility');

    const payload = JSON.parse(apiCall[1].body);
    expect(payload.disruptionType).toBe('delay');
    expect(payload.flightNumber).toBe('BA123');
    expect(payload.airline).toBe('British Airways');
    expect(payload.delayDuration).toContain('4 hours');
    expect(payload.delayDuration).toContain('30 minutes');
    expect(payload.firstName).toBe('John');
    expect(payload.lastName).toBe('Doe');
    expect(payload.passengerEmail).toBe('john@example.com');

    // Verify results callback was called
    await waitFor(() => {
      expect(mockOnResults).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            eligibility: expect.objectContaining({
              isEligible: true,
              compensationAmount: '€600',
            }),
          }),
        })
      );
    });
  });
});

describe('Integration: Cancellation Claim with Alternative Flight', () => {
  let mockFetch: Mock;
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              eligibility: {
                isEligible: true,
                compensationAmount: '€300',
                regulation: 'EU261',
                confidence: 90,
              },
            },
          }),
      })
    );
    global.fetch = mockFetch as any;
  });

  it('should submit cancellation claim with alternative flight and structured timing', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    // Select cancellation
    fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

    // Wait for cancellation-specific fields to appear
    await waitFor(() => {
      expect(screen.getByText(/When were you notified/i)).toBeInTheDocument();
    });

    // Fill common fields
    fireEvent.change(screen.getByLabelText(/Departure Date/i), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText(/Flight Number/i), { target: { value: 'BA123' } });
    fireEvent.change(screen.getByPlaceholderText(/British Airways, BA/i), { target: { value: 'British Airways' } });

    const departureAirportInput = screen.getByPlaceholderText(/Departure/i);
    const arrivalAirportInput = screen.getByPlaceholderText(/Arrival/i);
    fireEvent.change(departureAirportInput, { target: { value: 'LHR' } });
    fireEvent.change(arrivalAirportInput, { target: { value: 'JFK' } });

    // Fill cancellation-specific fields
    fireEvent.change(screen.getByLabelText(/When were you notified/i), { target: { value: '2024-01-10' } });

    // Wait for auto-calculated notice period
    await waitFor(() => {
      expect(screen.getByText(/✓ Calculated: Less than 7 days notice/i)).toBeInTheDocument();
    });

    // Check alternative offered
    fireEvent.click(screen.getByLabelText(/Airline offered an alternative flight/i));

    // Fill alternative timing with structured inputs
    await waitFor(() => {
      expect(screen.getByText(/How much later did the alternative depart/i)).toBeInTheDocument();
    });

    const inputs = screen.getAllByPlaceholderText('0');
    // Alternative departure hours
    fireEvent.change(inputs[0], { target: { value: '3' } });
    // Alternative departure minutes
    fireEvent.change(inputs[1], { target: { value: '25' } });
    // Alternative arrival hours
    fireEvent.change(inputs[2], { target: { value: '2' } });
    // Alternative arrival minutes
    fireEvent.change(inputs[3], { target: { value: '15' } });

    // Fill personal info
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Check My Compensation/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Verify payload includes enhanced alternative flight data
    const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(payload.disruptionType).toBe('cancellation');
    expect(payload.noticeGiven).toBe('< 7 days');
    expect(payload.alternativeOffered).toBe(true);

    // Legacy format
    expect(payload.alternativeTiming).toContain('3h 25m departure');
    expect(payload.alternativeTiming).toContain('2h 15m arrival');

    // Enhanced format
    expect(payload.alternativeFlight).toBeDefined();
    expect(payload.alternativeFlight.offered).toBe(true);
    expect(payload.alternativeFlight.departureTimeDifference).toBeCloseTo(3.417, 2);
    expect(payload.alternativeFlight.arrivalTimeDifference).toBe(2.25);
  });

  it('should allow user to correct auto-calculated notice period', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

    // Wait for cancellation fields
    await waitFor(() => {
      expect(screen.getByText(/When were you notified/i)).toBeInTheDocument();
    });

    // Fill dates
    fireEvent.change(screen.getByLabelText(/Departure Date/i), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText(/When were you notified/i), { target: { value: '2024-01-10' } });

    // Wait for auto-calculation
    await waitFor(() => {
      expect(screen.getByText(/✓ Calculated: Less than 7 days notice/i)).toBeInTheDocument();
    });

    // Click Edit
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Dropdown should appear
    await waitFor(() => {
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeInTheDocument();
    });

    // Change value
    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: '7-14 days' } });

    // Fill remaining fields
    fireEvent.change(screen.getByLabelText(/Flight Number/i), { target: { value: 'BA123' } });
    fireEvent.change(screen.getByPlaceholderText(/British Airways, BA/i), { target: { value: 'British Airways' } });
    fireEvent.change(screen.getByPlaceholderText(/Departure/i), { target: { value: 'LHR' } });
    fireEvent.change(screen.getByPlaceholderText(/Arrival/i), { target: { value: 'JFK' } });
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Check My Compensation/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Verify corrected value was sent
    const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(payload.noticeGiven).toBe('7-14 days');
  });
});

describe('Integration: Denied Boarding with Alternative Flight', () => {
  let mockFetch: Mock;
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              eligibility: {
                isEligible: true,
                compensationAmount: '$775',
                regulation: 'US DOT',
                confidence: 95,
              },
            },
          }),
      })
    );
    global.fetch = mockFetch as any;
  });

  it('should submit denied boarding claim with structured alternative delay tiers', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    // Select denied boarding
    fireEvent.click(screen.getByLabelText(/Denied Boarding/i));

    // Wait for denied boarding fields
    await waitFor(() => {
      expect(screen.getByText(/Type of Denied Boarding/i)).toBeInTheDocument();
    });

    // Fill common fields
    fireEvent.change(screen.getByLabelText(/Departure Date/i), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText(/Flight Number/i), { target: { value: 'AA456' } });
    fireEvent.change(screen.getByPlaceholderText(/British Airways, BA/i), { target: { value: 'American Airlines' } });
    fireEvent.change(screen.getByPlaceholderText(/Departure/i), { target: { value: 'JFK' } });
    fireEvent.change(screen.getByPlaceholderText(/Arrival/i), { target: { value: 'LAX' } });

    // Fill denied boarding specific fields
    fireEvent.click(screen.getByLabelText(/involuntary/i));

    const reasonDropdown = screen.getByLabelText(/Reason for denied boarding/i);
    fireEvent.change(reasonDropdown, { target: { value: 'overbooking' } });

    // Check alternative offered
    fireEvent.click(screen.getByLabelText(/Airline offered an alternative flight/i));

    // Select alternative delay tier (radio button)
    await waitFor(() => {
      expect(screen.getByLabelText(/1-2 hours/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/1-2 hours/i));

    // Fill check-in time
    fireEvent.change(screen.getByLabelText(/What time did you check in/i), { target: { value: '10:30' } });

    // Fill ticket price
    const ticketPriceInput = screen.getByLabelText(/One-Way Ticket Price/i);
    fireEvent.change(ticketPriceInput, { target: { value: '450' } });

    // Fill personal info
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Johnson' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'bob@example.com' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Check My Compensation/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Verify payload
    const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(payload.disruptionType).toBe('denied_boarding');
    expect(payload.boardingType).toBe('involuntary');
    expect(payload.deniedBoardingReason).toBe('overbooking');
    expect(payload.alternativeOffered).toBe(true);
    expect(payload.alternativeArrivalDelay).toBe('1-2');  // Structured tier value
    expect(payload.ticketPrice).toBe(450);
  });

  it('should handle round-trip ticket price correctly', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Denied Boarding/i));

    // Wait for denied boarding fields
    await waitFor(() => {
      expect(screen.getByText(/Type of Denied Boarding/i)).toBeInTheDocument();
    });

    // Fill minimum required fields
    fireEvent.change(screen.getByLabelText(/Departure Date/i), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText(/Flight Number/i), { target: { value: 'AA456' } });
    fireEvent.change(screen.getByPlaceholderText(/British Airways, BA/i), { target: { value: 'American Airlines' } });
    fireEvent.change(screen.getByPlaceholderText(/Departure/i), { target: { value: 'JFK' } });
    fireEvent.change(screen.getByPlaceholderText(/Arrival/i), { target: { value: 'LAX' } });
    fireEvent.click(screen.getByLabelText(/involuntary/i));
    fireEvent.change(screen.getByLabelText(/Reason for denied boarding/i), { target: { value: 'overbooking' } });
    fireEvent.change(screen.getByLabelText(/What time did you check in/i), { target: { value: '10:30' } });

    // Enter round-trip price
    const ticketPriceInput = screen.getByLabelText(/One-Way Ticket Price/i);
    fireEvent.change(ticketPriceInput, { target: { value: '900' } });

    // Check round-trip checkbox
    fireEvent.click(screen.getByLabelText(/This was a round-trip ticket/i));

    // Fill personal info
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Johnson' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'bob@example.com' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Check My Compensation/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Verify price was divided by 2
    const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(payload.ticketPrice).toBe(450);  // 900 / 2
  });
});

describe('Integration: Downgrade Claim with Live Preview', () => {
  let mockFetch: Mock;
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              eligibility: {
                isEligible: true,
                compensationAmount: '$750',
                regulation: 'EU261',
                confidence: 100,
              },
            },
          }),
      })
    );
    global.fetch = mockFetch as any;
  });

  it('should submit downgrade claim successfully', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    // Select downgrade
    fireEvent.click(screen.getByLabelText(/Seat Downgrade/i));

    // Wait for downgrade fields
    await waitFor(() => {
      expect(screen.getByText(/Class Paid For/i)).toBeInTheDocument();
    });

    // Fill common fields
    fireEvent.change(screen.getByLabelText(/Departure Date/i), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText(/Flight Number/i), { target: { value: 'LH789' } });
    fireEvent.change(screen.getByPlaceholderText(/British Airways, BA/i), { target: { value: 'Lufthansa' } });
    fireEvent.change(screen.getByPlaceholderText(/Departure/i), { target: { value: 'FRA' } });
    fireEvent.change(screen.getByPlaceholderText(/Arrival/i), { target: { value: 'SFO' } });

    // Fill downgrade-specific fields
    const classPaidForDropdown = screen.getByLabelText(/Class Paid For/i);
    fireEvent.change(classPaidForDropdown, { target: { value: 'business' } });

    const classReceivedDropdown = screen.getByLabelText(/Class Received/i);
    fireEvent.change(classReceivedDropdown, { target: { value: 'economy' } });

    // Fill ticket price
    const ticketPriceInput = screen.getByLabelText(/One-Way Ticket Price/i);
    fireEvent.change(ticketPriceInput, { target: { value: '2500' } });

    // Fill personal info
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Williams' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'alice@example.com' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Check My Compensation/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Verify payload
    const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(payload.disruptionType).toBe('downgrade');
    expect(payload.classPaidFor).toBe('business');
    expect(payload.classReceived).toBe('economy');
    expect(payload.ticketPrice).toBe(2500);
  });
});

describe('Integration: Error Handling', () => {
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as any;

    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    // Fill and submit form
    fireEvent.click(screen.getByLabelText(/Flight Delayed/i));

    // Wait for delay-specific fields
    await waitFor(() => {
      expect(screen.getByText(/Delay Duration/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Departure Date/i), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText(/Flight Number/i), { target: { value: 'BA123' } });
    fireEvent.change(screen.getByPlaceholderText(/British Airways, BA/i), { target: { value: 'British Airways' } });
    fireEvent.change(screen.getByPlaceholderText(/Departure/i), { target: { value: 'LHR' } });
    fireEvent.change(screen.getByPlaceholderText(/Arrival/i), { target: { value: 'JFK' } });

    // Fill delay duration
    const inputs = await screen.findAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '4' } });

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Check My Compensation/i }));

    // Verify loading states were managed
    expect(mockOnLoading).toHaveBeenCalledWith(true);

    await waitFor(() => {
      expect(mockOnLoading).toHaveBeenCalledWith(false);
    });
  });
});
