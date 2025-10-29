import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
              <p>
                We collect the following types of information:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Personal Information:</strong> Name, email address, phone number, mailing address</li>
                <li><strong>Flight Information:</strong> Flight number, airline, dates, airports, delay details</li>
                <li><strong>Documents:</strong> Boarding passes, delay proof, receipts (uploaded by you)</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we don't store card details)</li>
                <li><strong>Usage Data:</strong> How you interact with our website and services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <p>
                We use your information to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Process your compensation claim</li>
                <li>Communicate with airlines on your behalf</li>
                <li>Send you updates about your claim status</li>
                <li>Process payments and refunds</li>
                <li>Improve our services</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="mt-3">
                <strong>Legal Basis for Processing (GDPR):</strong> We process your personal data based on:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Contract:</strong> To provide the service you've requested</li>
                <li><strong>Legitimate Interest:</strong> To improve our services and prevent fraud</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Information Sharing</h2>
              <p>
                We may share your information with:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Airlines:</strong> To submit your compensation claim</li>
                <li><strong>Payment Processors:</strong> Stripe for payment processing</li>
                <li><strong>Data Storage:</strong> Airtable for claim management</li>
                <li><strong>Legal Authorities:</strong> If required by law</li>
              </ul>
              <p className="mt-3">
                We do not sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure file storage with access controls</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Process your compensation claim</li>
                <li>Provide customer support</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
              </ul>
              <p className="mt-3">
                Typically, we retain data for 90 days after claim closure, or 14 days if the claim is refunded and not filed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights (GDPR/UK GDPR)</h2>
              <p>
                If you are in the EU or UK, you have the following rights:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Objection:</strong> Object to processing of your personal data</li>
                <li><strong>Restriction:</strong> Request limitation of processing</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
              </ul>
              <p className="mt-3">
                <strong>How to Exercise Your Rights:</strong> Contact us at privacy@flghtly.com with your request. We will respond within 30 days (or 1 month for UK residents).
              </p>
              <p className="mt-3">
                <strong>Right to Complain:</strong> You have the right to lodge a complaint with your local data protection authority if you believe we have not handled your data properly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Remember your form data (localStorage)</li>
                <li>Analyze website usage (anonymized)</li>
                <li>Improve website performance</li>
              </ul>
              <p className="mt-3">
                You can disable cookies in your browser settings, but this may affect website functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Third-Party Services</h2>
              <p>
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Stripe:</strong> Payment processing (see Stripe's privacy policy)</li>
                <li><strong>Airtable:</strong> Data storage (see Airtable's privacy policy)</li>
                <li><strong>Vercel:</strong> Website hosting (see Vercel's privacy policy)</li>
                <li><strong>Anthropic:</strong> AI processing (see Anthropic's privacy policy)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Data Breach Notification</h2>
              <p>
                In the event of a data breach that may affect your personal information, we will:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Notify you within 72 hours of becoming aware of the breach</li>
                <li>Provide details of what information was affected</li>
                <li>Explain the steps we're taking to address the breach</li>
                <li>Advise you on protective measures you can take</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Children's Privacy</h2>
              <p>
                Our service is not intended for children under 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. EU Representative</h2>
              <p>
                As a US-based company processing personal data of EU residents, we have appointed an EU Representative to act as our point of contact for EU data protection matters:
              </p>
              <div className="bg-slate-700 rounded-lg p-4 mt-3">
                <p><strong>EU Representative:</strong> eu-representative@flghtly.com</p>
                <p><strong>Purpose:</strong> To liaise with EU data protection authorities and data subjects</p>
                <p><strong>Response Time:</strong> We will respond to EU Representative inquiries within 72 hours</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">13. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-700 rounded-lg p-4 mt-3">
                <p><strong>Email:</strong> privacy@flghtly.com</p>
                <p><strong>Support:</strong> claims@flghtly.com</p>
                <p><strong>Data Protection Officer:</strong> dpo@flghtly.com</p>
                <p><strong>EU Representative:</strong> eu-representative@flghtly.com</p>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/">
            <Button
              variant="outline"
              className="text-slate-400 border-slate-600 hover:text-white hover:border-slate-500"
            >
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
