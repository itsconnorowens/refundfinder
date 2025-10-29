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
                By accessing and using Flghtly ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>
                Flghtly is a service that provides <strong>assistance</strong> to passengers in claiming compensation for flight delays and cancellations under EU Regulation 261/2004, UK CAA regulations, and other applicable consumer protection laws. We assist in the preparation and submission of compensation claims to airlines on behalf of passengers. <strong>We do not provide legal advice or representation.</strong>
              </p>
              <p className="mt-3 text-yellow-400">
                <strong>Important:</strong> This service is provided for informational and assistance purposes only. We are not a law firm and do not provide legal advice. For legal advice regarding your specific situation, please consult with a qualified attorney.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Service Fee & Refund Guarantee</h2>
              <p>
                Our service fee is $49 per claim, charged upfront when you submit your claim. We operate with a <strong className="text-[#00D9B5]">100% refund guarantee</strong> - if we are unable to file your claim successfully, you will receive a full automatic refund.
              </p>
              <p className="mt-3">
                <strong>Refund Triggers:</strong> You are entitled to a full refund if:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li>We fail to file your claim within 48 hours of payment</li>
                <li>Your claim is rejected due to our error or insufficient documentation on our part</li>
                <li>You request a refund within 24 hours of payment</li>
                <li>We determine your flight is not eligible after payment (due to our assessment error)</li>
                <li>System errors prevent us from processing your claim</li>
              </ul>
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
                <li>Process automatic refunds when refund triggers are met</li>
                <li>Maintain accurate records of all claim activities</li>
                <li>Provide customer support for refund-related inquiries</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Refund Policy & Processing</h2>
              <p>
                <strong>Automatic Refunds:</strong> Refunds are processed automatically when refund triggers are met. You do not need to request a refund in most cases.
              </p>
              <p className="mt-3">
                <strong>Refund Processing Time:</strong> Refunds are processed through Stripe and typically appear in your account within 5-10 business days, depending on your bank's processing time.
              </p>
              <p className="mt-3">
                <strong>Refund Scenarios:</strong> You are entitled to a full refund if:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li>We fail to file your claim within 48 hours of payment</li>
                <li>Your claim is rejected due to our error or insufficient documentation on our part</li>
                <li>You request a refund within 24 hours of payment</li>
                <li>We determine your flight is not eligible after payment (due to our assessment error)</li>
                <li>System errors prevent us from processing your claim</li>
                <li>Duplicate claims are detected</li>
              </ul>
              <p className="mt-3 text-yellow-400">
                <strong>Note:</strong> Refunds are not available if your claim is rejected by the airline due to extraordinary circumstances (weather, air traffic control, security) or if you provide false information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Data Protection & International Compliance</h2>
              <p>
                We collect and process your personal data in accordance with our Privacy Policy and applicable data protection laws, including GDPR (for EU residents), UK GDPR (for UK residents), and other applicable consumer protection regulations. We will only use your data for the purpose of processing your compensation claim and will not share it with third parties except as necessary for claim processing.
              </p>
              <p className="mt-3">
                <strong>EU/UK Residents:</strong> You have specific rights under GDPR/UK GDPR, including the right to access, rectify, erase, and port your data. See our Privacy Policy for details.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
              <p>
                Our liability is limited to the service fee paid. We are not responsible for any losses, damages, or expenses beyond the amount you paid for our service. We cannot guarantee the outcome of your claim.
              </p>
              <p className="mt-3 text-yellow-400">
                <strong>Important:</strong> We provide assistance services only. We are not liable for any legal consequences, airline decisions, or compensation outcomes. You remain responsible for verifying the accuracy of information provided and for any legal decisions you make based on our assistance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. International Consumer Rights</h2>
              <p>
                <strong>EU Residents:</strong> You have the right to withdraw from this service within 14 days of purchase under the Consumer Rights Directive. However, if you have already used our service to file a claim, this right may be limited.
              </p>
              <p className="mt-3">
                <strong>UK Residents:</strong> You have similar rights under UK consumer protection laws, including the right to withdraw within 14 days.
              </p>
              <p className="mt-3">
                <strong>Other Jurisdictions:</strong> Consumer rights vary by country. We comply with applicable local consumer protection laws in each jurisdiction where we operate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated revision date. Your continued use of the service constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-slate-700 rounded-lg p-4 mt-3">
                <p><strong>Email:</strong> legal@flghtly.com</p>
                <p><strong>Support:</strong> claims@flghtly.com</p>
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
