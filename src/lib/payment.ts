import Stripe from "stripe";

// Initialize Stripe (with fallback for testing)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover",
    })
  : null;

export interface PaymentData {
  email: string;
  claimId: string;
  firstName: string;
  lastName: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates payment data before creating a payment intent
 */
export function validatePaymentData(
  data: Partial<PaymentData>
): PaymentValidationResult {
  const errors: string[] = [];

  if (!data.email) {
    errors.push("Email is required");
  } else if (!isValidEmail(data.email)) {
    errors.push("Invalid email format");
  }

  if (!data.claimId) {
    errors.push("Claim ID is required");
  }

  if (!data.firstName) {
    errors.push("First name is required");
  }

  if (!data.lastName) {
    errors.push("Last name is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format using regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  // More strict email validation that rejects consecutive dots
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  // Additional check for consecutive dots
  if (email.includes("..")) {
    return false;
  }
  return true;
}

/**
 * Creates a payment intent with Stripe
 */
export async function createPaymentIntent(
  data: PaymentData
): Promise<PaymentIntentResponse> {
  const validation = validatePaymentData(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 4900, // $49.00 in cents
    currency: "usd",
    metadata: {
      claimId: data.claimId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Retrieves a payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Cancels a payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }
  return await stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Formats amount from cents to dollars
 */
export function formatAmount(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

/**
 * Converts dollars to cents
 */
export function convertToCents(amountInDollars: number): number {
  return Math.round(amountInDollars * 100);
}

/**
 * Validates card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  if (!cardNumber || typeof cardNumber !== "string") {
    return false;
  }

  // Remove spaces and non-digits
  const cleaned = cardNumber.replace(/\D/g, "");

  // Check if it's a valid length (13-19 digits)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validates expiry date (MM/YY format)
 */
export function validateExpiryDate(expiryDate: string): boolean {
  if (!expiryDate || typeof expiryDate !== "string") {
    return false;
  }

  const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!regex.test(expiryDate)) {
    return false;
  }

  const [month, year] = expiryDate.split("/");
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  const expYear = parseInt(year);
  const expMonth = parseInt(month);

  if (
    expYear < currentYear ||
    (expYear === currentYear && expMonth < currentMonth)
  ) {
    return false;
  }

  return true;
}

/**
 * Validates CVC (3-4 digits)
 */
export function validateCVC(cvc: string): boolean {
  if (!cvc || typeof cvc !== "string") {
    return false;
  }
  const regex = /^\d{3,4}$/;
  return regex.test(cvc);
}

/**
 * Gets card type from card number
 */
export function getCardType(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, "");

  if (cleaned.startsWith("4")) return "visa";
  if (cleaned.startsWith("5") || cleaned.startsWith("2")) return "mastercard";
  if (cleaned.startsWith("3")) return "amex";
  if (cleaned.startsWith("6")) return "discover";

  return "unknown";
}
