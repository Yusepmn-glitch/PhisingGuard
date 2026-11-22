import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  ScanSearch, 
  History, 
  Cpu, 
  Info, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/scanner', label: 'URL Scanner', icon: ScanSearch },
    { to: '/history', label: 'Scan History', icon: History },
    { to: '/evaluation', label: 'Model Evaluation', icon: Cpu },
    { to: '/about', label: 'About System', icon: Info },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#1A1D27] border-r border-[#2E3347] flex flex-col transition-all duration-200 ease-in-out
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]'}
          ${mobileOpen ? 'w-[260px] translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#2E3347]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#22D3EE] p-[1.5px] shrink-0">
              <div className="w-full h-full bg-[#1A1D27] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#22D3EE]" />
              </div>
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-base tracking-wide text-[#F8FAFC]">Phising Guard</span>
                <span className="text-[10px] text-[#22D3EE] font-mono tracking-wider">SENTINEL v1.0</span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button 
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30 font-semibold' 
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#252836]'
                  }
                  ${collapsed && !mobileOpen ? 'justify-center px-2' : ''}
                `}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors`} />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sentinel Model Badge */}
        {(!collapsed || mobileOpen) && (
          <div className="p-3 mx-3 mb-3 bg-[#252836] border border-[#2E3347] rounded-xl transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span className="text-xs font-semibold text-[#F8FAFC]">Random Forest Ready</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-tight">UAS Keamanan Informasi</p>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:flex items-center justify-end p-3 border-t border-[#2E3347]">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 py-2 px-2 rounded-xl bg-[#252836] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#2E3347] transition-colors text-xs font-medium cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
