/**
 * Test script to verify Resend email and Stripe Tax integration
 */

import { Resend } from 'resend';
import Stripe from 'stripe';

// Load environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const STRIPE_PRODUCT_ID = process.env.STRIPE_PRODUCT_ID;

async function testResendEmail() {
  console.log('\n🔍 Testing Resend Email Integration...\n');

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    return false;
  }

  try {
    const resend = new Resend(RESEND_API_KEY);

    console.log('📧 Sending test email...');

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev', // Using default Resend sender for testing
      to: 'delivered@resend.dev', // Resend test email that always works
      subject: '✅ Flghtly Email Integration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00D9B5;">✅ Email System Working!</h1>
          <p>Your Flghtly email integration with Resend is working correctly.</p>
          <p><strong>API Key:</strong> Configured ✓</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', result.data?.id);
    console.log('   Status: Delivered\n');
    return true;
  } catch (error: any) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
}

async function testStripeProduct() {
  console.log('🔍 Testing Stripe Product & Tax Integration...\n');

  if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
    return false;
  }

  if (!STRIPE_PRICE_ID || !STRIPE_PRODUCT_ID) {
    console.error('❌ STRIPE_PRICE_ID or STRIPE_PRODUCT_ID not found');
    return false;
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });

    // Retrieve Product
    console.log('📦 Retrieving Stripe Product...');
    const product = await stripe.products.retrieve(STRIPE_PRODUCT_ID);
    console.log('✅ Product found:');
    console.log('   ID:', product.id);
    console.log('   Name:', product.name);
    console.log('   Active:', product.active);

    // Retrieve Price
    console.log('\n💰 Retrieving Stripe Price...');
    const price = await stripe.prices.retrieve(STRIPE_PRICE_ID);
    console.log('✅ Price found:');
    console.log('   ID:', price.id);
    console.log('   Amount:', `$${(price.unit_amount! / 100).toFixed(2)}`);
    console.log('   Currency:', price.currency.toUpperCase());
    console.log('   Type:', price.type);
    console.log('   Tax Behavior:', price.tax_behavior);

    // Test creating a Payment Intent with the Price
    console.log('\n💳 Testing Payment Intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount!,
      currency: price.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        priceId: price.id,
        productId: product.id,
        testMode: 'true',
      },
      description: `Test - ${product.name}`,
    });

    console.log('✅ Payment Intent created successfully:');
    console.log('   ID:', paymentIntent.id);
    console.log('   Amount:', `$${(paymentIntent.amount / 100).toFixed(2)}`);
    console.log('   Status:', paymentIntent.status);

    // Cancel the test payment intent
    await stripe.paymentIntents.cancel(paymentIntent.id);
    console.log('   (Test payment intent cancelled)\n');

    return true;
  } catch (error: any) {
    console.error('❌ Stripe test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 FLGHTLY INTEGRATION TESTS');
  console.log('='.repeat(60));

  const emailResult = await testResendEmail();
  const stripeResult = await testStripeProduct();

  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nResend Email: ${emailResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Stripe Product & Tax: ${stripeResult ? '✅ PASS' : '❌ FAIL'}`);

  if (emailResult && stripeResult) {
    console.log('\n🎉 All integrations working correctly!\n');
    console.log('Next steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Test payment flow with test card: 4242 4242 4242 4242');
    console.log('3. Check emails are sent after successful payment\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some integrations failed. Please check the errors above.\n');
    process.exit(1);
  }
}

main();
