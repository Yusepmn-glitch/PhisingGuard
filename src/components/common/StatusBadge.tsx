import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { ScanStatus, RiskLevel } from '../../types';

interface StatusBadgeProps {
  status: ScanStatus | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  riskLevel?: RiskLevel | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  riskLevel,
}) => {
  const isPhishing = status === 'PHISHING_DETECTED';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  if (isPhishing) {
    return (
      <span className={`inline-flex items-center rounded-md font-medium bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] shadow-xs shadow-[#EF4444]/10 ${sizeClasses[size]}`}>
        {showIcon && <ShieldAlert className={iconSizes[size]} />}
        <span>PHISHING DETECTED</span>
        {riskLevel && (
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-xs bg-[#EF4444]/20 border border-[#EF4444]/40 font-mono">
            {riskLevel}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-md font-medium bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] shadow-xs shadow-[#10B981]/10 ${sizeClasses[size]}`}>
      {showIcon && <ShieldCheck className={iconSizes[size]} />}
      <span>LEGITIMATE</span>
      {riskLevel && (
        <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-xs bg-[#10B981]/20 border border-[#10B981]/40 font-mono">
          {riskLevel}
        </span>
      )}
    </span>
  );
};
