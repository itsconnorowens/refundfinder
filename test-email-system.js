#!/usr/bin/env node
/**
 * Email System Test Script
 * Tests all email functionality for Flghtly
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  log('\n================================', 'blue');
  log('  Flghtly Email System Test', 'blue');
  log('================================\n', 'blue');

  // Get test email address
  const testEmail = await prompt('Enter your email address for testing: ');
  
  if (!testEmail || !testEmail.includes('@')) {
    log('❌ Invalid email address', 'red');
    process.exit(1);
  }

  log('\n📋 Test Plan:', 'yellow');
  log('1. Test sending from app (Resend API)');
  log('2. Instructions for testing email forwarding');
  log('3. Instructions for testing Gmail "Send As"');
  log('4. DNS verification commands\n');

  const proceed = await prompt('Start testing? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    log('Test cancelled', 'yellow');
    process.exit(0);
  }

  // Test 1: Send via API
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 1: Sending Email via Resend API', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('Attempting to send test email...');

  try {
    const response = await fetch('http://localhost:3000/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: testEmail,
        type: 'test'
      })
    });

    const result = await response.json();

    if (response.ok) {
      log('✅ Email sent successfully!', 'green');
      log(`   Check ${testEmail} for test email`, 'green');
      log('   From: claims@flghtly.com', 'green');
      log('   Subject: Test Email from Flghtly\n', 'green');
    } else {
      log('❌ Failed to send email', 'red');
      log(`   Error: ${result.error || 'Unknown error'}`, 'red');
      log('   Check your RESEND_API_KEY in .env.local\n', 'red');
    }
  } catch (error) {
    log('❌ Error connecting to server', 'red');
    log('   Make sure dev server is running: npm run dev\n', 'red');
    log(`   Error: ${error.message}\n`, 'red');
  }

  const gotEmail = await prompt('Did you receive the test email? (y/n): ');
  if (gotEmail.toLowerCase() === 'y') {
    log('✅ Test 1 PASSED\n', 'green');
  } else {
    log('❌ Test 1 FAILED\n', 'red');
    log('Troubleshooting:', 'yellow');
    log('  1. Check spam folder');
    log('  2. Verify RESEND_API_KEY in .env.local');
    log('  3. Check Resend dashboard: https://resend.com/emails');
    log('  4. Verify domain is verified in Resend\n');
  }

  // Test 2: Forwarding
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 2: Email Forwarding', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('Instructions:', 'yellow');
  log('1. From another email account, send an email TO: claims@flghtly.com');
  log('2. Subject: "Test Forwarding"');
  log('3. Wait 30-60 seconds');
  log(`4. Check if it arrives in ${testEmail}\n`);

  const gotForward = await prompt('Did the forwarded email arrive? (y/n): ');
  if (gotForward.toLowerCase() === 'y') {
    log('✅ Test 2 PASSED\n', 'green');
  } else {
    log('❌ Test 2 FAILED\n', 'red');
    log('Troubleshooting:', 'yellow');
    log('  1. Check Namecheap email forwarding is set up');
    log('  2. Verify catch-all or specific forward exists');
    log('  3. Wait longer (can take 5 minutes)');
    log('  4. Check spam folder');
    log('  5. Verify MX records point to Namecheap\n');
  }

  // Test 3: Gmail Send As
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 3: Gmail "Send As"', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('Instructions:', 'yellow');
  log('1. Open Gmail');
  log('2. Click "Compose"');
  log('3. In "From" dropdown, select "claims@flghtly.com"');
  log(`4. Send test email to ${testEmail}`);
  log('5. Check email headers (Show original) for SPF/DKIM\n');

  const hasGmailSetup = await prompt('Have you set up Gmail "Send As"? (y/n): ');
  if (hasGmailSetup.toLowerCase() === 'n') {
    log('\nGmail "Send As" Setup:', 'yellow');
    log('1. Gmail Settings → Accounts and Import');
    log('2. "Send mail as" → "Add another email address"');
    log('3. Email: claims@flghtly.com');
    log('4. SMTP Server: smtp.resend.com');
    log('5. Port: 587');
    log('6. Username: resend');
    log('7. Password: [Your Resend API Key]');
    log('8. Verify the address\n');
  }

  const sentFromGmail = await prompt('Did you send email from Gmail? (y/n): ');
  if (sentFromGmail.toLowerCase() === 'y') {
    const passed = await prompt('Did it show From: claims@flghtly.com? (y/n): ');
    if (passed.toLowerCase() === 'y') {
      log('✅ Test 3 PASSED\n', 'green');
    } else {
      log('❌ Test 3 FAILED\n', 'red');
    }
  } else {
    log('⏭️  Test 3 SKIPPED\n', 'yellow');
  }

  // DNS Verification
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('DNS VERIFICATION COMMANDS', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('Run these commands to verify DNS:', 'yellow');
  log('\n# Check MX records:');
  log('  dig MX flghtly.com +short\n', 'blue');
  
  log('# Check SPF:');
  log('  dig TXT flghtly.com +short | grep spf1\n', 'blue');
  
  log('# Check DKIM:');
  log('  dig TXT resend._domainkey.flghtly.com +short\n', 'blue');
  
  log('# Check DMARC:');
  log('  dig TXT _dmarc.flghtly.com +short\n', 'blue');

  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('Next Steps:', 'yellow');
  log('1. Review EMAIL_TESTING_GUIDE.md for detailed testing');
  log('2. Test email deliverability at https://www.mail-tester.com/');
  log('3. Verify DNS at https://mxtoolbox.com/');
  log('4. Update Vercel environment variables for production');
  log('5. Test on production domain after deployment\n');

  log('For detailed troubleshooting, see:', 'yellow');
  log('  ./EMAIL_TESTING_GUIDE.md\n');

  rl.close();
}

// Run the test
main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});

