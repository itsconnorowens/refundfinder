import { trustBadges } from '@/lib/statistics';

interface TrustBadgeProps {
  badgeId: string;
  className?: string;
}

export function TrustBadge({ badgeId, className = "" }: TrustBadgeProps) {
  const badge = trustBadges.find(b => b.id === badgeId);
  
  if (!badge) return null;

  return (
    <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
      <span className="text-sm">{badge.icon}</span>
      <span className="text-sm font-medium">{badge.label}</span>
    </div>
  );
}

interface TrustBadgeRowProps {
  className?: string;
}

export function TrustBadgeRow({ className = "" }: TrustBadgeRowProps) {
  return (
    <div className={`flex flex-wrap justify-center items-center gap-6 ${className}`}>
      {trustBadges.map((badge) => (
        <TrustBadge key={badge.id} badgeId={badge.id} />
      ))}
    </div>
  );
}
