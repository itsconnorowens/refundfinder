/**
 * Component Tests for FlightLookupForm
 * Tests conditional rendering, user interactions, and form behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import FlightLookupForm from '@/components/FlightLookupForm';

// Mock PostHog
vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    init: vi.fn(),
  },
}));

// Mock framer-motion to avoid animation issues in tests
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

describe('FlightLookupForm - Conditional Rendering', () => {
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('disruption type selection', () => {
    it('should render all four disruption type options', () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      expect(screen.getByLabelText(/Flight Delayed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Flight Cancelled/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Denied Boarding/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Seat Downgrade/i)).toBeInTheDocument();
    });

    it('should show disruption type as first question', () => {
      const { container } = render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      // Check that disruption type question appears early in the document
      const disruptionLabel = screen.getByText(/What happened to your flight/i);
      expect(disruptionLabel).toBeInTheDocument();
    });
  });

  describe('delay-specific fields', () => {
    it('should show delay fields when delay is selected', () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      const delayRadio = screen.getByLabelText(/Flight Delayed/i);
      fireEvent.click(delayRadio);

      expect(screen.getByText(/Delay Duration/i)).toBeInTheDocument();
    });

    it('should not show cancellation fields when delay is selected', () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Flight Delayed/i));

      expect(screen.queryByText(/When were you notified/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Alternative flight offered/i)).not.toBeInTheDocument();
    });
  });

  describe('cancellation-specific fields', () => {
    it('should show cancellation fields when cancellation is selected', () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

      expect(screen.getByText(/When were you notified/i)).toBeInTheDocument();
      expect(screen.getByText(/Airline offered an alternative flight/i)).toBeInTheDocument();
    });

    it('should not show delay fields when cancellation is selected', () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

      expect(screen.queryByText(/Delay Duration/i)).not.toBeInTheDocument();
    });

    it('should show alternative timing fields when alternative offered is checked', async () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

      // Initially, alternative timing fields should not be visible
      expect(screen.queryByText(/How much later did the alternative depart/i)).not.toBeInTheDocument();

      // Check alternative offered checkbox
      const checkbox = screen.getByLabelText(/Airline offered an alternative flight/i);
      fireEvent.click(checkbox);

      // Alternative timing fields should now be visible
      await waitFor(() => {
        expect(screen.getByText(/How much later did the alternative depart/i)).toBeInTheDocument();
      });
    });

    it('should hide alternative timing fields when alternative offered is unchecked', async () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

      const checkbox = screen.getByLabelText(/Airline offered an alternative flight/i);

      // Check it
      fireEvent.click(checkbox);
      await waitFor(() => {
        expect(screen.getByText(/How much later did the alternative depart/i)).toBeInTheDocument();
      });

      // Uncheck it
      fireEvent.click(checkbox);
      await waitFor(() => {
        expect(screen.queryByText(/How much later did the alternative depart/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('denied boarding-specific fields', () => {
    it('should show denied boarding fields when denied boarding is selected', () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Denied Boarding/i));

      expect(screen.getByText(/Type of Denied Boarding/i)).toBeInTheDocument();
      expect(screen.getByText(/Reason for denied boarding/i)).toBeInTheDocument();
    });

    it('should show alternative arrival delay radio buttons when alternative offered', async () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Denied Boarding/i));

      // Check alternative offered
      const checkbox = screen.getByLabelText(/Airline offered an alternative flight/i);
      fireEvent.click(checkbox);

      // Check for radio button options
      await waitFor(() => {
        expect(screen.getByLabelText(/Within 1 hour/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/1-2 hours/i)).toBeInTheDocument();
      });
    });
  });

  describe('downgrade-specific fields', () => {
    it('should show downgrade fields when downgrade is selected', async () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Seat Downgrade/i));

      await waitFor(() => {
        expect(screen.getByText(/Class Paid For/i)).toBeInTheDocument();
        expect(screen.getByText(/Class Received/i)).toBeInTheDocument();
      });
    });
  });
});

describe('FlightLookupForm - Auto-Calculations', () => {
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notice period auto-calculation', () => {
    it('should auto-calculate notice period from dates', async () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

      // Set departure date
      const departureInput = screen.getByLabelText(/Departure Date/i);
      fireEvent.change(departureInput, { target: { value: '2024-01-15' } });

      // Set notification date (5 days before)
      const notificationInput = screen.getByLabelText(/When were you notified/i);
      fireEvent.change(notificationInput, { target: { value: '2024-01-10' } });

      // Check for auto-calculated result
      await waitFor(() => {
        expect(screen.getByText(/✓ Calculated: Less than 7 days notice/i)).toBeInTheDocument();
        expect(screen.getByText(/5 days before departure/i)).toBeInTheDocument();
      });
    });

    it('should show edit button for auto-calculated notice period', async () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

      // Set dates
      fireEvent.change(screen.getByLabelText(/Departure Date/i), { target: { value: '2024-01-15' } });
      fireEvent.change(screen.getByLabelText(/When were you notified/i), { target: { value: '2024-01-10' } });

      // Wait for calculation
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });

    it('should show dropdown when edit is clicked', async () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

      fireEvent.change(screen.getByLabelText(/Departure Date/i), { target: { value: '2024-01-15' } });
      fireEvent.change(screen.getByLabelText(/When were you notified/i), { target: { value: '2024-01-10' } });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      // Click edit
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      // Dropdown should appear
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });
  });

  describe('alternative timing calculated summary', () => {
    it('should show calculated summary for alternative timing', async () => {
      render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

      fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));
      fireEvent.click(screen.getByLabelText(/Airline offered an alternative flight/i));

      await waitFor(() => {
        expect(screen.getByText(/How much later did the alternative depart/i)).toBeInTheDocument();
      });

      // Fill in alternative timing
      const depHoursInputs = screen.getAllByPlaceholderText('0');
      fireEvent.change(depHoursInputs[0], { target: { value: '3' } });  // Departure hours
      fireEvent.change(depHoursInputs[1], { target: { value: '25' } }); // Departure minutes

      // Check for calculated summary
      await waitFor(() => {
        expect(screen.getByText(/✓ Calculated: Alternative departed/i)).toBeInTheDocument();
      });
    });
  });
});

describe('FlightLookupForm - Visual Route Grouping', () => {
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  it('should show airplane icon between airport fields', () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    expect(screen.getByText(/Route/i)).toBeInTheDocument();
    // Check for airplane emoji in the DOM
    const airplaneIcon = screen.getByText(/✈️/);
    expect(airplaneIcon).toBeInTheDocument();
  });
});

describe('FlightLookupForm - Collapsible Info Boxes', () => {
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show collapsed cancellation rights info box', () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

    expect(screen.getByText(/📖 Learn about your cancellation rights/i)).toBeInTheDocument();
  });

  it('should expand info box when clicked', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

    // Initially collapsed
    expect(screen.queryByText(/Less than 7 days notice: Usually eligible/i)).not.toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByText(/📖 Learn about your cancellation rights/i);
    fireEvent.click(expandButton);

    // Content should be visible
    await waitFor(() => {
      expect(screen.getByText(/Less than 7 days notice/i)).toBeInTheDocument();
    });
  });

  it('should collapse info box when clicked again', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

    const expandButton = screen.getByText(/📖 Learn about your cancellation rights/i);

    // Expand
    fireEvent.click(expandButton);
    await waitFor(() => {
      expect(screen.getByText(/Less than 7 days notice/i)).toBeInTheDocument();
    });

    // Collapse
    fireEvent.click(expandButton);
    await waitFor(() => {
      expect(screen.queryByText(/Less than 7 days notice/i)).not.toBeInTheDocument();
    });
  });
});

describe('FlightLookupForm - Ticket Price with Round-Trip', () => {
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  it('should show round-trip checkbox for denied boarding', () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Denied Boarding/i));

    expect(screen.getByLabelText(/This was a round-trip ticket/i)).toBeInTheDocument();
  });

  it('should show round-trip checkbox for downgrade', () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Seat Downgrade/i));

    expect(screen.getByLabelText(/This was a round-trip ticket/i)).toBeInTheDocument();
  });

  it('should show dollar sign prefix for ticket price', () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Denied Boarding/i));

    // Check for $ symbol near ticket price field
    expect(screen.getByText('$')).toBeInTheDocument();
  });
});

describe('FlightLookupForm - Validation', () => {
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for API calls
    global.fetch = vi.fn() as any;
  });

  it('should show validation errors for empty required fields', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Flight Delayed/i));

    // Try to submit without filling fields
    const submitButton = screen.getByRole('button', { name: /Check My Compensation/i });
    fireEvent.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Flight number is required/i)).toBeInTheDocument();
    });
  });

  it('should validate flight number format', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    const flightNumberInput = screen.getByLabelText(/Flight Number/i);

    // Enter invalid flight number
    fireEvent.change(flightNumberInput, { target: { value: '123' } });
    fireEvent.blur(flightNumberInput);

    await waitFor(() => {
      expect(screen.getByText(/Invalid flight number format/i)).toBeInTheDocument();
    });
  });

  it('should clear error when user starts typing', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    const flightNumberInput = screen.getByLabelText(/Flight Number/i);

    // Enter invalid, trigger error
    fireEvent.change(flightNumberInput, { target: { value: '123' } });
    fireEvent.blur(flightNumberInput);

    await waitFor(() => {
      expect(screen.getByText(/Invalid flight number format/i)).toBeInTheDocument();
    });

    // Start typing correct value
    fireEvent.change(flightNumberInput, { target: { value: 'BA' } });

    // Error should clear
    await waitFor(() => {
      expect(screen.queryByText(/Invalid flight number format/i)).not.toBeInTheDocument();
    });
  });
});

describe('FlightLookupForm - PostHog Tracking', () => {
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();
  let posthogMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mocked module
    const posthogModule = await import('posthog-js');
    posthogMock = posthogModule.default;
  });

  it('should track disruption type selection', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Flight Delayed/i));

    await waitFor(() => {
      expect(posthogMock.capture).toHaveBeenCalledWith('disruption_type_selected', {
        type: 'delay'
      });
    });
  });

  it('should track info box expansion', async () => {
    render(<FlightLookupForm onResults={mockOnResults} onLoading={mockOnLoading} />);

    fireEvent.click(screen.getByLabelText(/Flight Cancelled/i));

    const expandButton = screen.getByText(/📖 Learn about your cancellation rights/i);
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(posthogMock.capture).toHaveBeenCalledWith('info_box_expanded', {
        type: 'cancellation_rights'
      });
    });
  });
});
