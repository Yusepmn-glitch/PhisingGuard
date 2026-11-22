import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  statusVariant?: 'primary' | 'danger' | 'success' | 'warning' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  statusVariant = 'primary',
}) => {
  const getBadgeStyle = () => {
    switch (statusVariant) {
      case 'danger':
        return 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25';
      case 'success':
        return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25';
      case 'warning':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25';
      case 'info':
        return 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/25';
      default:
        return 'text-[#818CF8] bg-[#6366F1]/10 border-[#6366F1]/25';
    }
  };

  const getIconContainerStyle = () => {
    switch (statusVariant) {
      case 'danger':
        return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30';
      case 'success':
        return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30';
      case 'warning':
        return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30';
      case 'info':
        return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30';
      default:
        return 'bg-[#6366F1]/10 text-[#22D3EE] border-[#6366F1]/30';
    }
  };

  return (
    <div className="bg-[#1A1D27] border border-[#2E3347] rounded-xl p-5 hover:border-[#6366F1]/40 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${getIconContainerStyle()}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] font-mono tracking-tight">{value}</span>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle()}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-[#64748B] flex items-center gap-1.5">
          <span>{subtitle}</span>
        </p>
      )}
    </div>
  );
};
