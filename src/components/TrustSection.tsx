import { trustContent, comparisonData, ComparisonFeature } from '@/lib/trust-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, DollarSign, Lock, Users } from 'lucide-react';

interface TrustSectionProps {
  className?: string;
}

export function TrustSection({ className = "" }: TrustSectionProps) {
  return (
    <section className={`bg-slate-900 py-20 ${className}`}>
      <div className="container mx-auto px-5 sm:px-10 lg:px-15">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Trust Flghtly?
          </h2>
          <p className="text-xl text-slate-400">
            We're committed to transparency, security, and your success
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Transparent Pricing */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <DollarSign className="w-6 h-6 text-[#FB923C]" />
                {trustContent.transparentPricing.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">
                {trustContent.transparentPricing.description}
              </p>
              <ul className="space-y-2">
                {trustContent.transparentPricing.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-300">
                    <span className="text-[#FB923C]">✓</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Money-Back Guarantee */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Shield className="w-6 h-6 text-[#FB923C]" />
                {trustContent.moneyBackGuarantee.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">
                {trustContent.moneyBackGuarantee.description}
              </p>
              <ul className="space-y-2">
                {trustContent.moneyBackGuarantee.conditions.map((condition, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-300">
                    <span className="text-[#FB923C]">✓</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Secure & Compliant */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Lock className="w-6 h-6 text-[#FB923C]" />
                {trustContent.secureCompliant.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">
                {trustContent.secureCompliant.description}
              </p>
              <ul className="space-y-2">
                {trustContent.secureCompliant.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-300">
                    <span className="text-[#FB923C]">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Expert Team */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Users className="w-6 h-6 text-[#FB923C]" />
                {trustContent.expertTeam.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">
                {trustContent.expertTeam.description}
              </p>
              <ul className="space-y-2">
                {trustContent.expertTeam.credentials.map((credential, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-300">
                    <span className="text-[#FB923C]">✓</span>
                    {credential}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            How We Compare
          </h3>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 text-white font-semibold">Feature</th>
                      <th className="text-center p-4 text-[#FB923C] font-semibold">Flghtly</th>
                      <th className="text-center p-4 text-slate-400 font-semibold">Typical Competitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.features.map((feature: ComparisonFeature, index: number) => (
                      <tr key={index} className="border-b border-slate-700 last:border-b-0">
                        <td className="p-4 text-slate-300">{feature.feature}</td>
                        <td className="p-4 text-center text-[#FB923C] font-medium">{feature.flghtly}</td>
                        <td className="p-4 text-center text-slate-400">{feature.competitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
