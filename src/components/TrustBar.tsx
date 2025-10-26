import { statistics } from '@/lib/statistics';
import { TrustBadgeRow } from './TrustBadge';

interface TrustBarProps {
  className?: string;
}

export function TrustBar({ className = "" }: TrustBarProps) {
  return (
    <section className={`bg-slate-900 py-8 border-y border-slate-800 ${className}`}>
      <div className="container mx-auto px-5">
        <div className="flex flex-wrap justify-center items-center gap-8 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-[#00D9B5]">✓</span>
            <span>{statistics.totalTravelers}+ Claims Processed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00D9B5]">✓</span>
            <span>{statistics.totalRecovered} Recovered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00D9B5]">✓</span>
            <span>{statistics.successRate} Success Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00D9B5]">✓</span>
            <span>Stripe Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00D9B5]">✓</span>
            <span>GDPR Compliant</span>
          </div>
        </div>
        
        {/* Trust Badges Row */}
        <div className="mt-6">
          <TrustBadgeRow />
        </div>
      </div>
    </section>
  );
}
