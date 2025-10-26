import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using RefundFinder ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>
                RefundFinder is a service that helps passengers claim compensation for flight delays and cancellations under EU Regulation 261/2004 and other applicable laws. We assist in the preparation and submission of compensation claims to airlines on behalf of passengers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Service Fee</h2>
              <p>
                Our service fee is $49 per claim. This fee is charged only after you have successfully submitted your claim through our platform. We operate on a "no win, no fee" basis - if we are unable to file your claim successfully, you will receive a full refund.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Eligibility</h2>
              <p>
                Compensation eligibility depends on various factors including flight route, delay duration, and circumstances. We provide initial eligibility assessments, but final determination rests with the airline. We cannot guarantee that your claim will be successful.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Your Responsibilities</h2>
              <p>
                You are responsible for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Providing accurate and complete information</li>
                <li>Supplying required documentation (boarding passes, delay proof)</li>
                <li>Responding to requests for additional information</li>
                <li>Keeping your contact information up to date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Our Responsibilities</h2>
              <p>
                We will:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>File your claim with the airline within 48 hours of payment</li>
                <li>Keep you updated on the progress of your claim</li>
                <li>Handle all communication with the airline</li>
                <li>Provide a full refund if we cannot file your claim</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Refund Policy</h2>
              <p>
                You are entitled to a full refund if:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>We are unable to file your claim within 48 hours</li>
                <li>Your claim is rejected due to our error</li>
                <li>You request a refund within 24 hours of payment</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Data Protection</h2>
              <p>
                We collect and process your personal data in accordance with our Privacy Policy. We will only use your data for the purpose of processing your compensation claim and will not share it with third parties except as necessary for claim processing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
              <p>
                Our liability is limited to the service fee paid. We are not responsible for any losses, damages, or expenses beyond the amount you paid for our service. We cannot guarantee the outcome of your claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated revision date. Your continued use of the service constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-slate-700 rounded-lg p-4 mt-3">
                <p><strong>Email:</strong> legal@refundfinder.com</p>
                <p><strong>Support:</strong> support@refundfinder.com</p>
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
